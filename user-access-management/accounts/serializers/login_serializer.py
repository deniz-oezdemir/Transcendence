from rest_framework import serializers
from accounts.models import CustomUser
from django.contrib.auth import authenticate
from accounts.validators import UserValidators
from accounts.serializers.user_serializer import UserSerializer

class LoginSerializer(serializers.Serializer):
    class Meta(UserSerializer.Meta):
        fields = ['username', 'password']

    def validate(self, data):
        # Apply individual field validations first
        username = self.validate_username(data.get('username'))
        password = self.validate_password(data.get('password'))

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError('Invalid username or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')
        
        user.status = 'online'
        user.save()
        
        return {
            'token': user.auth_token.key,
            'user': UserSerializer(user).data
        }