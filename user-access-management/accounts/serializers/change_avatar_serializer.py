from rest_framework import serializers
from accounts.models import CustomUser

class ChangeAvatarSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ['avatar_url']

    def update(self, instance, avatar_url):

        instance.avatar_url = avatar_url
        instance.save(update_fields=["avatar_url"])
        
        return instance
