import os
import requests
from dotenv import load_dotenv

load_dotenv()

class CerebrasClient:
    def __init__(self):
        self.api_key = os.getenv("CEREBRAS_API_KEY")
        self.base_url = "https://api.cerebras.ai/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def chat_completion(self, messages, model="llama-4-scout-17b-16e-instruct"):
        """Get chat completion from Cerebras AI"""
        payload = {
            "messages": messages,
            "model": model
        }
        
        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers=self.headers,
            json=payload
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Cerebras API error: {response.status_code} - {response.text}")

# Initialize client
cerebras_client = CerebrasClient()