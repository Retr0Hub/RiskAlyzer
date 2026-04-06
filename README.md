# BreathSense — AI-Powered Personal Health Risk Dashboard

> **Real-time environmental monitoring + ESP biometric sensor + Gemini AI health insights**

[![Firebase Hosting](https://img.shields.io/badge/Live-Firebase%20Hosting-orange?logo=firebase)](https://breathsense-app.web.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📸 Overview

BreathSense is a health risk dashboard that streams data from an ESP32 breath sensor, pairs it with live air-quality / weather data, and feeds everything into **Google Gemini 2.5 Flash** for real-time personalised health insights.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌬️ **ESP Sensor Integration** | Reads breath rate (BPM) & exhaled breath temperature from connected ESP32 |
| 🤖 **Gemini AI Analysis** | Auto-triggers on value change (debounced 1.2 s); displays risk score, insights, recommendations |
| 💬 **AI Health Chat** | Full multi-turn chatbot with live dashboard context; quick-prompt chips; ⌘J shortcut |
| 🌍 **Live Environment Data** | AQI, PM2.5, PM10, temperature, humidity via Open-Meteo (free, no key required) |
| 📍 **Location Search** | Weather-app–style city search dropdown; GPS auto-locate; refreshable |
| 📊 **Trends Analytics** | 6 SVG charts — area, bar — with gridlines, y-axis labels, stable `useMemo` data |
| 🔐 **Auth** | Email/password + Google OAuth via Firebase Authentication |
| 🧬 **Health Profile** | Age, sex, smoking status, family history — stored in Firestore |
| ⚙️ **Settings** | Profile editor + password change + 2FA |
| 🎨 **Premium UI** | Glassmorphism, WeatherMotionBackdrop, circular gauges, animated FAB |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5.9, Vite 8 |
| Styling | Tailwind CSS 4, custom CSS animations |
| Auth & DB | Firebase Auth + Firestore |
| Hosting | Firebase Hosting |
| AI | Google Gemini 2.5 Flash (`generativelanguage.googleapis.com`) |
| Environment | Open-Meteo Air Quality API + Weather API (free, no key) |
| Geocoding | Open-Meteo Geocoding API |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20
- A Firebase project (Auth + Firestore enabled)
- A Google Gemini API key → [aistudio.google.com](https://aistudio.google.com)

### 1 — Clone & install

```bash
git clone https://github.com/Retr0Hub/RiskAlyzer.git
cd RiskAlyzer
npm install
```

### 2 — Environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Google Gemini  (AI health analysis + chatbot)
VITE_GEMINI_API_KEY=
```

> ⚠️ **Never commit your `.env` file.** It is listed in `.gitignore`.  
> For production, set these as Firebase Hosting environment variables or use a backend proxy.

### 3 — Run locally

```bash
npm run dev        # http://localhost:5173
```

### 4 — Deploy

```bash
npm run build      # TypeScript compile + Vite bundle → dist/
firebase deploy --only hosting
```

---

## 📁 Project Structure

```
RiskAlyzer/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx      # Main dashboard (stats, AI, ESP, environment, trends)
│   │   ├── Landing.tsx        # Marketing page
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Settings.tsx       # Profile + security settings
│   ├── components/
│   │   ├── Chatbot.tsx        # Full Gemini AI chat with health context
│   │   ├── Visualizations.tsx # CircularGauge + SparkTrendline
│   │   ├── UserMenu.tsx
│   │   └── WeatherMotionBackdrop.tsx
│   ├── hooks/
│   │   ├── useEnvironmentData.ts   # Open-Meteo weather + air quality + geocoding
│   │   ├── useGeolocation.ts
│   │   ├── useFirestoreUserProfile.ts
│   │   └── useRiskModel.ts         # Gemini AI health analysis hook
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── lifeExpectancy.ts       # Life expectancy adjustment model
│   │   └── profileCodec.ts
│   ├── auth/AuthContext.tsx
│   ├── types/user.ts
│   ├── App.tsx                # Routing
│   └── main.tsx
├── functions/                 # Firebase Cloud Functions (optional backend)
├── public/
├── firebase.json
├── .env.example
└── vite.config.ts
```

---

## 💻 Scripts

```bash
npm run dev          # Vite dev server (HMR)
npm run build        # tsc -b && vite build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run deploy:firestore   # Deploy Firestore security rules
```

---

## 🔧 ESP32 Integration

Currently the ESP sensor inputs are simulated via sliders (`Simulation Inputs`) when the device toggle is set to **ONLINE & STREAMING**. Planned real integration:

1. **Web Bluetooth API** — browser pairs directly with ESP32 BLE GATT
2. **WebSocket** — ESP streams JSON `{ bpm, tempC }` to a local WS server

The AI analysis auto-triggers (debounced 1.2 s) whenever slider values change, so swapping the slider for real sensor callbacks requires no other UI changes.

---

## 🔐 Security

Please see [SECURITY.md](SECURITY.md) for our vulnerability reporting policy.

**Quick notes:**
- `VITE_*` env vars are embedded in the JS bundle at build time — treat the Gemini key as a client-side key with limited scope where possible, or migrate calls to a Cloud Function.
- Firestore rules restrict each user to reading/writing only their own document.
- Firebase Auth handles all credential storage; no passwords are handled by the app.

---

## 🤝 Contributing

1. Fork the repo and create a feature branch
2. Ensure `npx tsc -b` exits cleanly
3. Ensure `npm run lint` passes
4. Open a PR with a clear description

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 📞 Support

Open an issue at [github.com/Retr0Hub/RiskAlyzer/issues](https://github.com/Retr0Hub/RiskAlyzer/issues).

> This application provides **illustrative, educational health estimates only** — it is not a medical device and should not be used for clinical decisions.
