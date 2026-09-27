/**
 * Day Room - Landing Page Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  const enterRoomInput = document.getElementById("enterRoomInput");
  const enterRoomBtn = document.getElementById("enterRoomBtn");
  const createRoomBtn = document.getElementById("createRoomBtn");
  
  const roomReadyModal = document.getElementById("roomReadyModal");
  const roomUrlDisplay = document.getElementById("roomUrlDisplay");
  const copyRoomLinkBtn = document.getElementById("copyRoomLinkBtn");
  const enterCreatedRoomBtn = document.getElementById("enterCreatedRoomBtn");

  const firebaseBanner = document.getElementById("firebaseBanner");
  const firebaseSetupModal = document.getElementById("firebaseSetupModal");
  const saveFirebaseConfigBtn = document.getElementById("saveFirebaseConfigBtn");
  const firebaseJsonInput = document.getElementById("firebaseJsonInput");
  const closeSetupModalBtn = document.getElementById("closeSetupModalBtn");
  const openSetupBtn = document.getElementById("openSetupBtn");

  let createdRoomId = null;
  let createdRoomUrl = null;

  // Check Firebase Configuration
  if (!DayRoomDB.isReady()) {
    if (firebaseBanner) firebaseBanner.style.display = "flex";
  }

  // Setup Modal Handlers
  if (openSetupBtn && firebaseSetupModal) {
    openSetupBtn.addEventListener("click", () => {
      firebaseSetupModal.classList.add("active");
    });
  }

  if (closeSetupModalBtn && firebaseSetupModal) {
    closeSetupModalBtn.addEventListener("click", () => {
      firebaseSetupModal.classList.remove("active");
    });
  }

  if (saveFirebaseConfigBtn && firebaseJsonInput) {
    saveFirebaseConfigBtn.addEventListener("click", () => {
      try {
        const raw = firebaseJsonInput.value.trim();
        let parsed = null;
        if (raw.startsWith("{") && raw.endsWith("}")) {
          parsed = JSON.parse(raw);
        } else {
          // Attempt key: value extraction
          const apiKey = (raw.match(/apiKey:\s*["']([^"']+)["']/) || [])[1];
          const databaseURL = (raw.match(/databaseURL:\s*["']([^"']+)["']/) || [])[1];
          const projectId = (raw.match(/projectId:\s*["']([^"']+)["']/) || [])[1];
          const authDomain = (raw.match(/authDomain:\s*["']([^"']+)["']/) || [])[1];
          const storageBucket = (raw.match(/storageBucket:\s*["']([^"']+)["']/) || [])[1];
          const messagingSenderId = (raw.match(/messagingSenderId:\s*["']([^"']+)["']/) || [])[1];
          const appId = (raw.match(/appId:\s*["']([^"']+)["']/) || [])[1];

          if (apiKey && databaseURL) {
            parsed = { apiKey, databaseURL, projectId, authDomain, storageBucket, messagingSenderId, appId };
          }
        }

        if (parsed && parsed.apiKey && parsed.databaseURL) {
          window.DayRoomFirebase.saveCustomConfig(parsed);
        } else {
          showToast("Please provide a valid config with apiKey & databaseURL.");
        }
      } catch (err) {
        showToast("Invalid JSON format. Please check your syntax.");
      }
    });
  }

  /**
   * Generates a cryptographically random room ID
   */
  function generateRoomId() {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    const array = new Uint8Array(12);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => chars[byte % chars.length]).join("");
  }

  /**
   * Helper to extract room ID from a full link, query parameter, or plain text
   */
  function extractRoomId(input) {
    if (!input) return null;
    const trimmed = input.trim();

    try {
      if (trimmed.includes("room.html") || trimmed.includes("http://") || trimmed.includes("https://")) {
        const urlObj = new URL(trimmed.startsWith("http") ? trimmed : `http://dummy.com/${trimmed}`);
        const roomParam = urlObj.searchParams.get("room");
        if (roomParam) return roomParam.trim();
      }
    } catch (e) {
      // Fallback to regex or raw string
    }

    const match = trimmed.match(/[?&]room=([^&]+)/);
    if (match) return match[1];

    // Otherwise treated as raw alphanumeric room code
    return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  }

  // Handle Enter Room
  function handleEnterRoom() {
    const rawVal = enterRoomInput.value;
    const roomId = extractRoomId(rawVal);

    if (!roomId) {
      showToast("Please enter a room link or code.");
      enterRoomInput.focus();
      return;
    }

    // Redirect to room
    window.location.href = `room.html?room=${encodeURIComponent(roomId)}`;
  }

  enterRoomBtn.addEventListener("click", handleEnterRoom);
  enterRoomInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleEnterRoom();
  });

  // Handle Create Room
  createRoomBtn.addEventListener("click", async () => {
    if (!DayRoomDB.isReady()) {
      showToast("Firebase Realtime Database is not configured yet.");
      if (firebaseSetupModal) firebaseSetupModal.classList.add("active");
      return;
    }

    try {
      createRoomBtn.disabled = true;
      createRoomBtn.textContent = "Creating room...";

      createdRoomId = generateRoomId();

      // Create in Firebase Realtime Database
      await DayRoomDB.createRoom(createdRoomId);

      // Build full URL
      const currentUrl = window.location.href.split("?")[0].split("#")[0];
      const basePath = currentUrl.substring(0, currentUrl.lastIndexOf("/") + 1);
      createdRoomUrl = `${basePath}room.html?room=${createdRoomId}`;

      // Populate UI
      roomUrlDisplay.textContent = createdRoomUrl;
      roomReadyModal.classList.add("active");

    } catch (error) {
      console.error("Failed to create room:", error);
      showToast("Failed to create room. Check Firebase connection.");
    } finally {
      createRoomBtn.disabled = false;
      createRoomBtn.textContent = "+ Create a room";
    }
  });

  // Copy Room Link
  copyRoomLinkBtn.addEventListener("click", async () => {
    if (!createdRoomUrl) return;

    try {
      await navigator.clipboard.writeText(createdRoomUrl);
      showToast("Room link copied to clipboard");
      copyRoomLinkBtn.textContent = "Copied!";
      setTimeout(() => {
        copyRoomLinkBtn.textContent = "Copy room link";
      }, 2000);
    } catch (e) {
      // Fallback copy
      const tempInput = document.createElement("input");
      tempInput.value = createdRoomUrl;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      showToast("Room link copied to clipboard");
    }
  });

  // Enter Created Room
  enterCreatedRoomBtn.addEventListener("click", () => {
    if (createdRoomId) {
      window.location.href = `room.html?room=${encodeURIComponent(createdRoomId)}`;
    }
  });
});

/**
 * Toast Notification Helper
 */
function showToast(message) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-fadeout");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  }, 3000);
}
