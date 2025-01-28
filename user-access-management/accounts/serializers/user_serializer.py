from rest_framework import serializers
from django.contrib.auth import authenticate
from accounts.models import CustomUser
from accounts.validators import UserValidators

class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        required=True,
        max_length=20,
        error_messages={"max_length": "Username cannot exceed 20 characters."}
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        max_length=30,
        error_messages={
            "min_length": "Password must be at least 8 characters long.",
            "max_length": "Password cannot exceed 30 characters."
        }
    )
    avatar_url = serializers.ImageField(
        required=False,
        allow_null=True,
        error_messages={"invalid": "Please upload a valid image file."}
    )

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'avatar_url', 'status', 'friends']
        read_only_fields = ['status']

    def validate_username(self, value):
        return UserValidators.validate_username(value)
    
    def validate_password(self, value):
        return UserValidators.validate_password(value)

    def validate_avatar_url(self, value):
        return UserValidators.validate_avatar(value)
