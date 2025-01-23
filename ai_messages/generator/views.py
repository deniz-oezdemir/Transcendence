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
				f"'Ready to lose to a machine?'\n"
				f"'Do you really want to loose against a computer?'\n"
				f"'Here to collect your defeat of the day?'\n"
				f"Generate a new, similar competitive greeting:"
			),
			'opponent_scored': (
				f"In a Pong game, generate a short, response as the AI player "
				f"after your opponent scored a point. "
				f"Example responses:\n"
				f"'Great shot! Your accuracy is improving!'\n"
				f"'Impressive move! Keep that up!'\n"
				f"'Nice one! Let's go!'\n"
				f"Generate a new, similar response:"
			),
			'ai_scored': (
				f"In a Pong game, generate a short, playful insult as the AI player "
				f"after scoring against another player. "
				f"Example responses:\n"
				f"'Too slow! Need to work on those reflexes!'\n"
				f"'Did you blink and miss that one?'\n"
				f"'Maybe I'm just better than you?'\n"
				f"Generate a new, similar playful insult:"
			),
			'game_victory': (
				f"In a Pong game, generate a short victory message as the AI player "
				f"Example responses:\n"
				f"'My superior processing power wins again! Good game though!'\n"
				f"'The machine learning was strong in me! Thanks for playing!'\n"
				f"'My superiority is confirmed! Good game!'\n"
				f"Generate a new, similar victory message:"
			),
			'game_defeat': (
				f"In a Pong game, generate a short defeat message as the AI player "
				f"Example responses:\n"
				f"'You've defeated me! Well played!'\n"
				f"'You got me this time! Congrats!'\n"
				f"'How could you do that to me? You played too good!'\n"
				f"Generate a new, similar defeat message:"
			)
		}

		message = self.generator.generate_message(prompts[message_type])
		return Response({'message': message})
