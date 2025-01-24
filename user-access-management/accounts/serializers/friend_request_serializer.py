from rest_framework import serializers
from accounts.models import CustomUser

class FriendRequestSerializer(serializers.ModelSerializer):
    # permission_classes = [permissions.IsAuthenticated]
    
    from_user = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        required=True,
        error_messages={"does_not_exist": "User does not exist."}
    )
    friend_id = serializers.PrimaryKeyRelatedField(
        required=True
        queryset=CustomUser.objects.all(),
        required=True,
        error_messages={"does_not_exist": "User does not exist."}
    )

    class Meta:
        model = CustomUser
        fields = ['from_user_id', 'friend_id']

    def validate_friend_id(self, data):
        # current_user = self.context['request'].user
        friend_id = data['friend_id']
        if data['from_user_id'] == friend_id: #takes the current user id from the request body 'from_user_id' field
        # if friend_id == current_user.id: #works if there's an authentication system in place
            raise serializers.ValidationError("You cannot send a friend request to yourself.")
        if not CustomUser.objects.filter(id=friend_id).exists():
            raise serializers.ValidationError("The specified user does not exist.")
        return data
    
    def create(self, validated_data):
        current_user = CustomUser.objects.get(id=self.context['request'].user)
        friend_id = validated_data['friend_id']
        friend_object = CustomUser.objects.get(id=friend_id)

        current_user.friends.add(friend_object) 
        
        return current_user