from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import google.generativeai as genai
from dotenv import load_dotenv
import logging
from typing import Optional, Dict, Any, ClassVar, List
import asyncio
from functools import lru_cache
import traceback
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Configure the Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="Text Buddy API")

# Configure CORS to allow requests from the Chrome extension
origins = [
    "http://127.0.0.1:5500",  
    "chrome-extension://*",   
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str
    action: str  # "translate", "correct", or "prompt"
    language: Optional[str] = None  # Target language for translation
    query: Optional[str] = None  # User's query for the prompt action

class TextResponse(BaseModel):
    processed_text: str

LANGUAGE_MAP: Dict[str, str] = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "zh": "Chinese (Simplified)",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "hi": "Hindi",
}

class ModelCache:
    _instances: ClassVar[Dict[str, Any]] = {}
    
    @classmethod
    def get_model(cls, model_name: str):
        if model_name not in cls._instances:
            cls._instances[model_name] = genai.GenerativeModel(model_name)
            logger.info(f"Created new model instance for {model_name}")
        return cls._instances[model_name]

def get_language_name(language_code: str) -> str:
    """Convert language code to full language name if available, else return code."""
    return LANGUAGE_MAP.get(language_code.lower(), language_code)

@lru_cache(maxsize=32)
def build_translation_prompt(text: str, language: str) -> str:
    """Build and cache prompts for common translation requests"""
    full_language_name = get_language_name(language)
    return f"""Translate the following text into {full_language_name}.
    Return only the translated text, without any preamble or explanation.
    Original text:
    ---
    {text}
    ---
    Translated text in {full_language_name}:"""

@lru_cache(maxsize=1)
def build_correction_prompt(text: str) -> str:
    """Build and cache the correction prompt template"""
    return f"""Correct the grammar, spelling, and punctuation in the following text.
    Only make necessary corrections to enhance clarity and correctness, while maintaining the original meaning and tone.
    Return only the corrected text, without any preamble or explanation.
    Original text:
    ---
    {text}
    ---
    Corrected text:"""

def extract_text_from_response(response):
    """Extract text from a generative model response with simplified error handling"""
    if hasattr(response, 'text'):
        return response.text
    
    if response.parts:
        return ''.join(part.text for part in response.parts if hasattr(part, 'text'))
    
    try:
        return response.candidates[0].content.parts[0].text
    except (AttributeError, IndexError):
        return ""

def build_dynamic_prompt(text: str, query: str) -> str:
    """Build a prompt using exactly the user's query"""
    return f"""{query}

Text:
---
{text}
---"""

@app.post("/process", response_model=TextResponse)
async def process_text(request: TextRequest):
    """Process text for translation, correction, or custom query"""
    try:
        text_length = len(request.text)
        model_name = "gemini-1.5-flash-latest" if text_length < 1000 else "gemini-1.5-pro-latest"
        model = ModelCache.get_model(model_name)
        if request.action == "translate":
            if not request.language:
                raise HTTPException(status_code=400, detail="Language parameter is required for translation.")
            
            prompt = build_translation_prompt(request.text, request.language)
            
        elif request.action == "correct":
            prompt = build_correction_prompt(request.text)
            
        elif request.action == "prompt":
            if not request.query:
                raise HTTPException(status_code=400, detail="Query parameter is required for prompt action.")
            
            prompt = build_dynamic_prompt(request.text, request.query)
            
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Must be 'translate', 'correct', or 'prompt'.")
        
        response = await asyncio.to_thread(model.generate_content, prompt)
        processed_text = extract_text_from_response(response).strip()
        if not processed_text:
            raise HTTPException(status_code=500, detail="Model returned an empty response.")
        
        return TextResponse(processed_text=processed_text)
        
    except HTTPException:
        raise
    except Exception as e:
        error_message = str(e).lower()
        
        if "api key not valid" in error_message:
            raise HTTPException(status_code=401, detail="Invalid Gemini API Key.")
        elif "quota" in error_message:
            raise HTTPException(status_code=429, detail="API quota exceeded. Please try again later.")
        else:
            logger.error(f"Unexpected error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again.")

@app.get("/")
async def root():
    return {"message": "Text Buddy API is running", "status": "online"}


@app.get("/available-actions")
async def available_actions():
    """Return a list of available actions the API supports"""
    return {
        "actions": [
            {
                "id": "translate",
                "description": "Translate text to another language",
                "requires_language": True,
                "example": "Translate this text to Spanish"
            },
            {
                "id": "correct",
                "description": "Fix grammar, spelling, and punctuation",
                "requires_language": False,
                "example": "Correct this text"
            },
            {
                "id": "prompt",
                "description": "Process text with any instruction",
                "requires_query": True,
                "example_queries": [
                    "Summarize this text in three bullet points", 
                    "Rewrite this to be more formal and professional", 
                    "Simplify this text for a middle school reading level", 
                    "Extract the main argument from this text",
                    "Convert this paragraph into a persuasive tweet",
                    "Identify and list all the key points in this text"
                ]
            }
        ]
    }

@app.get("/test")
async def test_gemini():
    try:
        # Use a known valid model for testing
        model = genai.GenerativeModel("gemini-1.5-flash-latest")
        response = model.generate_content("Say hello in a friendly tone.")
        return {"response": response.text}
    except Exception as e:
        logging.error(f"Error in /test endpoint: {e}\n{traceback.format_exc()}")
        return {"error": str(e)}
    
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=2000)

