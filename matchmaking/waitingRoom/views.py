from django.shortcuts import render

# Create your views here.

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Match
from .serializers import GameResultSerializer
from django.utils import timezone
from django.http import HttpResponse

def index(request):
	return HttpResponse("Matchmaking Service")

@api_view(['POST'])
def update_game_result(request, match_id):
	match = get_object_or_404(Match, match_id=match_id)

	if match.status == Match.FINISHED:
		return Response(
			{"error": "Match already finished"},
			status=status.HTTP_400_BAD_REQUEST
		)

	serializer = GameResultSerializer(match, data=request.data, partial=True)
	if serializer.is_valid():
		try:
			serializer.save(status=Match.FINISHED)
		except Exception as e:
			return Response(
				{"error": f"Failed to save match result: {str(e)}"},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR
			)
		return Response(
			{"message": f"Match {match_id} result updated successfully"},
			status=status.HTTP_200_OK
		)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
