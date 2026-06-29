<div align="center">

# 🔄 FeedFlow

**Automate your Instagram engagement — intelligently, by interest.**

Connect your account, pick what you care about, and FeedFlow runs background sessions
that explore relevant hashtags and interact with content on your behalf.

<br/>

![React Native](https://img.shields.io/badge/React_Native-0.79-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Python](https://img.shields.io/badge/Python-Flask-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## ✨ Features

- **🎯 Interest-based automation** — choose from 17 categories (tech, fitness, food, travel, AI, finance, and more)
- **⏱️ Scheduled sessions** — automation server runs every 30 minutes across all active users
- **📊 Activity dashboard** — view session logs, action counts, and full automation history
- **🔧 Source management** — add, edit, or remove interest sources at any time
- **🔐 Auth flows** — sign up / sign in with Supabase Auth, credentials secured via Expo SecureStore

---

## 🏗️ Architecture


Mobile App (React Native + Expo)
       │
       ▼
 Supabase (PostgreSQL + Auth)
       │
       ▼
Automation Server (Flask + Node.js)
  └── Scheduler → per-user sessions every 30 min
         └── Hashtag browse → view → like

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| 📱 Mobile | React Native 0.79, Expo 54, Expo Router |
| 🎨 Styling | NativeWind (Tailwind CSS for React Native) |
| ⚡ State | Zustand, TanStack Query v5 |
| 📋 Forms | React Hook Form + Zod validation |
| 🗄️ Backend / DB | Supabase (PostgreSQL + Auth) |
| 🤖 Automation | Python (Flask), Node.js |
| 📦 Deploy | Docker, Nixpacks |

---

## 📁 Project Structure


feedflow/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Main tab navigation
│   ├── automations/              # Automation management screens
│   ├── sources/                  # Interest source screens
│   └── onboarding/               # First-run onboarding flow
├── src/
│   ├── features/                 # Feature-sliced architecture
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── automation/
│   │   ├── automation-management/
│   │   ├── sources/
│   │   └── onboarding/
│   ├── services/                 # Supabase API calls
│   ├── stores/                   # Zustand global state
│   ├── hooks/                    # Custom React hooks
│   └── types/                    # TypeScript definitions
└── automation-server/            # Backend automation engine
   └── src/
       ├── main.py               # Flask API server
       ├── scheduler.py          # Per-user session scheduler
       ├── automation.py         # Session logic (browse / like)
       └── supabase_client.py    # DB client

---

## 🚀 Getting Started

### Mobile App

bash
npm install
cp .env.example .env
npx expo start

### Automation Server

bash
cd automation-server
pip install -r requirements.txt
cp .env.example .env
python src/main.py

### Environment Variables

**Mobile (`.env`)**
env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

**Server (`automation-server/.env`)**
env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_SECRET=your_random_secret
PORT=3000

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/connect` | Link an Instagram account |
| `POST` | `/automate/:userId` | Trigger a session for one user |
| `POST` | `/run-all` | Trigger sessions for all active users |

> All write endpoints require `x-api-secret` header.

---

## 🏷️ Supported Interest Categories

`technology` · `design` · `fitness` · `food` · `travel` · `music` · `photography` · `gaming` · `business` · `art` · `science` · `fashion` · `AI` · `startups` · `finance` · `health` · `education`

---

## 📄 License

MIT
