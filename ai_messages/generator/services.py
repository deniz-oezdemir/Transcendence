from transformers import AutoTokenizer, AutoModelForCausalLM

class AIMessageGenerator:
	def __init__(self):
		self.tokenizer = AutoTokenizer.from_pretrained('distilgpt2')
		self.model = AutoModelForCausalLM.from_pretrained('distilgpt2')

	def generate_message(self, prompt):
		inputs = self.tokenizer.encode(prompt, return_tensors='pt')

		outputs = self.model.generate(
			inputs,
			max_new_tokens=30,
			min_new_tokens=5,
			do_sample=True,
			temperature=0.7,
			top_p=0.9,
			no_repeat_ngram_size=2,
			num_beams=5,
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

		# Filter out meta text, short or prompt-like outputs
		if ("tutorial" in message.lower() or
			"example" in message.lower() or
			prompt.lower() in message.lower()):
			return self.generate_message(prompt)

		# Ensure the response ends with a punctuation mark:
		punctuation_marks = (".'", "!'", "?'")
		if not message.endswith(punctuation_marks):
			# Find the last occurrence of any recognized punctuation
			last_punc_pos = max(message.rfind(p) for p in punctuation_marks)
			# If found, cut off the text at that punctuation else add .
			if last_punc_pos != -1:
				message = message[: last_punc_pos + 2].strip()
			else:
				message += ".'"

		return message
