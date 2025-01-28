import re
from rest_framework import serializers
from accounts.models import CustomUser
from accounts.validators import UserValidators
from accounts.serializers.user_serializer import UserSerializer

#transforms model instances into JSON. Uses the CustomUser model and outputs the table fields
class RegisterSerializer(serializers.ModelSerializer):

    #Meta class specifies:
    #-The model the serializer is linked to (model).
    #-The fields to include in or exclude from the serializer (fields or exclude) = in the JSON output.
    #-Additional options (like read-only fields).
    class Meta(UserSerializer.Meta):
        # model = CustomUser
        fields = ['username', 'password']
        # optional fields avatar_url
        extra_kwargs = {
            'password': {'write_only': True},
            'avatar_url': {'required': False, 'allow_null': True}
        }
    #validation methods validate_<fieldname> are called in order
    #result is added to the cleaned data if successful
    def validate_username(self, value):
        value = super().validate_username(value)
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_password(self, value):
        return super().validate_password(value)

    def validate_avatar_url(self, value):
        return super().validate_avatar(value)

    def validate(self, data):
        if data['password'] == data['username']:
            raise serializers.ValidationError("Password cannot be the same as username.")
        return data

    def create(self, validated_data):
        if not validated_data.get('avatar_url'):
            validated_data['avatar_url'] = 'avatars/default.png'
        user = CustomUser.objects.create_user( #create_user is a method of the CustomUser model. It ensures proper password hashing
            username=validated_data['username'],
            password=validated_data['password'],
            avatar_url=validated_data.get('avatar_url')
        )
        return user
