from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers.register_serializer import RegisterSerializer
from .serializers.friend_request_serializer import FriendRequestSerializer

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data) #binds the data to the serializer
        if serializer.is_valid(): #calls all the validation methods in the specified serializer
            user = serializer.save() #calls the create method in the specified serializer
            return Response({"message": "User created successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    def post(self, request):
        pass

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
    def post(self, request):
        serializer = FriendRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Friend added."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    # def put(self, request):
    #     pass

    # def delete(self, request):
    #     pass
