## Global Rules

Read and follow all rules from @AGENTS.md file in this project.

# Project Rules

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on port 8080)
- **Build for production**: `npm run build` 
- **Build for development**: `npm run build:dev`
- **Lint code**: `npm run lint`
- **Preview build**: `npm run preview`

## Project Architecture

**The Boat Scanner** is a React TypeScript application that allows users to upload boat images and identify boat models using AI-powered image recognition.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components + Tailwind CSS + Radix UI primitives
- **Backend**: Supabase (auth, database, edge functions)
- **Authentication**: Google OAuth with Supabase Auth and One Tap integration
- **Payment**: Lemon Squeezy integration with credit system
- **Image Processing**: React Dropzone for uploads

### Key Configuration
- **Path Aliases**: `@/` maps to `./src/`
- **TypeScript**: Relaxed settings for rapid development (`noImplicitAny: false`, `strictNullChecks: false`)
- **Dev Server**: Configured for host `boat.nodayoby.online` on port 8080
- **Environment Variables**: Requires `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`

### Authentication Flow
- Uses `AuthContext` with Google OAuth provider
- Implements Google One Tap for seamless sign-in
- Protected routes use `ProtectedRoute` component
- Auth callback handled at `/auth/callback` route

### Credit/Subscription System
- Users have credit balances for boat scans
- Lemon Squeezy webhook handles subscription updates via `/supabase/functions/lemonsqueezy-webhook/`
- Credit tracking integrated with search functionality

### Project Structure
```
src/
├── pages/           # Main application pages (Index, Dashboard, etc.)
├── components/      
│   ├── auth/       # Authentication components (GoogleSignInButton, AuthStatus, etc.)
│   └── ui/         # shadcn/ui components
├── contexts/        # React contexts (AuthContext)
├── lib/            # Utilities (supabase, subscription, utils)
├── hooks/          # Custom React hooks (useSearchHistory, etc.)
└── utils/          # Helper functions

supabase/
└── functions/      # Edge functions (lemonsqueezy-webhook)
```

### Key Components
- **UploadBox**: Drag-and-drop image upload with preview
- **HistoryCard**: Displays search results and matches
- **CreditPurchaseMenu**: Handles credit purchases
- **AuthStatus**: Shows user authentication state
- **ProtectedRoute**: Route wrapper for authenticated pages

### Search History
- Saves search results to Supabase with user images
- Uses `useSearchHistory` hook for persistence
- Displays historical searches on main page

### Styling
- Uses CSS custom properties for theming
- Dark/light theme support via `ThemeProvider`
- Responsive design with mobile-first approach
- Tailwind with custom color palette defined in config