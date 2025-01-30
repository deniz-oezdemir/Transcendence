from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(
        required=True,
        error_messages={"blank": "Username cannot be empty."}
    )
    password = serializers.CharField(
        write_only=True, #to not include it in the JSON output
        required=True,
        error_messages={"blank": "Password cannot be empty."}
    )

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        user = authenticate(username=username, password=password) #returns user object
        print("user")
        if not user:
            raise serializers.ValidationError('Invalid username or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')
        data['user'] = user
        return data

    def create(self, validated_data):    
        user = validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        user.status = 'online'
        user.save(update_fields=['status'])
        
        return {
            'token': token.key,
            'user': user.username,
            'id': user.id
        }