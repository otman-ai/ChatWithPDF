# ChatWithPDF

An AI-powered PDF chat application built with Next.js 14 and FastAPI that allows users to upload documents and have interactive conversations about their content using Gemini LLM.

## Features

- PDF document upload and processing
- Interactive chat interface with AI responses
- Semantic search using Pinecone vector database
- Gemini 2.5 language model integration
- User authentication and document management
- Modern UI with Tailwind CSS
- Production-ready deployment configuration

## Architecture

The project consists of two main components:

### Frontend ([`nextts/`](nextts/))
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- NextAuth.js for authentication
- Prisma for database management

### Backend ([`chat_api/`](chat_api/))
- FastAPI Python backend
- Gemini LLM integration
- Pinecone vector storage
- PDF processing with PyMuPDF

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/otman-ai/ChatWithPDF.git
cd ChatWithPDF
```

2. Set up the backend:
```bash
cd chat_api
python -m venv venv
# For Windows
.\venv\Scripts\activate
# For Linux/Mac
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

3. Set up the frontend:
```bash
cd ../nextts
npm install
cp .env.example .env
```

4. Configure environment variables in both `.env` files:
- Backend: `GOOGLE_API_KEY`, `PINECONE_API_KEY`, `CHAT_API_KEY`
- Frontend: `NEXT_PUBLIC_API_URL`, `CHAT_API_KEY`

5. Start the services:

Backend:
```bash
cd chat_api
uvicorn app:app --reload
```

Frontend:
```bash
cd nextts
npm run dev
```

## Documentation

- [Frontend Documentation](nextts/README.md)
- [Backend Documentation](chat_api/README.md)

## Development Setup

### Prerequisites

- Python 3.x
- Node.js 18+
- Google API Key (Gemini)
- Pinecone API Key

### Local Development

1. Start the backend service (port 8000)
2. Start the frontend service (port 3000)
3. Access the application at `http://localhost:3000`


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📝 License

Apache License