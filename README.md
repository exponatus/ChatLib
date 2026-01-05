# ChatLib - AI Assistant Builder for Libraries

ChatLib is a multi-tenant SaaS platform that enables libraries to create, configure, and deploy AI-powered chat assistants without any technical expertise. Built with modern web technologies and powered by Google's Gemini AI models.

## Demo Credentials

```
Username: chatlib
Password: demo
```

These are the default credentials for testing the application. The default user is created automatically on first startup with the following profile:
- Full Name: Admin
- Email: admin@chatlib.de

## Features

### Dual Authentication System
- **Local Login** - Username/password authentication with bcrypt hashing
- **Replit Auth** - OAuth via OpenID Connect for Replit users
- **User Profile** - Avatar upload, name and email editing, personal cabinet

### AI-Powered Assistants
- **Google Gemini Integration** - Uses Gemini 2.5 Flash and Pro models via Replit AI Integrations
- **Streaming Responses** - Real-time chat with Server-Sent Events (SSE)
- **Response Caching** - Automatic caching of first-turn responses for cost optimization
- **Multi-language Support** - Built-in support for Russian, German, and English

### Knowledge Base System
- **Files** - Upload PDF, DOCX, TXT documents
- **Text Assets** - Add institutional protocols and policy text directly
- **Website Scraping** - Import content from library websites
- **Q&A Pairs** - Define high-precision answers for critical questions with deterministic matching

### Chat Interface Customization
- **Multiple Themes** - Light, Dark, and Library-branded themes
- **Custom Branding** - Configurable colors, welcome messages, and footer text
- **Avatar Support** - Custom assistant avatars with AI image generation
- **Suggested Questions** - Pre-defined conversation starters

### Deployment & Embedding
- **Embeddable Widget** - JavaScript snippet for any website
- **Floating Chat Button** - Configurable position and styling
- **Full-page Chat** - Standalone chat interface option
- **Analytics Integration** - Google Analytics support

### Security & Access Control
- **Domain Whitelisting** - Restrict widget embedding to specific domains
- **Rate Limiting** - Configurable requests per minute
- **IP Blocking** - Block specific IP addresses
- **Password Hashing** - bcrypt with 10 rounds for secure password storage

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool with HMR
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **TanStack Query** - Server state management
- **Wouter** - Lightweight routing
- **Framer Motion** - Animations

### Backend
- **Express.js** - REST API server
- **PostgreSQL** - Database with Drizzle ORM
- **Passport.js** - Authentication middleware
- **Google Generative AI** - Gemini model integration
- **bcryptjs** - Password hashing

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Replit account (for AI Integrations and Auth)

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Session
SESSION_SECRET=your-session-secret

# AI Integration (provided by Replit)
AI_INTEGRATIONS_GEMINI_API_KEY=your-gemini-api-key
AI_INTEGRATIONS_GEMINI_BASE_URL=https://...

# Replit Auth
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
```

### Installation

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`.

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── pages/         # Page components
├── server/                 # Backend Express application
│   ├── replit_integrations/ # Replit service integrations
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── storage.ts         # Database operations
├── shared/                 # Shared types and schemas
│   ├── schema.ts          # Drizzle database schema
│   └── routes.ts          # API route definitions
└── drizzle.config.ts      # Database configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/user` - Get current user
- `PATCH /api/auth/user` - Update user profile
- `POST /api/auth/avatar` - Upload avatar (base64)
- `DELETE /api/auth/avatar` - Delete avatar
- `GET /api/auth/replit` - Initiate Replit OAuth
- `GET /api/auth/replit/callback` - OAuth callback

### Assistants
- `GET /api/assistants` - List user's assistants
- `POST /api/assistants` - Create assistant
- `GET /api/assistants/:id` - Get assistant details
- `PATCH /api/assistants/:id` - Update assistant
- `DELETE /api/assistants/:id` - Delete assistant

### Documents (Knowledge Base)
- `GET /api/assistants/:id/documents` - List documents
- `POST /api/assistants/:id/documents` - Create document
- `PATCH /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Chat
- `POST /api/assistants/:id/conversations` - Create conversation
- `POST /api/chat/:conversationId` - Send message (SSE streaming)

### Embedding
- `GET /api/embed/:assistantId/config` - Get widget configuration
- `POST /api/embed/:assistantId/session` - Create chat session

## Security

- All passwords are hashed with bcrypt (10 rounds)
- Passwords are never returned in API responses
- Session-based authentication with secure cookies
- No secrets or API keys are hardcoded in the codebase
- Environment variables are used for all sensitive configuration

## Deployment

ChatLib can be deployed on any platform that supports Node.js and PostgreSQL:

### General Deployment

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Configure environment variables (see Environment Variables section)
5. Push database schema: `npm run db:push`
6. Build the application: `npm run build`
7. Start production server: `npm start`

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Hosting Options

- **VPS/Cloud**: DigitalOcean, AWS EC2, Google Cloud, Azure
- **PaaS**: Heroku, Railway, Render, Fly.io
- **Replit**: Use built-in deployment with Secrets for environment variables

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Alexander Ananyev

---

Built with Replit Agent
