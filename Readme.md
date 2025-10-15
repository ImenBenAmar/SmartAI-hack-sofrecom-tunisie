# 📧 SmartMail AI - Email Automation Platform

> An intelligent email automation platform powered by AI that transforms how you manage, analyze, and respond to emails.

### 🎬Demo

- [Voir la démo (demo.mp4)](./demo.mp4)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🌟 Overview

**SmartMail AI** is a comprehensive email automation solution that combines the power of modern web technologies with advanced AI language models. It provides a seamless interface for Gmail integration, intelligent email processing, task detection, auto-reply generation, document analysis, and calendar management.

Built for the **Sofrecom Tunisia Hackathon**, this project demonstrates the potential of AI-driven workflow automation in enterprise email management.

### Key Highlights
- 🤖 **AI-Powered Analysis**: Semantic analysis, sentiment detection, and urgency classification
- 🌍 **Multi-Language Support**: Automatic translation from French to English
- 📎 **Smart Attachment Processing**: OCR for PDFs and images with text extraction
- 📅 **Calendar Integration**: Intelligent meeting scheduling with Google Calendar
- 💬 **Auto-Reply Generation**: Context-aware email responses
- 🔍 **RAG Question Answering**: Ask questions about email content with AI
- 📊 **Document Classification**: Automatic theme detection and categorization
- ⚡ **Real-Time Processing**: Instant analysis with live status updates

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SmartMail AI Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐           ┌──────────────────┐        │
│  │    Frontend      │◄─────────►│     Backend      │        │
│  │   (Next.js 15)   │   REST    │    (FastAPI)     │        │
│  │                  │    API    │                  │        │
│  │  ┌────────────┐  │           │  ┌────────────┐  │        │
│  │  │ Gmail UI   │  │           │  │ LLM Client │  │        │
│  │  ├────────────┤  │           │  ├────────────┤  │        │
│  │  │ Email      │  │           │  │ RAG Engine │  │        │
│  │  │ Analysis   │  │           │  ├────────────┤  │        │
│  │  ├────────────┤  │           │  │ OCR        │  │        │
│  │  │ Calendar   │  │           │  │ Processor  │  │        │
│  │  ├────────────┤  │           │  ├────────────┤  │        │
│  │  │ Chatbot    │  │           │  │ Calendar   │  │        │
│  │  │ Interface  │  │           │  │ Service    │  │        │
│  │  └────────────┘  │           │  └────────────┘  │        │
│  └──────────────────┘           └──────────────────┘        │
│           │                              │                   │
│           │                              │                   │
│           ▼                              ▼                   │
│  ┌──────────────────┐           ┌──────────────────┐        │
│  │  Gmail API       │           │  AI Models       │        │
│  │  Google Calendar │           │  - NVIDIA Llama  │        │
│  │  NextAuth.js     │           │  - Mistral AI    │        │
│  └──────────────────┘           │  - ChromaDB      │        │
│                                  └──────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Features

### 📨 Email Management
- **Gmail Integration**: Seamless access to your Gmail inbox
- **Thread Viewer**: Read email conversations with full history
- **Smart Filters**: Filter by unread, starred, sender, or date
- **Search**: Powerful search across all emails
- **Attachment Viewer**: Preview and download attachments

### 🧠 AI-Powered Analysis
- **Semantic Analysis**: Understand email intent, tone, and type
- **Sentiment Detection**: Identify positive, negative, or neutral sentiment
- **Urgency Classification**: Detect time-sensitive emails automatically
- **Task Extraction**: Automatically identify action items and to-dos
- **Key Points Summary**: Get concise summaries of long emails

### 🔄 Intelligent Automation
- **Auto-Translation**: Convert French emails to English instantly
- **Auto-Reply**: Generate contextually appropriate responses
- **Meeting Detection**: Identify meeting proposals in emails
- **Calendar Scheduling**: Automatically schedule meetings with conflict detection
- **Batch Processing**: Process multiple emails simultaneously

