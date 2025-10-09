from typing import List, Dict, Any
import os
import requests
from src.core.config import settings

class AIService:
    def __init__(self):
        self.cerebras_api_key = settings.CEREBRAS_API_KEY
        self.openrouter_api_key = settings.OPENROUTER_API_KEY
        self.cerebras_base_url = "https://api.cerebras.ai/v1"
        self.openrouter_base_url = "https://api.openrouter.ai/api/v1"
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available AI models from both Cerebras and OpenRouter"""
        models = []
        
        # Get Cerebras models
        try:
            cerebras_response = requests.get(
                f"{self.cerebras_base_url}/models",
                headers={"Authorization": f"Bearer {self.cerebras_api_key}"}
            )
            if cerebras_response.status_code == 200:
                models.extend(cerebras_response.json().get("data", []))
        except Exception as e:
            print(f"Error fetching Cerebras models: {e}")
        
        # Get OpenRouter models
        try:
            openrouter_response = requests.get(
                f"{self.openrouter_base_url}/models",
                headers={"Authorization": f"Bearer {self.openrouter_api_key}"}
            )
            if openrouter_response.status_code == 200:
                models.extend(openrouter_response.json().get("data", []))
        except Exception as e:
            print(f"Error fetching OpenRouter models: {e}")
        
        return models
    
    async def categorize_transactions(
        self,
        transactions: List[Dict],
        model_name: str
    ) -> Dict[str, float]:
        """Categorize transactions using AI"""
        # Prepare the prompt
        transaction_text = "\n".join(
            [f"{t['date']}: {t['description']} - ${t['amount']} ({t['type']})"
             for t in transactions]
        )
        
        prompt = f"""
        Please categorize the following bank transactions into appropriate spending categories.
        Return only a JSON object with categories as keys and total amounts as values.
        
        Transactions:
        {transaction_text}
        """
        
        # Try OpenRouter first
        try:
            response = await self._call_openrouter(prompt, model_name)
            return self._parse_categories_response(response)
        except Exception as e:
            print(f"OpenRouter error: {e}")
            # Fallback to Cerebras
            try:
                response = await self._call_cerebras(prompt, model_name)
                return self._parse_categories_response(response)
            except Exception as e2:
                raise Exception(f"AI service error: {e} and {e2}")
    
    async def analyze_spending(
        self,
        transactions: List[Dict],
        categories: Dict[str, float],
        model_name: str
    ) -> Dict[str, Any]:
        """Generate financial advice and savings matrix"""
        prompt = f"""
        Based on these transactions and categories, provide:
        1. Financial advice for optimizing spending
        2. A savings matrix with three strategies (conservative, moderate, aggressive)
        
        Transactions: {transactions}
        Categories: {categories}
        
        Return a JSON object with 'advice' and 'savings_matrix' keys.
        """
        
        try:
            response = await self._call_openrouter(prompt, model_name)
            return self._parse_analysis_response(response)
        except Exception as e:
            try:
                response = await self._call_cerebras(prompt, model_name)
                return self._parse_analysis_response(response)
            except Exception as e2:
                raise Exception(f"AI service error: {e} and {e2}")
    
    async def _call_openrouter(self, prompt: str, model_name: str) -> Dict:
        """Make API call to OpenRouter"""
        response = requests.post(
            f"{self.openrouter_base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}]
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"OpenRouter API error: {response.text}")
        
        return response.json()
    
    async def _call_cerebras(self, prompt: str, model_name: str) -> Dict:
        """Make API call to Cerebras"""
        response = requests.post(
            f"{self.cerebras_base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.cerebras_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}]
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Cerebras API error: {response.text}")
        
        return response.json()
    
    def _parse_categories_response(self, response: Dict) -> Dict[str, float]:
        """Parse AI response for transaction categories"""
        try:
            content = response["choices"][0]["message"]["content"]
            # In practice, you'd need more robust parsing here
            # This is a simplified version
            return eval(content)
        except Exception as e:
            raise Exception(f"Error parsing categories response: {e}")
    
    def _parse_analysis_response(self, response: Dict) -> Dict[str, Any]:
        """Parse AI response for spending analysis"""
        try:
            content = response["choices"][0]["message"]["content"]
            # In practice, you'd need more robust parsing here
            # This is a simplified version
            return eval(content)
        except Exception as e:
            raise Exception(f"Error parsing analysis response: {e}")