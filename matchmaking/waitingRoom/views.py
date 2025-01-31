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
import logging

def index(request):
	return HttpResponse("Matchmaking Service")

@api_view(['POST'])
def update_game_result(request, match_id):
	logger = logging.getLogger(__name__)

	logger.info(f"Received request to update match {match_id}")
	match = get_object_or_404(Match, match_id=match_id)

	if match.status == Match.FINISHED:
		logger.warning(f"Attempt to update already finished match {match_id}")
		return Response(
			{"error": "Match already finished"},
			status=status.HTTP_400_BAD_REQUEST
		)

	logger.debug(f"Request data for match {match_id}: {request.data}")
	serializer = GameResultSerializer(match, data=request.data, partial=True)
	if serializer.is_valid():
		try:
			serializer.save(status=Match.FINISHED)
			logger.info(f"Successfully updated match {match_id} result")
		except Exception as e:
			logger.error(f"Error saving match {match_id} result: {str(e)}")
			return Response(
				{"error": f"Failed to save match result: {str(e)}"},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR
			)
		return Response(
			{"message": f"Match {match_id} result updated successfully"},
			status=status.HTTP_200_OK
		)
	logger.error(f"Invalid data for match {match_id}: {serializer.errors}")
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