### 📎 Document Processing
- **OCR Technology**: Extract text from PDFs and images (PNG, JPG, JPEG)
- **Format Support**: Handle TXT, DOCX, PDF, and image files
- **Text Extraction**: Accurate text recognition with Tesseract OCR
- **Metadata Extraction**: File size, type, creation date

### 🔍 Advanced Search & Q&A
- **RAG (Retrieval-Augmented Generation)**: Ask questions about email content
- **Vector Search**: Semantic search using ChromaDB
- **Context-Aware Answers**: Get accurate answers based on email context
- **Document Classification**: Automatically categorize documents by theme

### 📅 Calendar Integration
- **Availability Check**: View free time slots for the next 7 days
- **Smart Scheduling**: Avoid conflicts when booking meetings
- **Meeting Analysis**: Extract meeting details from email text
- **Event Creation**: Create Google Calendar events directly

### 💬 Interactive Chatbot
- **Conversational AI**: Natural language interface for email queries
- **Quick Actions**: Pre-defined shortcuts for common tasks
- **Multi-Turn Conversations**: Context-aware dialogue
- **Email Insights**: Ask questions about your inbox

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.0
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide Icons
- **State Management**: React Hooks
- **API Integration**: Native Fetch with custom wrappers

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.8+
- **AI Models**: 
  - NVIDIA Llama 3 (8B & 70B Instruct)
  - Mistral AI (mistral-small)
- **Vector Store**: ChromaDB
- **Embeddings**: HuggingFace (sentence-transformers)
- **OCR**: Tesseract, OpenCV, pytesseract
- **Document Processing**: python-docx, PyPDF2
- **Calendar**: Google Calendar API

### Infrastructure
- **Authentication**: Google OAuth 2.0
- **APIs**: Gmail API, Google Calendar API
- **Caching**: File-based translation cache
- **Database**: ChromaDB for vector storage

## 📁 Project Structure

```
projet_email_automation/
├── frontend/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/                # Next.js pages (App Router)
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── inbox/          # Gmail inbox pages
│   │   │   └── api/            # API routes (NextAuth, Gmail proxy)
│   │   ├── components/         # React components
│   │   │   ├── inbox/          # Email UI components
│   │   │   ├── chatbot/        # Chatbot interface
│   │   │   ├── calendar/       # Calendar widgets
│   │   │   └── ui/             # Reusable UI elements
│   │   ├── services/           # API service layer
│   │   ├── lib/                # Utilities and helpers
│   │   ├── auth/               # NextAuth configuration
│   │   └── types/              # TypeScript definitions
│   ├── public/                 # Static assets
│   ├── .env.local              # Environment variables (not in git)
│   ├── next.config.js          # Next.js configuration
│   └── package.json            # Dependencies
│
├── backend/                     # FastAPI backend application
│   ├── api/
│   │   ├── main.py             # FastAPI entry point
│   │   ├── routes/             # API endpoints
│   │   │   ├── email.py        # Email processing
│   │   │   ├── attachment.py   # Attachment handling
│   │   │   ├── calendar.py     # Calendar integration
│   │   │   ├── rag.py          # RAG Q&A
│   │   │   └── classification.py # Document classification
│   │   └── models/             # Pydantic models
│   ├── modules/                # Core business logic
│   │   ├── llm_client.py       # AI model client
│   │   ├── rag_processor.py    # RAG engine
│   │   ├── attachment_processor.py # OCR & file processing
│   │   └── calendar_service.py # Google Calendar service
│   ├── config/
│   │   ├── .env                # Backend environment variables
│   │   └── client_secret.json  # Google OAuth credentials
│   ├── data/                   # Data storage
│   │   ├── translation_cache/  # Cached translations
│   │   ├── chroma_db_api/      # RAG vector store
│   │   └── chroma_db_classification/ # Classification vectors
│   ├── requirements.txt        # Python dependencies
│   └── tests/                  # Test suites
│
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Python** 3.8+
- **Tesseract OCR** (for attachment processing)
- **Google Cloud Project** with Gmail & Calendar APIs enabled

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/projet_email_automation.git
cd projet_email_automation
```

