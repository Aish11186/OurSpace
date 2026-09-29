# 🌱 Day Room

> A private, minimal shared digital room for two people to quietly share what they are doing throughout the day in real time.

---

## ☕ Overview

**Day Room** is a cozy, zero-distraction shared space designed for two companions (friends, partners, study buddies, or research collaborators) to stay in sync throughout the day.

### Features

- 🌿 **Realtime Two-Person Synchronization**: Powered by **Firebase Realtime Database**. When one person logs an activity, starts a timer, or sends a note, it updates instantly on the other person's screen without refreshing.
- ⏱️ **Timestamp-Based Stopwatch Timer**: Accurately tracks tasks (e.g. *"Research paper"*). Uses real timestamps (`Date.now() - startedAt`) so refreshing, backgrounding, or reopening the browser never resets the timer. Both companions see active timers ticking live.
- 📝 **Chronological Day Timelines**: Separate left and right columns for Person A and Person B showing their day's logs (newest first) with visual distinction for completed and active timers.
- ⚡ **Cozy Quick Logs**: One-tap logging for daily rituals: * Water consumed, Snack, Meal, Call, Lab work, Studied, Coding, Walk, Workout, Coffee, Nap, Meditation, Shower, Travel, Home, Sleep* plus expandable extra tags.
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

