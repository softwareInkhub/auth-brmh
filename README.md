# BRMH Auth UI - Next.js Version

A modern, responsive authentication interface built with Next.js 14, featuring the exact same pixel-perfect UI as the original React components.

## Features

- **Pixel-Perfect UI**: Exact same design as the original LoginForm.tsx and RegisterForm.tsx
- **Modern Stack**: Built with Next.js 14, React 18, TypeScript, and Tailwind CSS
- **Multiple Auth Methods**: 
  - Email/Password login and registration
  - OAuth integration (Google, GitHub, Facebook)
  - Password strength validation
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Type Safety**: Full TypeScript support with Zod validation
- **Performance**: Optimized with Next.js App Router and modern React patterns

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the environment file and update the values:

```bash
cp .env.example .env.local
```

Update `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=https://brmh.in
```

### 3. Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Production Build

```bash
npm run build
npm start
```

## Project Structure

```
brmh-auth-ui/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (redirects to login)
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── callback/          # OAuth callback handler
│   └── dashboard/         # Protected dashboard
├── components/            # React components
│   ├── auth/              # Authentication components
│   │   ├── login-form.tsx # Login form (pixel-perfect copy)
│   │   └── register-form.tsx # Register form (pixel-perfect copy)
│   └── ui/                # UI components
│       └── loading-spinner.tsx
├── lib/                   # Utilities and services
│   ├── auth-service.ts    # Authentication service
│   ├── validations.ts     # Zod schemas and validation
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## Key Components

### LoginForm Component
- **Exact UI**: Pixel-perfect recreation of the original LoginForm.tsx
- **Features**: Email/password login, OAuth buttons, remember me, forgot password
- **Validation**: Real-time form validation with error messages
- **Security**: Secure token handling and storage

### RegisterForm Component
- **Exact UI**: Pixel-perfect recreation of the original RegisterForm.tsx
- **Features**: Name fields, email, password with strength indicator, confirm password
- **Validation**: Comprehensive form validation with password strength feedback
- **UX**: Smooth animations and transitions

### AuthService
- **API Integration**: Handles all authentication API calls
- **Token Management**: Secure token storage and retrieval
- **OAuth Flow**: Complete OAuth implementation with PKCE
- **Error Handling**: Comprehensive error handling and user feedback

## API Integration

The application integrates with the BRMH backend API:

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `GET /auth/oauth-url` - OAuth URL generation
- `POST /auth/token` - Token exchange

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Classes**: Reusable component classes in `globals.css`
- **Responsive**: Mobile-first responsive design
- **Animations**: Smooth transitions and hover effects
- **Glass Morphism**: Modern glass effect styling

## Security Features

- **TypeScript**: Full type safety
- **Zod Validation**: Runtime type validation
- **Secure Storage**: Proper token storage handling
- **CORS**: Configured CORS headers
- **Security Headers**: Comprehensive security headers

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker

```bash
# Build the application
npm run build

# Create Dockerfile (example)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_API_BASE_URL=https://brmh.in

# Optional
DOMAIN=auth.brmh.in
CORS_ORIGIN=https://auth.brmh.in
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

- **ESLint**: Configured with Next.js rules
- **TypeScript**: Strict type checking
- **Prettier**: Code formatting (recommended)

## Migration from Original

This Next.js version maintains 100% UI compatibility with the original components:

- ✅ **Exact same styling** - All CSS classes and styles preserved
- ✅ **Same functionality** - All features work identically
- ✅ **Same API calls** - Uses the same backend endpoints
- ✅ **Same user experience** - Identical user flow and interactions
- ✅ **Enhanced performance** - Better loading and optimization

## Support

For issues and questions:
- Check the console for errors
- Verify environment variables are set correctly
- Ensure backend API is accessible
- Contact: support@brmh.in

## License

MIT License - see LICENSE file for details.