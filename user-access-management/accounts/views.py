from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers.register_serializer import RegisterSerializer
from .serializers.friend_request_serializer import FriendRequestSerializer, FriendRequestDeleteSerializer
from .serializers.login_serializer import LoginSerializer
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers.profile_serializer import ProfileDataSerializer
from .models import CustomUser

class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        print(f"Received request")
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User created successfully."}, status=status.HTTP_201_CREATED)
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"message": error_message}, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        print(f"Received request method: {request.method}")
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.save(), status=status.HTTP_200_OK)
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"message": error_message}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.auth.delete()
        request.user.status = 'offline'
        request.user.save(update_fields=['status'])
        return Response({"message": "User logged out successfully."}, status=status.HTTP_200_OK)
    
        # request.user.auth_token.delete() -> this logic would serve for manual token implementation
        # serializer = LogoutSerializer(data=request.data)
        # if serializer.is_valid():
        #     serializer.save()
        #     return Response({"message": "User logged out successfully"} , status=status.HTTP_200_OK)
        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_profile = CustomUser.objects.get(id=request.user.id)
        serializer = ProfileDataSerializer(user_profile, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
        # fields_param = request.query_params.get('fields')
        # requested_fields = fields_param.split(',') if fields_param else None
        # if not requested_fields or requested_fields == ['']:
        #     requested_fields = ['id', 'username', 'avatar_url', 'status', 'friends']
        # serializer = ProfileDataSerializer(request.user, fields=requested_fields)
        # return Response(serializer.data, status=status.HTTP_200_OK)
        #return username, user_id, avatar_url, status, friends
        # return Response({"username": request.user.username, "user_id": request.user.id, "avatar_url": request.user.avatar_url, "status": request.user.status, "friends": request.user.friends}, status=status.HTTP_200_OK)

    def put(self, request):
        pass

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({"message": "Account deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        # try:
        #     # Remove user from all friends' lists before deleting
        #     user.friends.clear()

        #     # Delete the user's avatar file if it's not the default one
        #     if user.avatar_url and user.avatar_url.name != 'avatars/default.png':
        #         if default_storage.exists(user.avatar_url.name):  # Check if file exists
        #             default_storage.delete(user.avatar_url.name)  # Delete file

        #     # Delete the user account
        #     user.delete()

        #     return Response({"message": "Account deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

        # except Exception as e:
        #     return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ChangeUsernameView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        user.username = request.data['new_username']
        user.save(update_fields=['username'])
        return Response({"message": "Username changed successfully."}, status=status.HTTP_200_OK)

class ChangePasswordView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        pass
        # user = request.user
        # user.username = request.data['username']
        # user.save(update_fields=['username'])

        #return Response({"message": "Username changed successfully."}, status=status.HTTP_200_OK)

class ChangeAvatarView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        user.avatar = request.data['avatar']
        user.save(update_fields=['avatar'])
        return Response({"message": "avatar changed successfully."}, status=status.HTTP_200_OK)

class FriendRequestView(APIView):
    #make sure the token received is valid else returns 401
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    # permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # if not request.user.is_authenticated:
        #     return Response({"message": "You must be logged in to send a friend request."}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = FriendRequestSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Friend added."}, status=status.HTTP_201_CREATED)
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"message": error_message}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        # if not request.user.is_authenticated:
        #     return Response({"message": "You must be logged in to remove a friend."}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = FriendRequestDeleteSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.delete()
            return Response({"message": "Friend removed."}, status=status.HTTP_200_OK)
        first_field = list(serializer.errors.keys())[0]
        error_message = serializer.errors[first_field][0]
        return Response({"message": error_message}, status=status.HTTP_400_BAD_REQUEST)
