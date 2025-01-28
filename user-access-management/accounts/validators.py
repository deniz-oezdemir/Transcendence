from rest_framework import serializers
import re

class UserValidators:
    """Shared validation rules for user-related operations"""
    
    @staticmethod
    def validate_username(value):
        """Common username validation rules"""
        if len(value) > 20:
            raise serializers.ValidationError("Username cannot exceed 20 characters.")
        if not re.match(r'^[\w]+$', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, and underscores."
            )
        return value

    @staticmethod
    def validate_password(value):
        """Common password validation rules"""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if len(value) > 30:
            raise serializers.ValidationError("Password cannot exceed 30 characters.")
        if any(char in value for char in [' ', '/', '\\']):
            raise serializers.ValidationError(
                "Password cannot contain spaces, forward slashes, or backslashes."
            )
        return value

    @staticmethod
    def validate_avatar(value):
        """Common avatar validation rules"""
        if value:
            max_file_size = 2 * 1024 * 1024  # 2 MB
            if value.size > max_file_size:
                raise serializers.ValidationError("Avatar file size must not exceed 2MB.")

            allowed_extensions = ['jpg', 'jpeg', 'png']
            file_extension = value.name.split('.')[-1].lower()
            if file_extension not in allowed_extensions:
                raise serializers.ValidationError("Only JPG, JPEG, and PNG files are allowed.")
        return value
