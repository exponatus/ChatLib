# ChatLib - AI Assistant Builder for Libraries

## Overview

ChatLib is a full-stack web application that enables library staff to create, configure, and deploy AI-powered chat assistants. Users can build custom assistants with knowledge bases (documents, text, websites, Q&A pairs), configure AI behavior, customize chat interfaces, and deploy embeddable widgets. The application uses dual authentication (local login/password + Replit Auth) and Google's Gemini AI models via Replit's AI Integrations service.

## Demo Credentials

```
Username: chatlib
Password: demo
```

Default user profile: Admin (admin@chatlib.de)

## User Preferences

Preferred communication style: Simple, everyday language (Russian/German/English).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration
- **Fonts**: Outfit (display) and Plus Jakarta Sans (body)

The frontend follows a page-based structure where each major feature (files, text, website, Q&A, AI workspace, chat interface, security, deploy, profile) has its own page component. A shared `LayoutShell` component provides consistent navigation with a sidebar for assistant-specific routes.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schema validation
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session storage
- **AI Integration**: Google Gemini models via Replit AI Integrations (`@google/genai`)
- **Password Security**: bcryptjs with 10 rounds for secure password hashing

The server uses a modular integration pattern with dedicated folders under `server/replit_integrations/` for auth, chat, image generation, and batch processing utilities.

### Data Models
- **Users**: Dual auth support (local username/password + Replit OIDC), stored with profile information including avatar
- **Assistants**: AI assistants with system prompts, welcome messages, cover images, and deployment configs
- **Documents**: Knowledge base items linked to assistants (files, text, websites, Q&A)
- **Conversations/Messages**: Chat sessions tied to specific assistants

### Authentication
- **Local Auth**: Username/password with bcrypt hashing, session-based
- **Replit Auth**: OpenID Connect provider
- **Session Storage**: PostgreSQL via connect-pg-simple
- **Pattern**: Passport.js strategy with automatic user upsert on login
- **Default User**: chatlib/demo created automatically on startup

### Key Design Decisions

1. **Shared Schema Location**: Database schemas live in `shared/` to enable type sharing between frontend and backend via path aliases (`@shared/*`).

2. **AI Model Selection**: Uses Gemini 2.5 Flash (fast) and Pro (reasoning) models through Replit's AI Integrations, which proxies requests and handles API keys automatically.

3. **Demo Assistant Pattern**: Each user gets a non-deletable demo assistant that resets to defaults, ensuring users always have an example to work with.

4. **Streaming Chat**: Chat responses use Server-Sent Events (SSE) for real-time streaming from the AI model to the UI.

5. **Document-based RAG**: Knowledge base documents are stored with extracted content for retrieval-augmented generation during chat.

6. **Dual Authentication**: Supports both local login (username/password) and Replit OAuth for flexibility.

7. **Avatar Storage**: User avatars stored as base64 in database (max 2MB).

## External Dependencies

### Database
- **PostgreSQL**: Primary database for all application data
- **Drizzle ORM**: Type-safe database queries and migrations
- **drizzle-kit**: Database schema push via `npm run db:push`

### Authentication
- **Local Auth**: bcryptjs for password hashing
- **Replit Auth**: OpenID Connect provider (configured via `ISSUER_URL`)
- **Required Environment Variables**: `SESSION_SECRET`, `DATABASE_URL`, `REPL_ID`

### AI Services
- **Replit AI Integrations**: Provides Gemini API access
- **Required Environment Variables**: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`
- **Models Used**: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.5-flash-image`

### Third-Party Libraries
- **shadcn/ui**: Pre-built accessible React components (Radix UI primitives)
- **TanStack Query**: Async state management with caching
- **Framer Motion**: Page transitions and animations
- **react-hook-form + Zod**: Form handling with schema validation
- **date-fns**: Date formatting utilities
- **bcryptjs**: Password hashing

## Security Notes

- All passwords are hashed with bcrypt (10 rounds)
- Passwords are never returned in API responses
- No secrets or API keys are hardcoded
- Environment variables used for all sensitive configuration
- .gitignore excludes .env files and secrets
