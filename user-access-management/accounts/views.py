from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers.register_serializer import RegisterSerializer
from .serializers.friend_request_serializer import FriendRequestSerializer, FriendRequestDeleteSerializer
from .serializers.login_serializer import LoginSerializer
# from .serializers.logout_serializer import LogoutSerializer
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers.get_profile_serializer import GetProfileDataSerializer

class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        print(f"Received request")
        serializer = RegisterSerializer(data=request.data) #binds the data to the serializer
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
        # fields_param = request.query_params.get('fields')
        # requested_fields = fields_param.split(',') if fields_param else None
        # if not requested_fields or requested_fields == ['']:
        #     requested_fields = ['id', 'username', 'avatar_url', 'status', 'friends']
        # serializer = GetProfileDataSerializer(request.user, fields=requested_fields)
        # return Response(serializer.data, status=status.HTTP_200_OK)
        #return username, user_id, avatar_url, status, friends
        return Response({"username": request.user.username, "user_id": request.user.id, "avatar_url": request.user.avatar_url, "status": request.user.status, "friends": request.user.friends}, status=status.HTTP_200_OK)


    def put(self, request):
        pass

    def delete(self, request):
        pass

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
