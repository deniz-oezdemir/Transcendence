from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token

#needs to validate the input password and update the password field in the database
class ChangePasswordSerializer(serializers.Serializer):
    password = serializers.CharField(
        write_only=True, #to not include it in the JSON output
        required=True,
        error_messages={"blank": "Password cannot be empty."}
    )

    def validate_password(self, value):
        # if len(value) < 8:
        #     raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

    def update(self, instance, validated_data):
        instance.set_password(validated_data['password'])
        instance.save()
        return instance
