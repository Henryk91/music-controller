from rest_framework import serializers
from .models import Room

class RoomSerialiser(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ('id', 'code', 'host', 'guest_can_pause', 'guest_can_control_volume', 'votes_to_skip', 'created_at') 


class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ('guest_can_pause', 'guest_can_control_volume', 'votes_to_skip')

class UpdateRoomSerializer(serializers.ModelSerializer):
    code = serializers.CharField(validators=[])
    class Meta:
        model = Room
        fields = ('guest_can_pause', 'guest_can_control_volume', 'votes_to_skip', 'code')