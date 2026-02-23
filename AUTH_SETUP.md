# ClawOS Authentication Setup Guide

This guide will help you set up the authentication system for ClawOS, which includes wallet authentication (SIWE), email/password authentication, and social login (Google, Twitter).

## Prerequisites

Before starting, make sure you have:
- Node.js installed
- A Supabase account ([sign up here](https://supabase.com))
- Google Cloud Console account (for Google OAuth)
- Twitter/X Developer account (for Twitter OAuth)

## 1. Install Dependencies

### Frontend Dependencies
```powershell
cd frontend
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs siwe
```

### Backend Dependencies
```powershell
# From the root directory
npm install express-rate-limit @supabase/supabase-js cookie-parser jsonwebtoken bcrypt
```

## 2. Set Up Supabase

### Create a New Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in your project details
4. Wait for the project to be created (takes ~2 minutes)

### Set Up Database Schema
1. In your Supabase project, go to the **SQL Editor**
2. Create a new query
3. Copy the contents of `supabase-schema.sql` (in the root directory)
4. Paste it into the SQL Editor
5. Click "Run" to execute the schema

This will create:
- `user_profiles` table to store user data
- Row-level security policies
- Automatic triggers for profile creation
- Indexes for performance

### Configure Authentication Providers

#### Enable Email Authentication
1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates if desired

#### Enable Google OAuth
1. Go to **Authentication** > **Providers**
2. Enable **Google** provider
3. You'll need to create OAuth credentials in Google Cloud Console:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URIs: Add your Supabase callback URL (shown in Supabase)
   - Copy the Client ID and Client Secret
4. Paste the credentials into Supabase

#### Enable Twitter OAuth
1. Go to **Authentication** > **Providers**
2. Enable **Twitter** provider
3. Create a Twitter/X app:
   - Go to [Twitter Developer Portal](https://developer.twitter.com)
   - Create a new app
   - Enable OAuth 2.0
   - Add Supabase callback URL to allowed redirect URIs
   - Copy API Key and API Secret Key
4. Paste the credentials into Supabase

### Get Your Supabase Credentials
1. Go to **Project Settings** > **API**
2. Copy the following:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret!**

## 3. Configure Environment Variables

### Create `.env` file in root directory
```bash
# Copy from .env.example
cp .env.example .env
```

### Update `.env` with your credentials
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT & Session
# Generate these with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-generated-secret-here
SESSION_SECRET=your-generated-secret-here

# OAuth (Optional - if you want social login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

### Generate JWT Secrets
Run this command to generate secure random secrets:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do this twice - once for `JWT_SECRET` and once for `SESSION_SECRET`.

### Create `.env.local` file in frontend directory
```bash
cd frontend
```

Create `frontend/.env.local` and add:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=1f4739d580b8eb2d3144a983ed1d4323
```

## 4. Test the Authentication Flow

### Start the Backend
```powershell
# From root directory
npm start
```

The backend should start on `http://localhost:3000`

### Start the Frontend
```powershell
# In a new terminal
cd frontend
npm run dev
```

The frontend should start on `http://localhost:3001`

### Test Authentication Methods

#### Test Wallet Login (SIWE)
1. Navigate to `http://localhost:3001/auth/login`
2. Click on the "Wallet" tab
3. Connect your wallet (MetaMask, WalletConnect, etc.)
4. Sign the message
5. You should be redirected to the dashboard

#### Test Email/Password Signup
1. Navigate to `http://localhost:3001/auth/signup`
2. Click on the "Email" tab
3. Enter email and password
4. Click "Create Account"
5. Check your email for verification (if enabled)
6. Login at `/auth/login`

#### Test Social Login
1. Navigate to `http://localhost:3001/auth/login`
2. Click on the "Social" tab
3. Click "Continue with Google" or "Continue with Twitter"
4. Authorize the app
5. You should be redirected back and logged in

## 5. Security Features Included

### Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes
- Configured in `src/middleware/rateLimiter.js`

### CSRF Protection
- Protects against Cross-Site Request Forgery attacks
- Currently in development mode (logs warnings)
- To enable strict mode for production, update `src/index.js`:
  ```javascript
  // Change from:
  app.use(csrfProtectionDev);
  // To:
  const { csrfProtection } = require('./middleware/csrfProtection');
  app.use(csrfProtection);
  ```

### HTTP-Only Cookies
- Session tokens stored in HTTP-only cookies
- Prevents XSS attacks from accessing tokens
- Automatically handled by backend

### Protected Routes
- Dashboard routes require authentication
- Middleware in `frontend/middleware.ts`
- Unauthenticated users redirected to login

## 6. User Profile Management

Users can manage their profiles at `/dashboard/settings`:
- View account information
- Link/unlink wallet
- Link/unlink social accounts (Google, Twitter)
- Change password (for email users)
- Sign out

## 7. Database Structure

### `user_profiles` table
```sql
- id: UUID (references auth.users)
- email: TEXT
- wallet_address: TEXT (unique)
- linked_socials: JSONB (stores Google/Twitter IDs)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Row-Level Security (RLS)
- Users can only read/update their own profiles
- Enforced at the database level
- Configured in `supabase-schema.sql`

## 8. API Endpoints

### Authentication Endpoints
- `POST /api/auth/wallet/verify` - Verify SIWE signature and login
- `POST /api/auth/wallet/link` - Link wallet to existing account
- `POST /api/auth/wallet/unlink` - Unlink wallet from account
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/session` - Get current session
- `POST /api/auth/refresh` - Refresh JWT token

## 9. Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` exists in the `frontend` directory
- Verify that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart the frontend dev server

### "CSRF token missing" warnings
- This is normal in development mode
- The app uses `csrfProtectionDev` which only logs warnings
- For production, enable strict CSRF protection

### Rate limiting triggered during testing
- Wait 15 minutes for the limit to reset
- Or temporarily disable in `src/index.js` during development

### Social login not working
- Verify OAuth credentials in Supabase
- Check that redirect URIs match exactly
- Make sure the provider is enabled in Supabase

## 10. Production Deployment

### Environment Variables for Production
1. Set all environment variables in your hosting platform
2. Set `NODE_ENV=production`
3. Use strong, random secrets for JWT and Session
4. Set `CORS_ORIGIN` to your production domain
5. Enable strict CSRF protection

### Security Checklist
- [ ] All secrets are random and strong (min 32 characters)
- [ ] `NODE_ENV=production` is set
- [ ] CORS is configured with production domains
- [ ] CSRF protection is enabled (strict mode)
- [ ] Supabase RLS policies are enabled
- [ ] HTTPS is enforced
- [ ] Rate limiting is configured appropriately
- [ ] OAuth redirect URIs are updated with production URLs

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review SIWE documentation: https://docs.login.xyz
- Open an issue on GitHub

## Next Steps

After authentication is working:
- Add email verification flow
- Implement password reset functionality
- Add 2FA (two-factor authentication)
- Set up user roles and permissions
- Configure session timeout policies
