from rest_framework import serializers
from .register_serializer import RegisterSerializer
from accounts.models import CustomUser
from django.contrib.auth.hashers import check_password

class ChangePasswordSerializer(serializers.ModelSerializer):
    new_password = RegisterSerializer().fields['password']

    class Meta:
        model = CustomUser
        fields = ['new_password']
        write_only_fields = ['new_password']

    def validate_new_password(self, value):
        if value == self.instance.username:
            raise serializers.ValidationError("New password cannot be the same as the current username.")
        if check_password(value, self.instance.password):
            raise serializers.ValidationError("New password cannot be the same as the current password.")
        return RegisterSerializer().validate_password(value)


    def update(self, instance, validated_data):
        instance.set_password(validated_data['new_password'])
        instance.save(update_fields=['password'])
        return instance
