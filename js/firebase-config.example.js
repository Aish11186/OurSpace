/**
 * Day Room - Firebase Configuration Template
 * Copy this file to js/firebase-config.js and add your project credentials.
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

function isFirebaseConfigured() {
  return firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";
}

let db = null;
let authUser = null;

try {
  if (typeof firebase !== "undefined") {
    if (isFirebaseConfigured()) {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();
    }
  }
} catch (error) {
  console.error("Firebase init error:", error);
}

window.DayRoomFirebase = {
  config: firebaseConfig,
  isConfigured: isFirebaseConfigured,
  getDb: () => db,
  getAuthUser: () => authUser
};
