from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import gc


class ModelHandler:
    def __init__(self):
        self.model_path = "/app/models/DeepSeek-R1-Distill-Qwen-1.5B"
        self.tokenizer = None
        self.model = None
        self.device = "cpu"

    def load_model(self):
        if not self.model:
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_path, trust_remote_code=True, local_files_only=True
            )
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_path,
                trust_remote_code=True,
                local_files_only=True,
                torch_dtype=torch.float32,
                low_cpu_mem_usage=True,
            )
            self.model.to(self.device)

    def generate_text(self, prompt: str, max_length: int = 100) -> dict:
        try:
            self.load_model()

            formatted_prompt = (
                "<system>\n"
                "You are the AI opponent in a Pong match against a human player.\n"
                "Generate ONE short game message from your perspective.\n"
                "No meta text, quotes, explanations, third person self-references or special characters.\n"
                "Must be brief and game-specific.\n"
                f"{prompt}\n"
                "</system>\n"
            )

            inputs = self.tokenizer(formatted_prompt, return_tensors="pt").to(
                self.device
            )
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=20,
                min_new_tokens=5,
                temperature=0.6,
                do_sample=True,
                top_p=0.9,
                repetition_penalty=1.1,
                no_repeat_ngram_size=3,
                pad_token_id=self.tokenizer.eos_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )

            # Clean up the generated text
            generated = self.tokenizer.decode(
                outputs[0][len(inputs["input_ids"][0]) :], skip_special_tokens=True
            ).strip()

            # Clean up response
            cleaned = generated
            # Remove think tags
            cleaned = cleaned.replace("</think>", "").replace("<think>", "")
            # Remove markdown
            cleaned = cleaned.replace("**", "").replace("*", "")
            # Remove multiple newlines
            cleaned = " ".join(cleaned.split())

            return {"raw": generated, "extracted": cleaned.strip()}
        except Exception as e:
            return {"raw": str(e), "extracted": "Ready to play!"}
        finally:
            self.cleanup()

    def cleanup(self):
        if self.model:
            self.model.cpu()
            del self.model
            del self.tokenizer
            gc.collect()
            torch.cuda.empty_cache()
            self.model = None
            self.tokenizer = None
