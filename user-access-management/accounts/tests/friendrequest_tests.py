import pytest
from django.contrib.auth import get_user_model
from accounts.serializers.friend_request_serializer import FriendRequestSerializer, FriendRequestDeleteSerializer
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory
from rest_framework import status
from accounts.views import FriendRequestView
from rest_framework.test import APIClient
from accounts.models import CustomUser

User = get_user_model()

############################################################################################
#Tests for FriendRequestSerializer
############################################################################################

#creates 2 users
@pytest.fixture
def user1():
    return User.objects.create_user(username='user1', password='password123')

@pytest.fixture
def user2():
    return User.objects.create_user(username='user2', password='password123')

@pytest.mark.django_db
def test_friend_request_serializer_valid(user1, user2):
    data = {'friend_username': 'user2'}
    context = {'request': type('Request', (object,), {'user': user1})}
    serializer = FriendRequestSerializer(data=data, context=context)
    
    assert serializer.is_valid()
    serializer.create()
    assert user1.friends.filter(username='user2').exists()

@pytest.mark.django_db
def test_friend_request_serializer_self_request(user1):
    data = {'friend_username': 'user1'}
    context = {'request': type('Request', (object,), {'user': user1})}
    serializer = FriendRequestSerializer(data=data, context=context)
    
    with pytest.raises(ValidationError) as excinfo:
        serializer.is_valid(raise_exception=True)
    assert "You cannot send a friend request to yourself." in str(excinfo.value)

@pytest.mark.django_db
def test_friend_request_serializer_nonexistent_user(user1):
    data = {'friend_username': 'nonexistent'}
    context = {'request': type('Request', (object,), {'user': user1})}
    serializer = FriendRequestSerializer(data=data, context=context)
    
    with pytest.raises(ValidationError) as excinfo:
        serializer.is_valid(raise_exception=True)
    assert "The specified user does not exist." in str(excinfo.value)

@pytest.mark.django_db
def test_friend_request_serializer_already_friends(user1, user2):
    user1.friends.add(user2)
    data = {'friend_username': 'user2'}
    context = {'request': type('Request', (object,), {'user': user1})}
    serializer = FriendRequestSerializer(data=data, context=context)
    
    with pytest.raises(ValidationError) as excinfo:
        serializer.is_valid(raise_exception=True)
    assert "You are already friends with this user." in str(excinfo.value)

@pytest.mark.django_db
def test_friend_request_serializer_empty_username(user1):
    data = {'friend_username': ''}
    context = {'request': type('Request', (object,), {'user': user1})}
    serializer = FriendRequestSerializer(data=data, context=context)
    
    with pytest.raises(ValidationError) as excinfo:
        serializer.is_valid(raise_exception=True)
    assert "Friend username cannot be empty." in str(excinfo.value)


############################################################################################
#Tests for FriendRequestDeleteSerializer
############################################################################################

@pytest.mark.django_db
def test_friend_request_delete_serializer_valid(user1, user2):
    user1.friends.add(user2)
    data = {'friend_username': 'user2'}
    context = {'request': type('Request', (object,), {'user': user1})}
    serializer = FriendRequestDeleteSerializer(data=data, context=context)
    
    assert serializer.is_valid()
    serializer.delete()
    assert not user1.friends.filter(username='user2').exists()

@pytest.mark.django_db
def test_friend_request_delete_serializer_self_request(user1):
    data = {'friend_username': 'user1'}
    context = {'request': type('Request', (object,), {'user': user1})}
    serializer = FriendRequestDeleteSerializer(data=data, context=context)
    
    with pytest.raises(ValidationError) as excinfo:
        serializer.is_valid(raise_exception=True)
    assert "You cannot remove yourself as a friend." in str(excinfo.value)

@pytest.mark.django_db
def test_friend_request_delete_serializer_nonexistent_user(user1):
    data = {'friend_username': 'nonexistent'}
    context = {'request': type('Request', (object,), {'user': user1})}
    serializer = FriendRequestDeleteSerializer(data=data, context=context)
    
    with pytest.raises(ValidationError) as excinfo:
        serializer.is_valid(raise_exception=True)
    assert "The specified user does not exist." in str(excinfo.value)

@pytest.mark.django_db
def test_friend_request_delete_serializer_not_friends(user1, user2):
    data = {'friend_username': 'user2'}
    context = {'request': type('Request', (object,), {'user': user1})}
    serializer = FriendRequestDeleteSerializer(data=data, context=context)
    
    with pytest.raises(ValidationError) as excinfo:
        serializer.is_valid(raise_exception=True)
    assert "You are not friends with this user." in str(excinfo.value)

