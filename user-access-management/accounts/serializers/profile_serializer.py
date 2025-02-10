from rest_framework import serializers
from accounts.models import CustomUser

class FriendSerializer(serializers.ModelSerializer):

    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'avatar_url', 'status']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar_url:
            return request.build_absolute_uri(obj.avatar_url.url) if request else obj.avatar_url.url
        return None


class ProfileDataSerializer(serializers.ModelSerializer):

    friends = FriendSerializer(many=True, read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'avatar_url', 'status', 'friends']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar_url:
            return request.build_absolute_uri(obj.avatar_url.url) if request else obj.avatar_url.url
        return None

