# 🌱 Day Room

> A private, minimal shared digital room for two people to quietly share what they are doing throughout the day in real-time.

---

## ☕ Overview

**Day Room** is a cozy, zero-distraction shared space designed for two companions (friends, partners, study buddies, or research collaborators) to stay in sync throughout the day.

### Features

- 🌿 **Realtime Two-Person Synchronization**: Powered by **Firebase Realtime Database**. When one person logs an activity, starts a timer, or sends a note, it updates instantly on the other person's screen without refreshing.
- ⏱️ **Timestamp-Based Stopwatch Timer**: Accurately tracks tasks (e.g. *"Research paper"*). Uses real timestamps (`Date.now() - startedAt`) so refreshing, backgrounding, or reopening the browser never resets the timer. Both companions see active timers ticking live.
- 📝 **Chronological Day Timelines**: Separate left and right columns for Person A and Person B showing their day's logs (newest first) with visual distinction for completed and active timers.
- ⚡ **Cozy Quick Logs**: One-tap logging for daily rituals: *💧 Water consumed, 🍪 Snack, 🍽️ Meal, 📞 Call, 🔬 Lab work, 📚 Studied, 💻 Coding, 🚶 Walk, 🏋️ Workout, ☕ Coffee, 😴 Nap, 🧘 Meditation, 🛁 Shower, 🚗 Travel, 🏠 Home, 🛌 Sleep* plus expandable extra tags.
- 💌 **Shared Notes**: A quiet, minimal bottom stream for short notes without chaotic chat clutter.
- 🔒 **Private Room Isolation**: Cryptographically random room URLs. No public directories or discoverability.
- 🗑️ **Log Control**: Delete individual logs or clear all your logs with confirmation without affecting your companion's logs or messages.
- 📱 **Mobile & Desktop Responsive**: Elegant 3-column layout on desktop; clean vertical stack on mobile devices.

---

## 🛠️ Tech Stack

- **Frontend**: Pure Semantic HTML5, Vanilla CSS3 (Custom cozy design tokens, typography from Google Fonts: *Fraunces*, *Plus Jakarta Sans*, *JetBrains Mono*), and Vanilla JavaScript.
- **Backend / Realtime Sync**: **Firebase Realtime Database** (Firebase Web SDK compat).
- **Deployment**: 100% Static files — zero build steps needed, directly deployable to **Vercel**, **Netlify**, **GitHub Pages**, or any static web server.

---

## 🚀 Step-by-Step Firebase Setup Guide

Follow these simple steps to connect your Firebase Realtime Database:

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** (or **"Create a project"**).
3. Name your project (e.g., `day-room-app`).
4. You can disable Google Analytics (optional) and click **"Create project"**.

### Step 2: Register a Web App
1. On your Firebase project overview page, click the **Web icon** (`</>`) to add a web app.
2. Enter an App nickname (e.g., `Day Room Web`).
3. You can leave "Firebase Hosting" unchecked for now, and click **"Register app"**.
4. Firebase will display your `firebaseConfig` credentials object.

### Step 3: Enable Realtime Database
1. In the left navigation sidebar of Firebase Console, click **"Build"** → **"Realtime Database"**.
2. Click **"Create Database"**.
3. Choose a database location (e.g., `United States (us-central1)` or closest to you) and click **Next**.
4. Select **"Start in test mode"** or **"Start in locked mode"** and click **Enable**.

### Step 4: Configure Realtime Database Rules
1. In the Realtime Database section, click on the **"Rules"** tab.
2. Replace the existing rules with the following configuration (also provided in `database.rules.json`):

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['users']) || data.exists()"
      }
    }
  }
}
```
3. Click **"Publish"**.

> **Security Note:**  
> Anyone who has the room URL may access that specific room. Day Room uses long, cryptographically random room IDs to isolate rooms. For production environments requiring strict user authentication, Firebase Anonymous Authentication can be enabled.

### Step 5: Add Credentials to `js/firebase-config.js`
Open [`js/firebase-config.js`](file:///c:/Users/hp/OneDrive/Desktop/Taskmirrorforakshat/js/firebase-config.js) in your project and replace the placeholders with your Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyYourActualApiKeyHere...",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

*(Alternatively, when you open the app in a browser, a friendly banner allows you to paste your config JSON directly into the browser settings).*

---

## 💻 Running Locally

Because this is a pure static web app, you can run it with any local static HTTP server:

### Option A: Using Python
```bash
python -m http.server 8080
```
Then open: `http://localhost:8080` in your browser.

### Option B: Using Node (`npx serve`)
```bash
npx -y serve .
```
Then open: `http://localhost:3000`

### Option C: VS Code Live Server extension
Right-click [`index.html`](file:///c:/Users/hp/OneDrive/Desktop/Taskmirrorforakshat/index.html) and select **"Open with Live Server"**.

---

## 🌐 Deploying to Vercel (Production)

Deploying Day Room to Vercel takes under 1 minute:

### Deploy with Vercel CLI:
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy from project folder
vercel --prod
```

### Deploy via GitHub on Vercel Dashboard:
1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and click **"Add New" → "Project"**.
3. Import your GitHub repository.
4. Framework Preset: **Other** (Root directory: `./`).
5. Click **"Deploy"**.

Your app is now live with a production HTTPS URL!

---

## 📱 Testing Realtime Multi-Device Sync

To test the multi-device functionality:

1. **Device 1 (Person A)**:
   - Open your deployed URL (e.g. `https://your-app.vercel.app`).
   - Click **"+ Create a room"**.
   - Copy the generated Room link (e.g. `https://your-app.vercel.app/room.html?room=8fK2xPq91Lm`).
   - Click **"Enter room"** and enter your name (e.g. *"Maya"*).
2. **Device 2 or Incognito Window (Person B)**:
   - Open the copied Room link on your phone or in a second browser profile.
   - Enter Person B's name (e.g. *"Akshat"*).
3. **Verify Realtime Interaction**:
   - **Timers**: On Device 1, click **"▶ Start timer"** → Enter *"Research paper"*. Device 2 will instantly see Maya's active timer ticking upward every second.
   - **Finish Timer**: On Device 1, click **"⏹ Finish timer"**. Device 2 will immediately see the completed duration card.
   - **Quick Logs**: On Device 2, tap **"💧 Water consumed"** or **"☕ Coffee"**. It instantly appears on Device 1's timeline.
   - **Notes**: On Device 1, type *"proud of you 🥺"* in the notes bar and hit send. Device 2 will immediately receive it.
   - **Delete**: On Device 1, click `×` to remove a log. It disappears from Device 2's screen in real time.

---

## 📂 Project Structure

```
DayRoom/
├── index.html               # Landing page (Enter room link / Create room modal)
├── room.html                # 3-Column main room dashboard (Person A, Controls, Person B, Messages)
├── styles/
│   ├── main.css             # Design tokens, warm color palette, typography & reset
│   ├── landing.css          # Landing page styles, cozy cards, modal animations
│   └── room.css             # 3-Column desktop grid, mobile stack, stopwatch & timeline styles
├── js/
│   ├── firebase-config.js   # Firebase configuration & initialization
│   ├── db.js                # Firebase Realtime Database CRUD & realtime listeners
│   ├── landing.js           # Landing page logic & room creation
│   └── room.js              # Room logic, stopwatch intervals, live sync & messages
├── database.rules.json      # Firebase Realtime Database security rules
├── vercel.json              # Static routing configuration for Vercel
└── README.md                # Documentation & Setup Guide
```