### 2. Setup Backend

#### Install Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Configure Environment
Create `backend/config/.env`:
```env
# AI Models
NVIDIA_API_KEY_LLAMA3_8B=your_nvidia_api_key_8b
NVIDIA_API_KEY_LLAMA3_70B=your_nvidia_api_key_70b
CLOUD_ADAPTER_API_KEY=your_mistral_api_key
MISTRAL_MODEL=mistral-small

# Optional: Local Llama
LOCAL_LLAMA_API_BASE_URL=http://localhost:11434
LOCAL_LLAMA_MODEL_NAME=llama3
```

#### Start Backend
```bash
python api/main.py
# Backend runs on http://127.0.0.1:8002
```

### 3. Setup Frontend

#### Install Dependencies
```bash
cd ../frontend
npm install
```

#### Configure Environment
Create `frontend/.env.local`:
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GMAIL_SCOPES=openid email profile https://www.googleapis.com/auth/gmail.readonly

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-32-chars

# Backend API
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8002
```

#### Start Frontend
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### 4. Access the Application
1. Open **http://localhost:3000**
2. Click **"Sign In"** and authenticate with Google
3. Grant Gmail permissions
4. Start using SmartMail AI! 🎉

## 📖 Documentation

### Detailed Guides
- **[Frontend README](frontend/README.md)** - Frontend setup, architecture, and usage
- **[Backend README](backend/README.md)** - Backend API documentation and configuration
- **[API Documentation](http://127.0.0.1:8002/docs)** - Interactive Swagger UI (when backend is running)

### Key Endpoints

#### Frontend (Next.js API Routes)
- `GET /api/gmail/threads` - List Gmail threads
- `GET /api/gmail/threads/[threadId]` - Get thread details
- `GET /api/gmail/messages/[id]` - Get message details

#### Backend (FastAPI)
- `POST /api/translate` - Translate email
- `POST /api/analyze` - Semantic analysis
- `POST /api/summary` - Generate summary
- `POST /api/tasks` - Detect tasks
- `POST /api/reply` - Generate auto-reply
- `POST /api/attachment/process` - Process attachment
- `POST /api/rag/ask` - RAG question answering
- `POST /api/classification/themes` - Classify document
- `GET /api/calendar/availability` - Check availability
- `POST /api/calendar/schedule` - Schedule event

## 🎯 Use Cases

### 1. Email Triage & Prioritization
- Automatically detect urgent emails
- Classify emails by type (meeting, task, information)
- Filter and sort inbox intelligently

### 2. Multilingual Communication
- Translate French emails to English
- Maintain context and tone in translations
- Support for business communication

### 3. Task Management
- Extract action items from emails
- Assign tasks with deadlines
- Track pending work items

### 4. Meeting Coordination
- Detect meeting requests in emails
- Check calendar availability
- Schedule meetings automatically
- Avoid double-bookings

### 5. Document Analysis
- Extract text from scanned documents
- Classify documents by theme
- Answer questions about document content

### 6. Customer Support
- Generate professional email responses
- Maintain consistent tone across replies
- Reduce response time

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run type-check  # TypeScript type checking
npm run lint        # ESLint
npm run build       # Production build test
```

### Backend Testing
```bash
cd backend
python tests/test_pipeline.py  # API integration tests

# Manual testing with curl
curl -X GET http://127.0.0.1:8002/health
curl -X POST http://127.0.0.1:8002/api/translate \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test","message":"Bonjour"}'
```

### Interactive API Testing
1. Start the backend
2. Visit **http://127.0.0.1:8002/docs**
3. Use Swagger UI to test all endpoints

## 🐛 Troubleshooting

### Common Issues

