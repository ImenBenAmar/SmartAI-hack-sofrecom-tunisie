# Email Automation Frontend

## Overview
The **Email Automation Frontend** is a Next.js 15 application that provides a modern, interactive interface for automated email processing and management. It integrates with a FastAPI backend to offer advanced features including Gmail inbox management, email analysis, task detection, auto-reply generation, attachment processing, RAG question answering, document classification, and Google Calendar integration.

This project is built with Next.js App Router, NextAuth.js for Google OAuth authentication, TypeScript for type safety, and Tailwind CSS for styling. It connects to both Gmail API (via Next.js API routes) and a FastAPI backend for AI-powered email processing.

## Features
- **Gmail Integration**: View inbox threads, read emails, and manage messages
- **Email Translation**: Automatic translation of French emails to English
- **Semantic Analysis**: AI-powered analysis of email intent, sentiment, and urgency
- **Task Detection**: Automatically extract actionable tasks from emails
- **Auto-Reply Generation**: Generate intelligent email responses
- **Attachment Processing**: Extract text from PDFs, images, and documents using OCR
- **RAG Question Answering**: Ask questions about email content with context-aware answers
- **Document Classification**: Identify themes and topics in documents
- **Google Calendar Integration**: Check availability and schedule meetings
- **Real-time Updates**: Live email processing with status indicators
- **Responsive Design**: Mobile-friendly interface with dark mode support

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide Icons
- **State Management**: React Hooks
- **API Client**: Native Fetch API with custom wrappers
- **Date Handling**: Native JavaScript Date API with custom formatters

## Project Structure
```
frontend/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── page.tsx                # Landing page with features overview
│   │   ├── inbox/                  # Gmail inbox pages
│   │   │   ├── page.tsx            # Inbox list view
│   │   │   └── [id]/               # Thread detail view
│   │   │       └── page.tsx
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── api/                    # Next.js API routes
│   │   │   ├── gmail/              # Gmail API proxies
│   │   │   │   ├── threads/
│   │   │   │   ├── messages/
│   │   │   │   └── extract/
│   │   │   └── auth/[...nextauth]/ # NextAuth.js routes
│   │   └── globals.css             # Global styles
│   ├── components/                 # React components
│   │   ├── AppShell.tsx            # Main navigation shell
│   │   ├── AuthProvider.tsx        # NextAuth session provider
│   │   ├── AuthButtons.tsx         # Sign in/out buttons
│   │   ├── inbox/                  # Gmail-specific components
│   │   │   ├── InboxPage.tsx       # Main inbox component
│   │   │   ├── InboxItem.tsx       # Email list item
│   │   │   ├── EmailThread.tsx     # Thread viewer
│   │   │   ├── AttachmentItem.tsx  # Attachment display
│   │   │   ├── AttachmentProcessor.tsx # Attachment processing
│   │   │   ├── FilterAccordion.tsx # Email filters
│   │   │   └── MeetingDetection.tsx # Meeting detection
│   │   ├── email/                  # Email analysis components
│   │   │   ├── EmailAnalysisResult.tsx # Analysis display
│   │   │   ├── TaskList.tsx        # Task list display
│   │   │   └── AutoReplyForm.tsx   # Reply generator
│   │   ├── attachment/             # Attachment processing
│   │   │   └── AttachmentProcessor.tsx # File upload/process
│   │   ├── calendar/               # Calendar integration
│   │   │   ├── AvailabilitySlots.tsx # Available time slots
│   │   │   └── ScheduleForm.tsx    # Event scheduling
│   │   ├── rag/                    # RAG Q&A components
│   │   │   └── RagQuestionForm.tsx # Question input/answer
│   │   ├── classification/         # Document classification
│   │   │   └── ThemesDisplay.tsx   # Theme results
│   │   ├── chatbot/                # AI chatbot
│   │   │   ├── ChatbotUI.tsx       # Chat interface
│   │   │   └── QuickActions.tsx    # Quick action buttons
│   │   └── ui/                     # Reusable UI components
│   │       ├── Loader.tsx
│   │       ├── ErrorToast.tsx
│   │       └── Button.tsx
│   ├── services/                   # API service layers
│   │   ├── gmailApi.ts             # Gmail API wrappers
│   │   ├── backendApi.ts           # FastAPI client
│   │   ├── emailService.ts         # Email processing APIs
│   │   ├── attachmentService.ts    # Attachment APIs
│   │   ├── calendarService.ts      # Calendar APIs
│   │   ├── ragService.ts           # RAG APIs
│   │   └── classificationService.ts # Classification APIs
│   ├── lib/                        # Utility libraries
│   │   ├── apiClient.ts            # HTTP client configuration
│   │   └── utils.ts                # Helper functions
│   ├── utils/                      # Utility functions
│   │   └── dateFormatter.ts        # Date formatting utilities
│   ├── types/                      # TypeScript type definitions
│   │   ├── email.ts
│   │   ├── gmail.ts
│   │   └── backend.ts
│   └── auth/                       # Authentication configuration
│       └── config.ts               # NextAuth.js configuration
├── public/                         # Static assets
│   └── favicon.ico
├── .env.local                      # Environment variables (not in git)
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## Prerequisites
- **Node.js**: 18.0 or higher
- **npm** or **yarn**: Latest version
- **Backend API**: FastAPI backend running on `http://127.0.0.1:8002`
- **Google OAuth Credentials**: Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com/)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd projet_email_automation/frontend
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the `frontend/` directory:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GMAIL_SCOPES=openid email profile https://www.googleapis.com/auth/gmail.readonly

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here

# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8002
```

**Getting Google OAuth Credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API and Google Calendar API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

**Generate NEXTAUTH_SECRET:**
```bash
# On Windows PowerShell
$secret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
Write-Host "NEXTAUTH_SECRET=$secret"

# On Linux/macOS
openssl rand -base64 32
```

### 4. Run Development Server
```bash
npm run dev
# or
yarn dev
```

The application will be available at: **http://localhost:3000**

### 5. Build for Production
```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Usage Guide

### Authentication
1. Click **"Sign In"** on the landing page
2. Authenticate with your Google account
3. Grant permissions for Gmail access
4. You'll be redirected to the inbox

### Inbox Management
- **View Emails**: Navigate to `/inbox` to see your Gmail threads
- **Read Thread**: Click on any email to view the full conversation
- **Filter Emails**: Use the filter panel to sort by unread, starred, or date
- **Search**: Use the search bar to find specific emails

### Email Processing
1. **Translate Email**: Click "Translate" on French emails
2. **Analyze Email**: Click "Analyze" to get semantic analysis (sentiment, urgency, type)
3. **Extract Tasks**: Click "Tasks" to detect action items
4. **Generate Reply**: Click "Reply" to generate an auto-response
5. **Summarize**: Click "Summary" for a concise overview

### Attachment Processing
1. Open an email with attachments
2. Click on an attachment to view
3. Click "Process with OCR" to extract text from PDFs/images
4. View extracted text and download if needed

### Calendar Integration
1. Navigate to Calendar section
2. **Check Availability**: View free time slots
3. **Schedule Meeting**: Fill the form with date, time, and duration
4. **Analyze Request**: Paste email text to detect meeting proposals

### RAG Question Answering
1. Go to RAG section
2. Paste document or email text
3. Ask questions about the content
4. Get context-aware answers powered by AI

### Document Classification
1. Navigate to Classification section
2. Upload or paste document text
3. Specify number of themes to detect
4. View identified themes with descriptions

## API Integration

### Gmail API Routes
The frontend provides Next.js API routes that proxy Gmail API:

- `GET /api/gmail/threads` - List inbox threads
- `GET /api/gmail/threads/[threadId]` - Get thread details
- `GET /api/gmail/messages/[id]` - Get message details
- `GET /api/gmail/messages/[id]/attachments/[attachmentId]` - Download attachment

### Backend API Integration
The frontend connects to the FastAPI backend at `http://127.0.0.1:8002`:

**Email Processing:**
- `POST /api/translate` - Translate email
- `POST /api/analyze` - Semantic analysis
- `POST /api/summary` - Generate summary
- `POST /api/tasks` - Detect tasks
- `POST /api/reply` - Generate auto-reply

**Attachment Processing:**
- `POST /api/attachment/process` - Process file with OCR

**Calendar:**
- `GET /api/calendar/availability` - Check free slots
- `POST /api/calendar/schedule` - Schedule event
- `POST /api/calendar/analyze` - Analyze meeting request

**RAG:**
- `POST /api/rag/ask` - Ask question with context

**Classification:**
- `POST /api/classification/themes` - Classify document themes

## Troubleshooting

### "Invalid Date" in Inbox
**Solution**: Ensure `src/utils/dateFormatter.ts` exists and is imported in email components:
```typescript
import { formatEmailDate } from "@/utils/dateFormatter";

// In your component:
<span>{formatEmailDate(email.date)}</span>
```

### Authentication Errors
- Verify `.env.local` has correct Google OAuth credentials
- Check that Gmail API is enabled in Google Cloud Console
- Ensure redirect URIs match in Google Console and `.env.local`
- Clear browser cookies and try signing in again

### Backend Connection Errors
- Verify backend is running: `http://127.0.0.1:8002/health`
- Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
- Ensure CORS is configured in backend `main.py`
- Check browser console for error details

### Build Errors
- Delete `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check ESLint configuration in `.eslintrc.json`
- Ensure all TypeScript types are correct

### TypeScript Errors
- Run type check: `npm run type-check`
- Verify all imports have correct paths
- Check that API response types match backend schemas

## Development Guidelines

### Adding New Features
1. Create component in appropriate `components/` subdirectory
2. Add service function in `services/`
3. Define TypeScript types in `types/`
4. Add route if needed in `app/`
5. Update this README with usage instructions

### Code Style
- Use TypeScript for all new files
- Follow ESLint rules (run `npm run lint`)
- Use Tailwind CSS for styling
- Prefer functional components with hooks
- Add proper TypeScript types for all props and API responses

### Testing
```bash
# Run type checking
npm run type-check

# Run ESLint
npm run lint

# Run build check
npm run build
```

## Performance Optimization
- Images are automatically optimized with Next.js `<Image>` component
- API responses are cached where appropriate
- Code splitting via Next.js App Router
- Lazy loading for heavy components

## Security Considerations
- OAuth tokens are stored in HTTP-only cookies
- API routes validate session before Gmail access
- Backend API key is server-side only
- CSRF protection via NextAuth.js
- No sensitive data in client-side code

## Browser Support
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 14+, Chrome Android

## Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License
This project is licensed under the MIT License.

## Support
For issues or questions:
- Check the [Backend README](../backend/README.md) for API documentation
- Review [Next.js Documentation](https://nextjs.org/docs)
- Check [NextAuth.js Documentation](https://next-auth.js.org/)

## Acknowledgments
- Next.js team for the excellent framework
- NextAuth.js for authentication
- Tailwind CSS for styling utilities
- Google for Gmail and Calendar APIs
- FastAPI backend team for AI processing capabilities