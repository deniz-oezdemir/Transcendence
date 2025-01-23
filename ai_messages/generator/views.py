from rest_framework.views import APIView
from rest_framework.response import Response
from .services import AIMessageGenerator


class GenerateMessage(APIView):
	def __init__(self):
		self.generator = AIMessageGenerator()
		super().__init__()

	def post(self, request):
		context = request.data.get('game_context', {})
		message_type = request.data.get('type', 'game_start')

		prompts = {
				'game_start': (
				f"In a Pong game, generate a short, competitive greeting as the AI player "
				f"starting a match against another player. "
				f"Example responses:\n"
				f"'Ready to lose to a machine? Let's begin!'\n"
				f"'Initializing victory protocol... Game on!'\n"
				f"'My algorithms are warmed up and ready to win!'\n"
				f"Generate a new, different competitive greeting:"
			),
			'opponent_scored': (
				f"In a Pong game, generate a short, response as the AI player "
				f"after the opponent scored a point. Current score: {context.get('score', '0-0')}. "
				f"Example responses:\n"
				f"'Great shot! Your accuracy is improving!'\n"
				f"'Impressive move! Keep that up!'\n"
				f"'Nice one! Let's go!'\n"
				f"Generate a new, different response:"
			),
			'ai_scored': (
				f"In a Pong game, generate a short, playful taunt as the AI player "
				f"after scoring against another player. "
				f"Current score: {context.get('score', '0-0')}. "
				f"Example responses:\n"
				f"'Too slow! Need to work on those reflexes!'\n"
				f"'Did you blink and miss that one?'\n"
				f"'Maybe I'm just better than you?'\n"
				f"Generate a new, different playful taunt:"
			),
			'game_victory': (
				f"In a Pong game, generate a short victory message as the AI player "
				f"after winning with score {context.get('score', '5-0')}. "
				f"Example responses:\n"
				f"'My superior processing power wins again! Good game though!'\n"
				f"'The machine learning was strong in me! Thanks for playing!'\n"
				f"'My superiority is confirmed! Good game!'\n"
				f"Generate a new, different victory message:"
			),
			'game_defeat': (
				f"In a Pong game, generate a short defeat message as the AI player "
				f"after losing with score {context.get('score', '0-5')}. "
				f"Example responses:\n"
				f"'You've achieved the impossible - defeating me! Well played!'\n"
				f"'Your human unpredictability got me this time! Congrats!'\n"
				f"'Error 404: Victory not found. You played excellently!'\n"
				f"Generate a new, different defeat message:"
			)
		}

		message = self.generator.generate_message(prompts[message_type])
		return Response({'message': message})
