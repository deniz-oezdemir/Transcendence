import re
from rest_framework import serializers
from accounts.models import CustomUser
from django.conf import settings


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        required=True,
        min_length=3,
        max_length=20,
        error_messages={"max_length": "Username cannot exceed 20 characters."},
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        max_length=20,
        error_messages={
            "min_length": "Password must be at least 8 characters long.",
            "max_length": "Password cannot exceed 30 characters.",
        },
    )

    class Meta:
        model = CustomUser
        fields = ["username", "password", "avatar_url"]
        # write_only_fields = ['password']

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        if not re.match(r"^[\w]+$", value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, and underscores."
            )
        return value

    def validate_password(self, value):
        if any(char in value for char in [" ", "/", "\\"]):
            raise serializers.ValidationError(
                "Password cannot contain spaces, forward slashes, or backslashes."
            )
        return value

    def validate(self, data):
        if data["password"] == data["username"]:
            raise serializers.ValidationError(
                "Password cannot be the same as username."
            )
        return data

    def create(self, validated_data):
        avatar_url = f"{settings.MEDIA_URL}default.png"
        # avatar_url = f"{settings.NGINX_PUBLIC_URL}{settings.MEDIA_URL}default.png"
        # avatar_url = 'http://localhost:8000/avatars/default.png'
        user = CustomUser.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            avatar_url=avatar_url,
        )
        return user
