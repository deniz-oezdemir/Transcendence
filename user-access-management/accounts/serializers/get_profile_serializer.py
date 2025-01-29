from rest_framework import serializers
from accounts.models import CustomUser

#checks which query parameters are requested, initializes the serializer with them and returns the corresponding fields
class GetProfileSerializer(serializers.ModelSerializer):
    RESTRICTED_FIELDS = ['password']

    def __init__(self, *args, **kwargs):
        requested_fields = kwargs.pop('fields', None)
        super().__init__(*args, **kwargs)

        allowed_fields = set(self.Meta.fields()) - set(self.RESTRICTED_FIELDS)

        if requested_fields:
            requested_fields_set = set(requested_fields)
            restricted_requested = requested_fields_set & set(self.RESTRICTED_FIELDS)
            if restricted_requested:
                raise serializers.ValidationError({"error": f"Restricted fields requested: {restricted_requested}"})
            for field in list(self.fields):  
                if field not in requested_fields_set:
                    self.fields.pop(field)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'avatar_url', 'status', 'friends']
