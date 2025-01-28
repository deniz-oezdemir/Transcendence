from rest_framework import serializers
from accounts.models import CustomUser

def validate_friend_username(current_user, friend_username, is_delete_operation=False):
    
    if current_user.username == friend_username:
        raise serializers.ValidationError("You cannot remove yourself as a friend." if is_delete_operation else "You cannot send a friend request to yourself.")
    if not CustomUser.objects.filter(username=friend_username).exists():
        raise serializers.ValidationError("The specified user does not exist.")
    if not is_delete_operation and current_user.friends.filter(username=friend_username).exists():
        raise serializers.ValidationError("You are already friends with this user.")
    if is_delete_operation and not current_user.friends.filter(username=friend_username).exists():
        raise serializers.ValidationError("You are not friends with this user.")
    
    return friend_username #returns the same input validated data, not objects!

class FriendRequestSerializer(serializers.Serializer):
    
    friend_username = serializers.CharField(
        min_length=1,
        max_length=150,
        required=True,
        error_messages={"blank": "Friend username cannot be empty."}
    )

    def validate_friend_username(self, friend_username):
        current_user = self.context['request'].user #instance of CustomUser
        
        return validate_friend_username(current_user, friend_username, is_delete_operation=False)
    
    def create(self):
        current_user_instance = self.context['request'].user
        friend_username = self.validated_data['friend_username']
        friend_object = CustomUser.objects.get(username=friend_username)

        current_user_instance.friends.add(friend_object) 
        
        return current_user_instance
    

class FriendRequestDeleteSerializer(serializers.Serializer):
    friend_username = serializers.CharField(
        min_length=1,
        max_length=150,
        required=True,
        error_messages={"blank": "Friend username cannot be empty."}
    )

    def validate_friend_username(self, friend_username):
        current_user = self.context['request'].user

        return validate_friend_username(current_user, friend_username, is_delete_operation=True)

    def delete(self):
        current_user_instance = self.context['request'].user
        friend_username = self.validated_data['friend_username']
        friend = CustomUser.objects.get(username=friend_username)

        current_user_instance.friends.remove(friend)

        # return current_user_instance