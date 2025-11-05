from django.shortcuts import render, redirect
from rest_framework.views import APIView
from requests import Request, post
from rest_framework import status
from rest_framework.response import Response
from .util import update_or_create_user_tokens, is_spotify_authenticated, get_user_tokens, execute_spotify_api_request, play_song, pause_song, skip_song, set_volume
from api.models import Room
from spotify.models import Vote

import os
from dotenv import load_dotenv

load_dotenv()  # reads the .env file

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")


class AuthURL(APIView):
    def get(self, request, fornat=None):
        scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'

        url = Request('GET', 'https://accounts.spotify.com/authorize', params={
            'scope': scopes,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID
        }).prepare().url

        return Response({'url': url}, status=status.HTTP_200_OK)


def spotify_callback(request, format=None):
    code = request.GET.get('code')
    error = request.GET.get('error')

    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    refresh_token = response.get('refresh_token')
    expires_in = response.get('expires_in')
    error = response.get('error')

    if not request.session.exists(request.session.session_key):
        request.session.create()

    update_or_create_user_tokens(
        request.session.session_key, access_token, token_type, expires_in, refresh_token)

    return redirect('frontend:')


class IsAuthenticated(APIView):
    def get(self, request, format=None):
        is_authenticated = is_spotify_authenticated(self.request.session.session_key)
        return Response({'status': is_authenticated}, status=status.HTTP_200_OK)

class CurrentSong(APIView):
    def get(self, request, format=None):
        room_code = self.request.session.get('room_code')
        rooms = Room.objects.filter(code=room_code)
        if rooms.exists():
            room = rooms[0]
        else: 
            return Response({}, status=status.HTTP_404_NOT_FOUND)
        host = room.host
        endpoint = "player/currently-playing"
        response = execute_spotify_api_request(host, endpoint)

        if 'error' in response or 'item' not in response:
            return Response({}, status=status.HTTP_204_NO_CONTENT)

        item = response.get('item')
        duration = item.get('duration_ms')
        progress = response.get('progress_ms')
        album_cover = item.get('album').get('images')[0].get('url')
        is_playing = response.get('is_playing')
        song_id = item.get('id')
        
        # Try to get volume from currently-playing response
        device = response.get('device')
        volume_percent = device.get('volume_percent') if device and device.get('volume_percent') is not None else None
        
        # If volume not in currently-playing, fetch from player endpoint
        if volume_percent is None:
            player_response = execute_spotify_api_request(host, "player")
            if 'device' in player_response and player_response.get('device'):
                volume_percent = player_response.get('device').get('volume_percent')

        artist_string = ''

        for i, artist in enumerate(item.get('artists')):
            if i > 0:
                artist_string += ', '
            name = artist.get('name')
            artist_string += name
        
        votes = Vote.objects.filter(room=room, song_id=song_id)
        user_id = self.request.session.session_key
        user_has_voted = Vote.objects.filter(
            user=user_id,
            room=room,
            song_id=song_id
        ).exists()

        song = {
            'title': item.get('name'),
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'votes': votes.count(),
            'votes_required': room.votes_to_skip,
            'id': song_id,
            'volume': volume_percent,
            'user_has_voted': user_has_voted
        }
        self.update_room_song(room, song_id)
        return Response(song, status=status.HTTP_200_OK)
    
    def update_room_song(self, room, song_id):
        current_song = room.current_song
        if current_song != song_id:
            room.current_song = song_id
            room.save(update_fields=['current_song'])
            votes = Vote.objects.filter(room=room, song_id=song_id).delete()

class PlaySong(APIView):
    def put(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if self.request.session.session_key == room.host or room.guest_can_pause:
            play_song(room.host)
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        
        return Response({}, status=status.HTTP_403_FORBIDDEN)
class PauseSong(APIView):
    def put(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if self.request.session.session_key == room.host or room.guest_can_pause:
            pause_song(room.host)
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        
        return Response({}, status=status.HTTP_403_FORBIDDEN)

class SkipSong(APIView):
    def post(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        user_id = self.request.session.session_key
        current_song_id = room.current_song
        
        # Check if user has already voted for this song
        existing_vote = Vote.objects.filter(
            user=user_id, 
            room=room, 
            song_id=current_song_id
        ).first()
        
        # If user has already voted (and is not host), do nothing
        if existing_vote and user_id != room.host:
            return Response({'message': 'You have already voted to skip this song'}, status=status.HTTP_200_OK)
        
        votes = Vote.objects.filter(room=room, song_id=current_song_id)
        votes_needed = room.votes_to_skip

        # Host can always skip
        if user_id == room.host:
            votes.delete()
            skip_song(room.host)
        # If adding this vote would reach the threshold, skip the song
        elif votes.count() + 1 >= votes_needed:
            votes.delete()
            skip_song(room.host)
        else:
            # User hasn't voted yet, create a new vote
            try:
                vote = Vote(user=user_id, room=room, song_id=current_song_id)
                vote.save()
            except Exception as e:
                # Vote already exists (race condition or unique constraint violation), ignore
                pass
        
        return Response({}, status=status.HTTP_204_NO_CONTENT)

class SetVolume(APIView):
    def put(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)
        if not room.exists():
            return Response({}, status=status.HTTP_404_NOT_FOUND)
        
        room = room[0]
        volume_percent = request.data.get('volume_percent')
        
        if volume_percent is None:
            return Response({'Bad Request': 'volume_percent parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Ensure volume is between 0 and 100
        volume_percent = max(0, min(100, int(volume_percent)))
        
        if self.request.session.session_key == room.host or room.guest_can_control_volume:
            success = set_volume(room.host, volume_percent)
            if success:
                return Response({}, status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({'Error': 'Failed to set volume'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({}, status=status.HTTP_403_FORBIDDEN)
