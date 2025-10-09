import os
import json
import time
import requests
from typing import List, Dict, Optional, Union
from datetime import datetime, timedelta
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

class AIModelConfig:
    """Configuration for different AI models"""
    MODELS = {
        "llama-4-scout-17b-16e-instruct": {
            "max_tokens": 4096,
            "temperature": 0.7,
            "capabilities": ["financial_analysis", "text_extraction", "categorization"]
        },
        "llama3.1-8b": {
            "max_tokens": 2048,
            "temperature": 0.8,
            "capabilities": ["text_extraction", "categorization"]
        },
        "cerebras-1.3b": {
            "max_tokens": 2048,
            "temperature": 0.7,
            "capabilities": ["financial_analysis"]
        }
    }

class OpenRouterClient:
    def __init__(self, cache_ttl: int = 3600):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.cerebras_api_key = os.getenv("CEREBRAS_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.cerebras_url = "https://api.cerebras.ai/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-App-Name": "BankStatementAnalyzer"
        }
        self.cache_ttl = cache_ttl
        self.last_request_time = {}
        self.rate_limit = 10  # requests per minute

    @lru_cache(maxsize=1000)
    def _get_cached_response(self, cache_key: str) -> Optional[Dict]:
        """Get cached response if available"""
        return None  # Implement proper caching with Redis/Memcached in production

    def _update_rate_limit(self, model: str):
        """Implement rate limiting per model"""
        current_time = time.time()
        if model in self.last_request_time:
            time_diff = current_time - self.last_request_time[model]
            if time_diff < 60 / self.rate_limit:
                time.sleep((60 / self.rate_limit) - time_diff)
        self.last_request_time[model] = current_time

    def get_best_model(self, task_type: str, input_length: int) -> str:
        """Select the best model based on task type and input size"""
        suitable_models = []
        for model, config in AIModelConfig.MODELS.items():
            if task_type in config["capabilities"] and input_length <= config["max_tokens"]:
                suitable_models.append(model)
        
        return suitable_models[0] if suitable_models else "llama-4-scout-17b-16e-instruct"

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama-4-scout-17b-16e-instruct",
        temperature: float = None,
        max_tokens: int = None,
        cache: bool = True
    ) -> Dict:
        """Get chat completion with enhanced features and fallback"""
        cache_key = f"{model}:{json.dumps(messages)}"
        if cache:
            cached = self._get_cached_response(cache_key)
            if cached:
                return cached

        self._update_rate_limit(model)
        
        # Use model-specific configurations
        model_config = AIModelConfig.MODELS.get(model, {})
        payload = {
            "messages": messages,
            "model": model,
            "temperature": temperature or model_config.get("temperature", 0.7),
            "max_tokens": max_tokens or model_config.get("max_tokens", 2048)
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if cache:
                    # Cache the result in production with proper caching system
                    pass
                return result
                
            # Try Cerebras fallback for supported models
            if "cerebras" in model:
                return await self._cerebras_fallback(messages, model)
                
            raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")
            
        except requests.exceptions.RequestException as e:
            # Try another model as fallback
            fallback_model = "llama3.1-8b" if model != "llama3.1-8b" else "cerebras-1.3b"
            return await self.chat_completion(messages, model=fallback_model, cache=False)

    async def _cerebras_fallback(self, messages: List[Dict[str, str]], model: str) -> Dict:
        """Fallback to Cerebras API for supported models"""
        headers = {
            "Authorization": f"Bearer {self.cerebras_api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(
                f"{self.cerebras_url}/chat/completions",
                headers=headers,
                json={"messages": messages, "model": model},
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            raise Exception(f"Cerebras API error: {response.status_code} - {response.text}")
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Both OpenRouter and Cerebras APIs failed: {str(e)}")

# Initialize client with 1-hour cache TTL
openrouter_client = OpenRouterClient(cache_ttl=3600)