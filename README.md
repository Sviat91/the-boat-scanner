# The Boat Scanner

Reverse image search for yachts and boats across 600+ public Facebook groups. Instantly surface matching listings with direct links.

## 🚀 Features

- **Reverse Image Search**: Upload boat images to find matching listings
- **Extensive Coverage**: Search across 600+ public Facebook groups
- **Smart Matching**: AI-powered boat identification and matching
- **Direct Links**: Instant access to matching listings
- **User Authentication**: Google OAuth integration
- **Search History**: Track and manage your search history
- **Review System**: User reviews and ratings
- **Credit System**: Purchase credits for advanced searches

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui, Tailwind CSS
- **State Management**: React Query, React Hook Form
- **Authentication**: Google OAuth via Supabase
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Analytics**: Cloudflare, Umami
- **Payments**: Lemon Squeezy

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/dream-boat-snaps-discover.git
   cd dream-boat-snaps-discover
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
4. **Configure environment variables** (see Configuration section below)

5. **Start development server**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

Create a `.env` file based on `.env.example` and configure the following variables:

### Required Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

# N8N Webhook Configuration (for search functionality)
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/YOUR_WEBHOOK_ID
VITE_N8N_SECRET_TOKEN=your-secure-secret-token-here

# Support System Configuration
VITE_SUPPORT_TOKEN=your-support-system-token-here
VITE_SUPPORT_WEBHOOK=https://your-support-webhook.com/webhook/YOUR_WEBHOOK_ID
```

### Optional Configuration

- **Analytics**: Configure Cloudflare and Umami tokens in `index.html`
- **Payments**: Set up Lemon Squeezy for credit purchases

## 🚀 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run style        # Run both format and lint:fix

# Testing
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## 🏗️ Project Structure

```
dream-boat-snaps-discover/
├── src/
│   ├── components/          # React components
│   │   ├── auth/            # Authentication components
│   │   ├── review/          # Review system components
│   │   ├── search/          # Search functionality
│   │   └── ui/              # UI primitives
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Page components
│   ├── services/            # API services
│   └── utils/               # Helper functions
├── supabase/                # Supabase configuration
│   ├── functions/          # Edge Functions
│   └── migrations/          # Database migrations
├── public/                 # Static assets
└── tests/                  # Test files
```

## 🔒 Security Notes

- ⚠️ **Never commit `.env` files** - they are included in `.gitignore`
- 🔒 **Keep your API keys secure** - don't share them publicly
- ✅ **Use `.env.example`** as a template with placeholder values only
- 🛡️ **All sensitive data is properly environment-ized**

## 🧪 Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Jest + Testing Library
- **Component Tests**: React component testing
- **Hook Tests**: Custom hook testing
- **Integration Tests**: API integration testing

Run tests with:

```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:

- Visit our support page at `/support`
- Check the documentation in the `/docs` folder
- Open an issue on GitHub

---

**Built with ❤️ for the boating community**

## Setup and configuration

### Environment Variables Setup

1. **Copy environment template:**

   ```sh
   cp .env.example .env
   ```

2. **Configure required environment variables in `.env`:**

   **N8N Webhook Configuration:**

   ```
   VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/YOUR_WEBHOOK_ID
   VITE_N8N_SECRET_TOKEN=your-secure-secret-token-here
   ```

   **Supabase Configuration:**

   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

   **Google OAuth Configuration:**

   ```
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
   ```

   **Support System:**

   ```
   # Support system now works through Supabase Edge Functions
   # No additional environment variables needed on frontend
   # Configure SUPPORT_WEBHOOK_URL and SUPPORT_SECRET_TOKEN in Supabase
   ```

3. **Install dependencies:**

   ```sh
   npm install
   ```

4. **Start development server:**

   ```sh
   npm run dev
   ```

5. **Create production build:**
   ```sh
   npm run build
   ```

### Security Notes

- ⚠️ **Never commit `.env` files** - they are already in `.gitignore`
- 🔒 **Keep your API keys secure** - don't share them publicly
- ✅ **Use `.env.example`** as a template with placeholder values only

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
