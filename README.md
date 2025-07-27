# Welcome to your The Boat Scanner project

## Project info

**URL**: https://theboatscanner.com

## How can I edit this code?

There are several ways of editing your application.
Back up main

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

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