@pytest.mark.django_db
def test_friend_request_delete_serializer_empty_username(user1):
    data = {'friend_username': ''}
    context = {'request': type('Request', (object,), {'user': user1})}
    serializer = FriendRequestDeleteSerializer(data=data, context=context)
    
    with pytest.raises(ValidationError) as excinfo:
        serializer.is_valid(raise_exception=True)
    assert "Friend username cannot be empty." in str(excinfo.value)

############################################################################################
#Tests for FriendRequestView
############################################################################################

# mocking permissions.IsAuthenticated for now
# once token auth implemented, use APIClient 


###

# @pytest.fixture
# def user1():
#     return CustomUser.objects.create_user(username="user1", password="password1")

# @pytest.fixture
# def user2():
#     return CustomUser.objects.create_user(username="user2", password="password2")

# @pytest.fixture
# def user3():
#     return CustomUser.objects.create_user(username="user3", password="password3")

# @pytest.fixture
# def api_client():
#     return APIClient()

# @pytest.mark.django_db
# class TestFriendRequestView:

#     def test_friend_request_not_authenticated(self, api_client):
#         # Test POST request when the user is not authenticated
#         response = api_client.post("/friend-request/", data={"friend_username": "user2"})
#         assert response.status_code == status.HTTP_401_UNAUTHORIZED
#         assert response.data["message"] == "You must be logged in to send a friend request."

#     def test_friend_request_authenticated(self, api_client, user1, user2):
#         # Test POST request when the user is authenticated
#         api_client.login(username="user1", password="password1")
        
#         response = api_client.post("/friend-request/", data={"friend_username": "user2"})
#         assert response.status_code == status.HTTP_201_CREATED
#         assert response.data["message"] == "Friend added."
        
#         # Verify the friend relationship is created
#         user1.refresh_from_db()
#         user2.refresh_from_db()
#         assert user2 in user1.friends.all()
#         assert user1 in user2.friends.all()

#     def test_friend_request_to_self(self, api_client, user1):
#         # Test POST request when the user tries to add themselves
#         api_client.login(username="user1", password="password1")
        
#         response = api_client.post("/friend-request/", data={"friend_username": "user1"})
#         assert response.status_code == status.HTTP_400_BAD_REQUEST
#         assert response.data["friend_username"][0] == "You cannot send a friend request to yourself."

#     def test_friend_request_user_not_exist(self, api_client, user1):
#         # Test POST request when the user tries to add a non-existent user
#         api_client.login(username="user1", password="password1")
        
#         response = api_client.post("/friend-request/", data={"friend_username": "nonexistent_user"})
#         assert response.status_code == status.HTTP_400_BAD_REQUEST
#         assert response.data["friend_username"][0] == "The specified user does not exist."

#     def test_friend_request_duplicate(self, api_client, user1, user2):
#         # Test POST request when the user tries to add a friend they are already friends with
#         api_client.login(username="user1", password="password1")
#         user1.friends.add(user2)
        
#         response = api_client.post("/friend-request/", data={"friend_username": "user2"})
#         assert response.status_code == status.HTTP_400_BAD_REQUEST
#         assert response.data["friend_username"][0] == "You are already friends with this user."

#     def test_friend_request_delete_not_authenticated(self, api_client):
#         # Test DELETE request when the user is not authenticated
#         response = api_client.delete("/friend-request/", data={"friend_username": "user2"})
#         assert response.status_code == status.HTTP_401_UNAUTHORIZED
#         assert response.data["message"] == "You must be logged in to remove a friend."

#     def test_friend_request_delete_authenticated(self, api_client, user1, user2):
#         # Test DELETE request when the user is authenticated
#         api_client.login(username="user1", password="password1")
#         user1.friends.add(user2)
        
#         response = api_client.delete("/friend-request/", data={"friend_username": "user2"})
#         assert response.status_code == status.HTTP_200_OK
#         assert response.data["message"] == "Friend removed."

#         # Verify the friend relationship is removed
#         user1.refresh_from_db()
#         user2.refresh_from_db()
#         assert user2 not in user1.friends.all()
#         assert user1 not in user2.friends.all()
    
#     def test_friend_request_delete_not_friend(self, api_client, user1, user2):
#         # Test DELETE request when the user tries to delete a friend they are not connected with
#         api_client.login(username="user1", password="password1")
        
#         response = api_client.delete("/friend-request/", data={"friend_username": "user2"})
#         assert response.status_code == status.HTTP_400_BAD_REQUEST
#         assert response.data["friend_username"][0] == "The specified user is not in your friends list."
