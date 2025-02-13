from rest_framework import serializers
from .register_serializer import RegisterSerializer
from accounts.models import CustomUser
from django.contrib.auth.hashers import check_password

class ChangeUsernameSerializer(serializers.ModelSerializer):
    new_username = RegisterSerializer().fields['username']

    class Meta:
        model = CustomUser
        fields = ['new_username']
        write_only_fields = ['new_username']

    def validate_new_username(self, value):
        if check_password(value, self.instance.password):
            raise serializers.ValidationError("You know you shouldn't do that! Try again.")
        if value == self.instance.username:
            raise serializers.ValidationError("New username cannot be the same as the current username.")
        return RegisterSerializer().validate_username(value)

    def update(self, instance, validated_data):
        instance.username = validated_data['new_username']
        instance.save(update_fields=['username'])
        return instance
