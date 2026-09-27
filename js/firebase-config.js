/**
 * Day Room - Firebase Configuration
 */

const firebaseConfig = {
  apiKey: "AIzaSyDl4M9h-7QrQS1-FHJm2004DU0QvEH2j4c",
  authDomain: "privrooms-c66c2.firebaseapp.com",
  databaseURL: "https://privrooms-c66c2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "privrooms-c66c2",
  storageBucket: "privrooms-c66c2.firebasestorage.app",
  messagingSenderId: "440454974049",
  appId: "1:440454974049:web:d6e9d80d548a29e5263820",
  measurementId: "G-CZN55RHXHJ"
};

// State flag to check if user has filled in real credentials
function isFirebaseConfigured() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
    const localConfigStr = localStorage.getItem("dayroom_custom_firebase_config");
    if (localConfigStr) {
      try {
        const parsed = JSON.parse(localConfigStr);
        if (parsed.apiKey && parsed.apiKey !== "YOUR_API_KEY" && parsed.databaseURL) {
          Object.assign(firebaseConfig, parsed);
          return true;
        }
      } catch (e) {
        console.error("Invalid stored Firebase config", e);
      }
    }
    return false;
  }
  return true;
}

let db = null;
let authUser = null;

// Safe Firebase Initialization & Optional Anonymous Auth
try {
  if (typeof firebase !== "undefined") {
    const configured = isFirebaseConfigured();
    if (configured) {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();

      // If Firebase Auth SDK is present, sign in anonymously for secure authenticated rules
      if (typeof firebase.auth === "function") {
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            authUser = user;
            console.log("Day Room: Authenticated session active (UID: " + user.uid + ")");
          } else {
            firebase.auth().signInAnonymously().catch((authErr) => {
              console.info("Firebase Auth note (anonymous sign-in):", authErr.message || authErr);
            });
          }
        });
      }

      console.log("Day Room: Firebase Realtime Database connected successfully.");
    } else {
      console.warn("Day Room: Firebase is not configured yet. Please update js/firebase-config.js or see FIREBASE_AUTH_SETUP.txt.");
    }
  } else {
    console.error("Firebase SDK script not loaded in page.");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Attach to window object for global script access
window.DayRoomFirebase = {
  config: firebaseConfig,
  isConfigured: isFirebaseConfigured,
  getDb: () => db,
  getAuthUser: () => authUser,
  saveCustomConfig: (newConfig) => {
    localStorage.setItem("dayroom_custom_firebase_config", JSON.stringify(newConfig));
    location.reload();
  }
};
