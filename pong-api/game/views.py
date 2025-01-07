from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import GameStateSerializer
from .models import GameState


class CreateGame(generics.CreateAPIView):
    queryset = GameState.objects.all()
    serializer_class = GameStateSerializer

    def perform_create(self, serializer):
        # Initialize the game state with default values
        serializer.save()


class ToggleGame(generics.UpdateAPIView):
    queryset = GameState.objects.all()
    serializer_class = GameStateSerializer
    lookup_field = "id"

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_game_running = not instance.is_game_running
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GetGameState(generics.RetrieveAPIView):
    queryset = GameState.objects.all()
    serializer_class = GameStateSerializer
    lookup_field = "id"

from django.http import JsonResponse

def test_cors(request):
    return JsonResponse({'message': 'CORS test successful'})
