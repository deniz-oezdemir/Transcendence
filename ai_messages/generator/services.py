from transformers import AutoTokenizer, AutoModelForCausalLM

class AIMessageGenerator:
	def __init__(self):
		self.tokenizer = AutoTokenizer.from_pretrained('distilgpt2')
		self.model = AutoModelForCausalLM.from_pretrained('distilgpt2')

	def generate_message(self, prompt, message_type):
		inputs = self.tokenizer.encode(prompt, return_tensors='pt')

		outputs = self.model.generate(
			inputs,
			max_new_tokens=30,
			min_new_tokens=5,
			do_sample=True,
			temperature=0.7,
			top_p=0.95,
			no_repeat_ngram_size=2,
			num_beams=3,
			early_stopping=True,
			pad_token_id=self.tokenizer.eos_token_id
		)

		# Decode the output
		message = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
		message = message.replace(prompt, "").strip()

		# Get the first sentence
		message = message.split('.')[0].strip()

		# Remove repeated spaces
		message = " ".join(message.split())

		# Check for invalid content based on message type
		if message_type:
			invalid_content = {
			'game_start': ['sorry', 'won', 'win', 'home'],
			'opponent_scored': ['won', 'win'],
			'ai_scored': [],
			'game_victory': [],
			'game_defeat': ["i've won", "i won", "won't", "gonna win"]
			}
			if any(word.lower() in message.lower() for word in invalid_content.get(message_type, [])):
				return self.generate_message(prompt, message_type)

		# Filter out meta text, short or prompt-like outputs
		if ("tutorial" in message.lower() or
			"example" in message.lower() or
			"player" in message.lower() or
			"download" in message.lower() or
			"steam" in message.lower() or
			"comments" in message.lower() or
			"(" in message.lower() or
			")" in message.lower() or
			"0" in message.lower() or
			"1" in message.lower() or
			"2" in message.lower() or
			"3" in message.lower() or
			"4" in message.lower() or
			"5" in message.lower() or
			"6" in message.lower() or
			"7" in message.lower() or
			"8" in message.lower() or
			"9" in message.lower() or
			"generated" in message.lower() or
			"share" in message.lower() or
			"' " in message.lower() or
			"\"" in message.lower() or
			":" in message.lower() or
			prompt.lower() in message.lower()):
			return self.generate_message(prompt, message_type)

		# Ensure the response ends with a punctuation mark:
		punctuation_marks = (".'", "!'", "?'", "!")
		if not message.endswith(punctuation_marks):
			# Find the last occurrence of any recognized punctuation
			last_punc_pos = max(message.rfind(p) for p in punctuation_marks)
			# If found, cut off the text at that punctuation else add .
			if last_punc_pos != -1:
				message = message[: last_punc_pos + 2].strip()

		if not message.endswith(punctuation_marks):
			message += ".'"

		if not message.endswith("'"):
			message += "'"

		return message
