# from rest_framework import serializers
# from .register_serializer import RegisterSerializer
# from accounts.models import CustomUser

# class ChangeAvatarSerializer(serializers.ModelSerializer):
#     new_avatar = RegisterSerializer().fields['avatar_url']

#     class Meta:
#         model = CustomUser
#         fields = ['new_avatar']

#     def validate_new_avatar(self, value):
#         return RegisterSerializer().validate_avatar_url(value)

#     def update(self, instance, validated_data):
#         instance.avatar_url(validated_data['new_avatar'])
#         instance.save(update_fields=['avatar'])
#         return instance