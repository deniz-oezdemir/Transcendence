from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers.register_serializer import RegisterSerializer
from .serializers.friend_request_serializer import FriendRequestSerializer, FriendRequestDeleteSerializer
from .serializers.login_serializer import LoginSerializer

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data) #binds the data to the serializer
        if serializer.is_valid(): #calls all the validation methods in the specified serializer
            user = serializer.save() #calls the create method in the specified serializer
            return Response({"message": "User created successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User logged in successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    def post(self, request):
        pass

class ProfileView(APIView):
    def get(self, request):
        pass

    def put(self, request):
        pass

    def delete(self, request):
        pass

class FriendRequestView(APIView):
    # permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"message": "You must be logged in to send a friend request."}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = FriendRequestSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Friend added."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        if not request.user.is_authenticated:
            return Response({"message": "You must be logged in to remove a friend."}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = FriendRequestDeleteSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.delete()
            return Response({"message": "Friend removed."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
