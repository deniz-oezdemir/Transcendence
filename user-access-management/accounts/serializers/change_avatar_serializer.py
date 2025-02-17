import os
import time
import shutil
from django.conf import settings
from rest_framework import serializers
from .register_serializer import RegisterSerializer
from accounts.models import CustomUser

class ChangeAvatarSerializer(serializers.ModelSerializer):
    new_avatar = RegisterSerializer().fields['avatar_url']

    class Meta:
        model = CustomUser
        fields = ['new_avatar']

    def validate_new_avatar(self, file):
        return RegisterSerializer().validate_avatar(file)

    def update(self, instance, validated_data):
        # instance.avatar_url(validated_data['new_avatar'])
        avatar_file = validated_data['new_avatar']

        # # Define storage path (nginx serves from `/media/avatars/`)
        # avatar_filename = f"user_{instance.id}_{file.name}"
        # avatar_path = os.path.join("avatars", avatar_filename)
        # file_path = os.path.join(settings.MEDIA_ROOT, avatar_path)

        # # Save file to disk
        # with open(file_path, "wb+") as destination:
        #     for chunk in file.chunks():
        #         destination.write(chunk)

        # # Generate the public URL (served by nginx) and store in db
        # instance.avatar_url = settings.MEDIA_URL + avatar_path
        # instance.save(update_fields=["avatar_url"])

        # generate unique name
        avatar_filename = f"user_{instance.id}_{int(time.time())}{os.path.splitext(avatar_file.name)[1]}"

        # temporary save the file
        temp_path = os.path.join('/tmp', avatar_filename)
        with open(temp_path, 'wb+') as destination:
            for chunk in avatar_file.chunks():
                destination.write(chunk)

        # copy file to NGINX container using Docker volume
        nginx_image_path = f"/usr/share/nginx/images/{avatar_filename}"
        shutil.copy(temp_path, nginx_image_path)

        os.remove(temp_path)
        
        # generate public URL and store in db
        avatar_url = f"http://nginx:80/images/{avatar_filename}"

        instance.avatar_url = avatar_url
        instance.save(update_fields=["avatar_url"])
        
        return instance
