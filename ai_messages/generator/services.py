from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

class AIMessageGenerator:
    def __init__(self):
        # Load model and tokenizer once during initialization
        self.tokenizer = AutoTokenizer.from_pretrained("distilgpt2")
        self.model = AutoModelForCausalLM.from_pretrained("distilgpt2")

    def generate_message(self, context, max_length=50):
        # Encode the input context
        inputs = self.tokenizer.encode(context, return_tensors='pt')

        # Generate response
        outputs = self.model.generate(
            inputs,
            max_length=max_length,
            num_return_sequences=1,
            temperature=0.7,
            pad_token_id=self.tokenizer.eos_token_id,
            no_repeat_ngram_size=2
        )

        # Decode and return the generated text
        message = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return message
