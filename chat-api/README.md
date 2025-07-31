# ChatWithPDF API Service

FastAPI backend service for processing PDFs and handling chat interactions using Gemini LLM and Pinecone vector storage.

## 🚀 Features

- PDF processing and chunking
- Vector embeddings storage with Pinecone
- Chat interactions using Gemini 2.5 model
- FastAPI endpoints for document upload and chat
- NGINX configuration for production deployment

## 📋 Prerequisites

- Python 3.x
- Google API Key (for Gemini)
- Pinecone API Key
- NGINX (for production)

## 🛠️ Installation

1. Clone the repository and navigate to the directory:
```bash
git clone https://github.com/otman-ai/ChatWithPDF.git
cd chat_api
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Add your API keys to .env:
# GOOGLE_API_KEY=your_google_api_key
# PINECONE_API_KEY=your_pinecone_api_key
```

## 🚀 Local Development

Run the FastAPI server with hot reload:
```bash
uvicorn app:app --reload
```

The API will be available at `http://localhost:8000`

## 📚 API Endpoints

### POST /add-record
Upload and process a PDF document

### POST /get-response
Get AI responses for chat queries about the document

## 🌐 Production Deployment

1. Set up NGINX configuration:
```bash
sudo cp default /etc/nginx/sites-available/
sudo systemctl restart nginx
```

2. Configure systemd service:
```bash
sudo cp backend.service /etc/systemd/system/
sudo systemctl start backend
sudo systemctl enable backend
```

## 🛡️ Environment Variables

- `GOOGLE_API_KEY`: API key for Google Gemini model
- `PINECONE_API_KEY`: API key for Pinecone vector database
- `CHAT_API_KEY`: API key securing the api (has to be the same as the one in nextts/.env)


## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Submit a pull request

## 📝 License

Apache License