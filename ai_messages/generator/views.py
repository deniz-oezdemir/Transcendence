from rest_framework.views import APIView
from rest_framework.response import Response
from .services import AIMessageGenerator

class GenerateMessage(APIView):
	def __init__(self):
		self.generator = AIMessageGenerator()
		super().__init__()

	def post(self, request):
		message_type = request.data.get('type', 'game_start')

		prompts = {
				'game_start': (
				f"In a Pong game, generate a short, competitive greeting as the AI player "
				f"starting a match against another player. "
				f"Example responses:\n"
				f"'Ready to loose to a machine?'\n"
				f"'Why are you trying again?'\n"
				f"Generate a new, similar competitive greeting:"
			),
			'opponent_scored': (
				f"In a Pong game, generate a short, response as the AI player "
				f"after your opponent scored a point. "
				f"Example responses:\n"
				f"'Great shot! Your accuracy is improving!'\n"
				f"'Impressive move! Keep that up!'\n"
				f"Generate a new, similar response:"
			),
			'ai_scored': (
				f"In a Pong game, generate a short, mocking taunt as the AI player "
				f"after scoring. Example responses:\n"
				f"'Is that the best defense you've got?'\n"
				f"'Your reflexes are embarrassingly slow!'\n"
				f"'Maybe you should stick to checkers!'\n"
				f"Generate a new, similar mocking taunt:"
			),
			'game_victory': (
				f"In a Pong game, generate a short message after having won as the AI player. "
				f"Example responses:\n"
				f"'As expected, I won!'\n"
				f"'I wish you better luck in your next attempt!'\n"
				f"Generate a new, similar gloating message:"
			),
			'game_defeat': (
				f"In a Pong game, generate a short message after having lost as the AI player "
				f"Example responses:\n"
				f"'You've defeated me! Well played!'\n"
				f"'You got me this time! Congrats!'\n"
				f"Generate a new, similar defeat message:"
			)
		}

		message = self.generator.generate_message(prompts[message_type], message_type)
		return Response({'message': message})
