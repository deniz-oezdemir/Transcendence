import os
import time
import shutil
import logging
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers.register_serializer import RegisterSerializer
from .serializers.login_serializer import LoginSerializer
from .serializers.friend_request_serializer import (
    FriendRequestSerializer,
    FriendRequestDeleteSerializer,
)
from .serializers.profile_serializer import ProfileDataSerializer
from .serializers.change_password_serializer import ChangePasswordSerializer
from .serializers.change_username_serializer import ChangeUsernameSerializer
from .serializers.change_avatar_serializer import ChangeAvatarSerializer
from .models import CustomUser

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User created successfully."},
                status=status.HTTP_201_CREATED,
            )
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.save(), status=status.HTTP_200_OK)
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            if request.auth:
                request.auth.delete()
            user = request.user
            user.status = "offline"
            user.save(update_fields=["status"])
            return Response(
                {"message": "User logged out successfully."}, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": f"Logout failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProfileView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            user_profile = CustomUser.objects.get(id=user.id)
            serializer = ProfileDataSerializer(
                user_profile, context={"request": request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Get profile failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request):
        try:
            user = request.user
            # if user.avatar_url and settings.NGINX_STORAGE_URL in user.avatar_url:
            #     try:
            # Extract filename from the full URL
            filename = user.avatar_url.split(settings.MEDIA_URL)[-1]
            if filename != "default.png":
                # Construct path to avatar file in nginx images directory
                avatar_path = os.path.join(settings.MEDIA_ROOT, filename)
                # avatar_path = os.path.join(settings.NGINX_STORAGE_URL, filename)
                if os.path.exists(avatar_path):
                    os.remove(avatar_path)
                    logger.info(f"Deleted avatar file: {avatar_path}")
                # except Exception as e:
                #     logger.error(f"Error deleting avatar file: {e}")
            user.delete()
            return Response(
                {"message": "Account deleted successfully."},
                status=status.HTTP_204_NO_CONTENT,
            )
        except Exception as e:
            return Response(
                {"error": f"Delete account failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChangeAvatarView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def put(self, request):
        try:
            file = request.FILES.get("avatar")
            max_file_size = 2 * 1024 * 1024
            allowed_extensions = ["jpg", "jpeg", "png"]
            if file:
                # nginx_dir = f"{settings.MEDIA_ROOT}"
                if file.size > max_file_size:
                    raise Exception("Avatar file size must not exceed 2MB.")
                file_extension = file.name.split(".")[-1].lower()
                if file_extension not in allowed_extensions:
                    raise Exception("Only JPG, JPEG, and PNG files are allowed.")
                filename = f"user_{request.user.id}_{int(time.time())}{os.path.splitext(file.name)[1]}"
                temp_path = os.path.join("/tmp", filename)
                with open(temp_path, "wb+") as destination_file:
                    for chunk in file.chunks():
                        destination_file.write(chunk)
                # nginx_image_path = f"{settings.MEDIA_ROOT}{filename}"
                nginx_image_path = os.path.join(settings.MEDIA_ROOT, filename)
                try:
                    shutil.copy(temp_path, nginx_image_path)
                except Exception as e:
                    raise Exception(f"Failed to copy file to NGINX container: {str(e)}")
                os.remove(temp_path)
                avatar_url = (
                    f"{settings.MEDIA_URL}{filename}"
                )
                serializer = ChangeAvatarSerializer(
                    data=request.data,
                    instance=request.user,
                    context={"request": request},
                )
                serializer.update(instance=request.user, avatar_url=avatar_url)
                return Response(
                    {"message": "avatar changed successfully."},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Please upload a valid image file."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            return Response(
                {"error": f"Change avatar failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChangeUsernameView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = ChangeUsernameSerializer(data=request.data, instance=request.user)
        if serializer.is_valid():
            serializer.update(request.user, serializer.validated_data)
            return Response(
                {"message": "Username changed successfully."}, status=status.HTTP_200_OK
            )
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data, instance=request.user)
        if serializer.is_valid():
            serializer.update(request.user, serializer.validated_data)
            return Response(
                {"message": "Password changed successfully."}, status=status.HTTP_200_OK
            )
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)


class FriendRequestView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FriendRequestSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Friend added."}, status=status.HTTP_201_CREATED
            )
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        serializer = FriendRequestDeleteSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.delete()
            return Response({"message": "Friend removed."}, status=status.HTTP_200_OK)
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)
