# ChatWithPDF NextJS Frontend

A modern web application built with Next.js 14, TypeScript, and Tailwind CSS for interacting with PDF documents through AI-powered chat.

## Features

- PDF document upload and management
- Real-time chat interface with AI responses
- Responsive design using Tailwind CSS
- Secure API integration with backend service
- User authentication and document history

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Backend API service running

## Installation

1. Clone the repository and navigate to the directory:
```bash
git clone https://github.com/otman-ai/ChatWithPDF.git
cd nextts
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
## Development

Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

Create a production build:
```bash
npm run build
# or
yarn build
```

Start the production server:
```bash
npm start
# or
yarn start
```

## Project Structure

```
nextts/
├── src/
│   ├── app/          # Next.js app router pages
│   ├── components/   # Reusable UI components
│   ├── constants/    # Application constants
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions
│   └── types/        # TypeScript type definitions
├── public/           # Static assets
└── prisma/          # Database schema and migrations
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

Apache License