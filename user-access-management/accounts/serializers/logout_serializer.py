# from rest_framework import serializers
# from django.contrib.auth import authenticate
# from rest_framework.authtoken.models import Token

#this logic would serve for manual token implementation, with a one-to-one field in the user model for the token
# class LogoutSerializer(serializers.Serializer):
#     token = serializers.CharField(
#         required=True,
#         error_messages={"blank": "Token cannot be empty."}
#     )

#     def validate(self, data):
#         token = data.get('token')
#         user = Token.objects.get(key=token).user
#         if not user:
#             raise serializers.ValidationError('Invalid token.')
#         # if not user.is_active:
#         #     raise serializers.ValidationError('This account has been deactivated.')
#         data['user'] = user
#         return data

#     def create(self, validated_data):    
#         user = validated_data['user']

#         Token.objects.filter(user=user).delete()
#         user.status = 'offline'
#         user.save(update_fields=['status'])
        
#         return user