import os
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
        # if not value.startswith('https://the-nginx-server.com/avatars/'):
        #     raise serializers.ValidationError('Invalid avatar URL.')
        # return value

    def update(self, instance, validated_data):
        # instance.avatar_url(validated_data['new_avatar'])
        file = validated_data['new_avatar']

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

        # Step 3: Save the file to Nginx
        avatar_filename = f"user_{request.user.id}_{file.name}"
        avatar_path = os.path.join("/usr/share/nginx/media/avatars/", avatar_filename)

        with open(avatar_path, "wb+") as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        # Step 4: Return the file URL
        avatar_url = f"/media/avatars/{avatar_filename}"
        
        # Step 5: Save URL to the database
        request.user.avatar_url = avatar_url
        request.user.save(update_fields=["avatar_url"])
        
        return instance
