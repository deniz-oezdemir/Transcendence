from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers.register_serializer import RegisterSerializer
from .serializers.login_serializer import LoginSerializer
from .serializers.friend_request_serializer import FriendRequestSerializer, FriendRequestDeleteSerializer
from .serializers.profile_serializer import ProfileDataSerializer
from .serializers.change_password_serializer import ChangePasswordSerializer
from .serializers.change_username_serializer import ChangeUsernameSerializer
# from .serializers.change_avatar_serializer import ChangeAvatarSerializer
from .models import CustomUser

class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User created successfully."}, status=status.HTTP_201_CREATED)
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
            user.status = 'offline'
            user.save(update_fields=['status'])
            return Response({"message": "User logged out successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Logout failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProfileView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            user_profile = CustomUser.objects.get(id=user.id)
            serializer = ProfileDataSerializer(user_profile, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Get profile failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request):
        try:
            user = request.user
            # Delete the user's avatar file if it's not the default one
        #     if user.avatar_url and user.avatar_url.name != 'avatars/default.png':
        #         if default_storage.exists(user.avatar_url.name):  # Check if file exists
        #             default_storage.delete(user.avatar_url.name)  # Delete file
            user.delete()
            return Response({"message": "Account deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": f"Delete account failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ChangeAvatarView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        try:
            user = request.user
            user.avatar_url = request.data['avatar_url']
            user.save(update_fields=['avatar_url'])
            return Response({"message": "avatar changed successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Change avatar failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ChangeUsernameView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = ChangeUsernameSerializer(data=request.data, instance=request.user)
        if serializer.is_valid():
            serializer.update(request.user, serializer.validated_data)
            return Response({"message": "Username changed successfully."}, status=status.HTTP_200_OK)
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data, instance = request.user)
        if serializer.is_valid():
            serializer.update(request.user, serializer.validated_data)
            return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)

class FriendRequestView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FriendRequestSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Friend added."}, status=status.HTTP_201_CREATED)
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"message": error_message}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        serializer = FriendRequestDeleteSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.delete()
            return Response({"message": "Friend removed."}, status=status.HTTP_200_OK)
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"message": error_message}, status=status.HTTP_400_BAD_REQUEST)
