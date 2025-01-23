from transformers import AutoTokenizer, AutoModelForCausalLM

class AIMessageGenerator:
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained('distilgpt2')
        self.model = AutoModelForCausalLM.from_pretrained('distilgpt2')

    def generate_message(self, prompt):
        inputs = self.tokenizer.encode(prompt, return_tensors='pt')

        # Updated generation parameters to address warnings
        outputs = self.model.generate(
            inputs,
            max_new_tokens=30,      # Shorter responses
            min_new_tokens=5,       # Ensure some minimum response
            do_sample=True,         # Enable sampling
            temperature=0.7,        # Control randomness
            top_p=0.9,             # Nucleus sampling
            no_repeat_ngram_size=2, # Avoid repetition
            num_beams=3,           # Add beam search
            early_stopping=True,    # Now works with beam search
            pad_token_id=self.tokenizer.eos_token_id
        )

        # Extract and clean the generated response
        message = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        message = message.replace(prompt, "").strip()

        # Get first sentence only to keep responses focused
        message = message.split('.')[0].strip()

        # Return empty if message is too short
        if len(message) < 5:
            return self.generate_message(prompt)

        return message
