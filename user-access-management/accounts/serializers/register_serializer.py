import re
from rest_framework import serializers
from accounts.models import CustomUser

#transforms model instances into JSON. Uses the CustomUser model and outputs the table fields
class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        required=True,
        min_length=6,
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

    #Meta class specifies:
    #-The model the serializer is linked to (model).
    #-The fields to include in or exclude from the serializer (fields or exclude) = in the JSON output.
    #-Additional options (like read-only fields).
    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'avatar_url']
        # extra_kwargs = {
        #     'password': {'write_only': True},
        # }
    #validation methods validate_<fieldname> are called in order
    #result is added to the cleaned data if successful
    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        if not re.match(r'^[\w]+$', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, and underscores."
            )
        return value
    def validate_password(self, value):
        if any(char in value for char in [' ', '/', '\\']):
            raise serializers.ValidationError(
                "Password cannot contain spaces, forward slashes, or backslashes."
            )
        return value
    def validate_avatar_url(self, value):
        if value:
            max_file_size = 2 * 1024 * 1024  # 2 MB
            if value.size > max_file_size:
                raise serializers.ValidationError("Avatar file size must not exceed 2MB.")

            allowed_extensions = ['jpg', 'jpeg', 'png']
            file_extension = value.name.split('.')[-1].lower()
            if file_extension not in allowed_extensions:
                raise serializers.ValidationError("Only JPG, JPEG, and PNG files are allowed.")
        return value
    def validate(self, data):
        if data['password'] == data['username']:
            raise serializers.ValidationError("Password cannot be the same as username.")
        return data

    def create(self, validated_data):
        avatar_url = validated_data.get('avatar_url', 'avatars/default.png')
        user = CustomUser.objects.create_user( #create_user is a method of the CustomUser model. It ensures proper password hashing
            username=validated_data['username'],
            password=validated_data['password'],
            avatar_url=avatar_url
        )
        return user


# #transforms model instances into JSON. Uses the CustomUser model and outputs the table fields
# class RegisterSerializer(UserSerializer):

#     #Meta class specifies:
#     #-The model the serializer is linked to (model).
#     #-The fields to include in or exclude from the serializer (fields or exclude) = in the JSON output.
#     #-Additional options (like read-only fields).
#     class Meta(UserSerializer.Meta):
#         # model = CustomUser
#         fields = ['username', 'password', 'avatar_url']
#         # optional fields avatar_url
#         extra_kwargs = {
#             'password': {'write_only': True},
#             'avatar_url': {'required': False, 'allow_null': True}
#         }
#     #validation methods validate_<fieldname> are called in order
#     #result is added to the cleaned data if successful
#     def validate_username(self, value):
#         # value = super().validate_username(value)
#         if CustomUser.objects.filter(username=value).exists():
#             raise serializers.ValidationError("Username already exists.")
#         return value

#     # def validate_password(self, value):
#     #     return super().validate_password(value)

#     # def validate_avatar_url(self, value):
#     #     return super().validate_avatar_url(value)

#     def validate(self, data):
#         if data['password'] == data['username']:
#             raise serializers.ValidationError("Password cannot be the same as username.")
#         return data

#     def create(self, validated_data):
#         # if not validated_data.get('avatar_url'):
#         #     'avatar_url' = 'avatars/default.png'
#         avatar_url = validated_data.get('avatar_url', 'avatars/default.png')
#         user = CustomUser.objects.create_user( #create_user is a method of the CustomUser model. It ensures proper password hashing
#             username=validated_data['username'],
#             password=validated_data['password'],
#             avatar_url=avatar_url
#         )
#         return user