#### "Invalid Date" in Frontend
**Solution**: Ensure `dateFormatter.ts` is properly imported:
```typescript
import { formatEmailDate } from "@/utils/dateFormatter";
<span>{formatEmailDate(email.date)}</span>
```

#### Backend Connection Error
- Check backend is running: `http://127.0.0.1:8002/health`
- Verify `NEXT_PUBLIC_BACKEND_URL` in frontend `.env.local`
- Check CORS settings in `backend/api/main.py`

#### Authentication Issues
- Verify Google OAuth credentials in `.env.local`
- Check Gmail API is enabled in Google Cloud Console
- Ensure redirect URIs match in Google Console

#### AI Model Errors (404)
- Verify API keys in `backend/config/.env`
- Check model names are correct
- Test with Mistral if NVIDIA keys expired

## 🔒 Security

- **OAuth 2.0**: Secure Google authentication
- **HTTP-Only Cookies**: Session tokens stored securely
- **API Key Protection**: Backend keys never exposed to client
- **CORS Configuration**: Restricted to authorized origins
- **Input Validation**: Pydantic models for request validation
- **Rate Limiting**: Protection against API abuse (future enhancement)

## 🌍 Environment Variables

### Frontend (.env.local)
```env
GOOGLE_CLIENT_ID=              # Google OAuth Client ID
GOOGLE_CLIENT_SECRET=          # Google OAuth Client Secret
GMAIL_SCOPES=                  # Gmail API scopes
NEXTAUTH_URL=                  # NextAuth callback URL
NEXTAUTH_SECRET=               # NextAuth encryption key
NEXT_PUBLIC_BACKEND_URL=       # Backend API URL
```

### Backend (config/.env)
```env
NVIDIA_API_KEY_LLAMA3_8B=      # NVIDIA API key (8B model)
NVIDIA_API_KEY_LLAMA3_70B=     # NVIDIA API key (70B model)
CLOUD_ADAPTER_API_KEY=         # Mistral API key
MISTRAL_MODEL=                 # Mistral model name
LOCAL_LLAMA_API_BASE_URL=      # Local Llama URL (optional)
LOCAL_LLAMA_MODEL_NAME=        # Local Llama model (optional)
```

## 📊 Performance

- **Email Analysis**: < 3 seconds
- **Translation**: < 2 seconds (cached: < 100ms)
- **OCR Processing**: 5-10 seconds (depending on document size)
- **RAG Question Answering**: 3-5 seconds
- **Calendar Availability Check**: < 1 second
- **Auto-Reply Generation**: < 3 seconds

## 🚧 Roadmap

### Phase 1 (Current - Hackathon MVP)
- ✅ Gmail integration
- ✅ Email analysis & translation
- ✅ Task detection
- ✅ Auto-reply generation
- ✅ Attachment processing
- ✅ Calendar integration
- ✅ RAG Q&A
- ✅ Document classification

### Phase 2 (Post-Hackathon)
- [ ] Email drafting assistant
- [ ] Bulk email processing
- [ ] Advanced filters & rules
- [ ] Email templates
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

### Phase 3 (Future)
- [ ] Multi-account support
- [ ] Team collaboration features
- [ ] Integration with Slack, Teams
- [ ] Custom AI model training
- [ ] Enterprise SSO
- [ ] Advanced security features

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Sofrecom Tunisia** for hosting the hackathon
- **Next.js Team** for the amazing framework
- **FastAPI** for the blazing-fast backend framework
- **Google** for Gmail and Calendar APIs
- **NVIDIA** and **Mistral AI** for powerful language models
- **OpenAI** for inspiration and API design patterns
- **HuggingFace** for embeddings and transformers
- **Tesseract OCR** for text extraction capabilities

## 👥 Team

 @ImenBenAmar  @YomnaJL   @	fakhfakheya  @jerbi86


## 🌟 Star Us!

If you find this project useful, please consider giving it a ⭐ on GitHub!

---

**Made with ❤️ for Sofrecom Tunisia Hackathon 2025**