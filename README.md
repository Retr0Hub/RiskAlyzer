# BreathSense - Health Risk Assessment Dashboard

A modern health risk assessment application built with React, TypeScript, Vite, and Firebase. Features real-time environmental data integration, AI-powered health insights using Claude Anthropic API, and a comprehensive user profile system.

## ✨ Features

- **Dashboard**: Real-time weather, AQI, and health metrics visualization
- **AI Health Analysis**: Claude-powered health insights based on biometric and environmental data
- **User Authentication**: Email/password and Google OAuth login
- **Profile Management**: Comprehensive health profile with age, sex, smoking status, and family history
- **Two-Factor Authentication**: Enhanced security for user accounts
- **Environmental Integration**: Real-time air quality and weather data from current location
- **Responsive Design**: Glass-morphic UI with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, custom animations
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **AI**: Anthropic Claude API
- **APIs**: OpenWeather, Geolocation API

## 📋 Prerequisites

- Node.js (v20 or later recommended)
- npm or yarn
- Firebase account
- Anthropic API key
- OpenWeather API key (for weather/AQI data)

## 🚀 Getting Started

### 1. **Clone and Install Dependencies**

```bash
git clone <repository-url>
cd BreathSense
npm install
```

### 2. **Setup Environment Variables**

Create a `.env` file in the root directory with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
```

### 3. **Setup Cloud Functions**

Navigate to the functions directory and install dependencies:

```bash
cd functions
npm install
```

Create `functions/.env` file with your Anthropic API key:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Build the Cloud Functions:

```bash
npm run build
```

### 4. **Deploy Cloud Functions to Firebase**

From the project root:

```bash
firebase deploy --only functions
```

This deploys the health analysis backend that proxies requests to the Anthropic API with proper CORS handling.

### 5. **Run Development Server**

From the root directory:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
├── src/
│   ├── pages/           # React page components (Dashboard, Login, Register, Settings, Landing)
│   ├── components/      # Reusable components (LoadingScreen, UserMenu, etc.)
│   ├── hooks/           # Custom React hooks (useFirestoreUserProfile, useEnvironmentData, etc.)
│   ├── lib/             # Utility functions (Firebase config, profile codec, etc.)
│   ├── auth/            # Authentication context
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app with routing
│   └── main.tsx         # React entry point
├── functions/
│   ├── src/index.ts     # Cloud Function for health analysis (Express HTTP endpoint)
│   ├── package.json     # Functions dependencies
│   └── tsconfig.json    # TypeScript config for functions
├── public/              # Static assets
├── firebase.json        # Firebase configuration
└── vite.config.ts       # Vite configuration
```

## 🔧 Available Scripts

### Root Directory

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

### Functions Directory

```bash
cd functions
npm run build        # Compile TypeScript to JavaScript
npm run deploy       # Deploy functions using Firebase CLI
npm run serve        # Run functions locally with emulator
npm run logs         # View Cloud Function logs
```

## 🔐 Security Notes

- **Environment Variables**: Never commit `.env.local` or `.env` files with real API keys to version control
- **Cloud Functions**: The `analyzeHealth` function proxies Anthropic API calls with proper CORS headers
- **Firebase Security**: User data is protected by Firestore security rules and Firebase Authentication

## 📱 Usage

### First Time Users
1. Click "Get Started" on the landing page
2. Create account (email/password or Google OAuth)
3. Complete health profile with personal information
4. Dashboard will display health insights based on your data

### Dashboard Features
- **Health Cards**: View age-adjusted life expectancy, BMI insights, and risk factors
- **Environmental Data**: Real-time AQI, weather, and air quality metrics
- **AI Analysis**: Claude analyzes your health profile and provides personalized insights
- **Recommendations**: View preventive health recommendations based on your profile

### Account Settings
- **Profile Tab**: Edit personal health information
- **Security Tab**: Update password, manage 2FA
- **Account Actions**: View account details and manage connected services

## 🐛 Troubleshooting

### Cloud Functions Deployment Issues

**Error: "ANTHROPIC_API_KEY not configured"**
- Ensure `functions/.env` has the correct API key
- Run `firebase deploy --only functions` again

**Error: "CORS policy blocked request"**
- Cloud Functions must be deployed for CORS proxy to work
- Check Firebase Console → Cloud Functions for deployment status

### Local Development Issues

**Port 5173 already in use**
```bash
npm run dev -- --port 3000
```

**Firebase emulator connection issues**
- Ensure Firebase CLI is installed: `npm install -g firebase-tools`
- Run `firebase login` to authenticate

## 📝 Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password and Google OAuth)
3. Create a Firestore database (production mode)
4. Add your domain to authorized domains in Authentication settings
5. Deploy Firestore security rules: `firebase deploy --only firestore`

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code is properly formatted (ESLint passes)
- TypeScript compiles without errors
- New features include appropriate type definitions

## 📄 License

[Add your license here]

## 📞 Support

For issues and questions, please create an issue in the repository.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# BreathSense
