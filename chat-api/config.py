from pydantic_settings  import BaseSettings
from dotenv import load_dotenv
import os
from template import template

load_dotenv()

class Settings(BaseSettings):
    """
    Configuration settings
    """ 
    log_path: str = "/logs/app.log"
    log_level: str = "INFO"
    chat_api_key: str =  os.getenv('CHAT_API_KEY')
    google_api_key: str = os.getenv('GOOGLE_API_KEY')
    template: str = template
    model_name: str = "gemini-2.5-flash-lite-preview-06-17"
    model_temperature: float = 0.1
    model_max_tokens: int | None = None
    model_timeout: float | None = None
    model_max_retries: int = 2
    model_disable_streaming: bool = False
    chromadb_top_key: int = 8
    chromadb_chunk_size: int = 800
    chromadb_chunk_overlap: int = 300
    chromadb_separator: str = "\n"
    chromadb_port: int = os.getenv('CHROMADB_PORT')

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
