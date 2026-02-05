# 🏳️‍🌈 Project Prism - Progressive Web App

**High-security, zero-knowledge Progressive Web App for LGBTQIA+ safety**

> *"A constellation of safety in the palm of your hand"*

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Security: E2EE](https://img.shields.io/badge/Security-E2EE-green.svg)]()
[![Privacy: Zero-Knowledge](https://img.shields.io/badge/Privacy-Zero--Knowledge-purple.svg)]()

---

## 🌐 **NOW A PROGRESSIVE WEB APP!**

**Project Prism has been fully converted from a React Native mobile app to a modern Progressive Web App (PWA).**

### Why PWA?
- ✅ **Works everywhere**: Desktop, mobile, tablet - one codebase
- ✅ **No app stores**: Access instantly via web browser
- ✅ **Installable**: "Add to Home Screen" for app-like experience
- ✅ **Offline-first**: Service workers enable offline functionality
- ✅ **Faster deployment**: Updates reach users immediately
- ✅ **Better security**: Web crypto APIs, sandboxed by default

---

## ⚠️ IMPORTANT: THIS IS NOT A DATING APP

**Project Prism is a SAFETY and COMMUNITY RESOURCES app.**  
It will never include dating, hookups, or romantic matching features.

---

## 🎯 Mission

Provide at-risk LGBTQIA+ individuals with:
- **Safe access to community resources** (healthcare, housing, support)
- **End-to-end encrypted communication** (Signal Protocol)
- **Anonymous mutual aid coordination**
- **Panic mode protection** for dangerous situations

## ✨ Features

### 🗺️ Resource Map
- Find LGBTQIA+-friendly organizations nearby using **Leaflet web maps**
- Safe spaces, healthcare providers, community centers
- Verified and community-rated locations
- Works offline with cached data

### 💬 Encrypted Messaging
- Signal Protocol end-to-end encryption using **Web Crypto API**
- Zero-knowledge server architecture
- Safety number verification
- Auto-deleting messages

### 🏕️ Tribes (Blind Beacons)
- Find others with shared experiences anonymously
- Topics: Trans support, BIPOC Queer, Newly Out, etc.
- No profiles, no photos - just encrypted conversation starters
- Location-optional discovery

### 🤝 Mutual Aid Network
- Offer or request community support
- Categories: Food, Housing, Transport, Emotional Support

## 🛠️ Tech Stack

### Frontend (PWA)
- **React 18** + **TypeScript** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **Leaflet** - Interactive web maps (replaces React Native Maps)
- **TweetNaCl** - Cryptography (Signal Protocol)
- **IndexedDB** - Secure local storage (replaces Keychain/AsyncStorage)
- **Service Workers** - Offline support and caching
- **Workbox** - PWA tooling

### Backend
- **Django** + **Django REST Framework**
- **PostgreSQL** (planned)
- **Docker** for containerization
- Fuzzy locations for privacy (~200m radius)
- Gift economy - no money exchanges

### 📍 Queer Cache
- Location-based encrypted messages ("digital graffiti")
- Walk within 20m to unlock and read
- Leave notes for future community members
- Historical markers, safe spot tips, encouragement

### 🚨 Panic Mode
- **Shake to hide**: 2.5G shake instantly shows decoy calculator
- **Duress PINs**:
  - `1969` - Real unlock (Stonewall reference)
  - `0000` - Opens decoy calculator
  - `9111` - Scorched Earth (wipes all data)
- **Quick exit**: Volume button shortcut

## 🔐 Security Architecture

### Split-Brain Design
```
┌─────────────────────────────────────────────────────┐
│                    PUBLIC PLANE                      │
│  • Organization directory (PostGIS)                  │
│  • Mutual aid listings (fuzzy locations)            │
│  • Beacon topics (no content)                        │
└─────────────────────────────────────────────────────┘
                         │
                    [Blind Relay]
                         │
┌─────────────────────────────────────────────────────┐
│                   PRIVATE PLANE                      │
│  • E2EE messages (server sees only ciphertext)      │
│  • Identity keys (device-only)                       │
│  • Recovery phrases (user-controlled)               │
└─────────────────────────────────────────────────────┘
```

### Zero-Knowledge Principles
- **No usernames or emails** - Users identified by cryptographic hash
- **No passwords stored** - Key-based authentication only
- **No message content** - Server is blind relay
- **No precise locations** - Fuzzy by default
- **No analytics** - Privacy over metrics

### Encryption Stack
- **Signal Protocol** for message encryption
- **Curve25519** for key exchange
- **AES-256-GCM** for symmetric encryption
- **HMAC-SHA256** for authentication
- **BIP-39** for recovery phrases

## 🛠️ Tech Stack

### Backend
- **Django 4.2+** with Django REST Framework
- **PostgreSQL + PostGIS** for geospatial queries
- **Redis** for caching and rate limiting
- **Celery** for background tasks

### Mobile
- **React Native CLI** (not Expo - for native crypto)
- **TypeScript** for type safety
- **react-native-keychain** for Secure Enclave storage
- **react-native-maps** for resource mapping

### Infrastructure
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **Trivy** for security scanning

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Android Studio / Xcode

### Setup
```bash
# Clone the repo
git clone https://github.com/prism-network/prism-app.git
cd prism-app

# Windows
scripts\setup-dev.bat

# macOS/Linux
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh

# Start services
docker-compose up -d

# Run mobile app
cd mobile
npm install
npx react-native run-android  # or run-ios
```

### Environment Variables
Copy `.env.example` to `.env` in both `backend/` and `mobile/` directories.

## 📁 Project Structure

```
prism-app/
├── backend/                 # Django API
│   ├── core/               # Main app (models, views, serializers)
│   ├── prism/              # Django settings
│   └── utils/              # Anonymization, short links
├── mobile/                  # React Native app
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # Reusable UI components
│   │   ├── crypto/         # Signal Protocol, recovery
│   │   ├── navigation/     # Tab navigator
│   │   ├── screens/        # All app screens
│   │   ├── theme/          # Colors, spacing, fonts
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Storage, location, panic
│   └── ios/ android/       # Native projects
├── docs/                    # Documentation
│   ├── openapi.yaml        # API specification
│   ├── SECURITY.md         # Security policies
│   └── SOP-001.md          # Moderator procedures
├── scripts/                 # Setup and deployment
└── docker-compose.yml       # Local development
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest -v

# Mobile tests
cd mobile
npm test

# E2E tests
npm run e2e:android
```

## 🔒 Security

See [SECURITY.md](docs/SECURITY.md) for:
- Vulnerability reporting
- Security architecture details
- Threat model
- Incident response

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code of conduct
- Development workflow
- Pull request guidelines
- Security review requirements

## 📜 License

**GNU Affero General Public License v3.0**

This ensures:
- Source code must remain open
- Network use counts as distribution
- Modifications must be shared
- No proprietary forks

## 🙏 Acknowledgments

- The Signal Foundation for the encryption protocol
- The LGBTQIA+ community for guidance and trust
- All contributors who believe in digital safety

---

<p align="center">
  <strong>Built with 💜 for the community</strong><br>
  <em>"We protect each other"</em>
</p>
