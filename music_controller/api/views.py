from django.shortcuts import render
from rest_framework import generics
from .models import Room
from .serialisers import RoomSerialiser


class RoomView(generics.ListAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerialiser
