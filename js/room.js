/**
 * Day Room - Room View Logic
 * 
 * Manages participant slots, live stopwatch, Pomodoro sessions with sound/notifications,
 * water tracking, live selfie/camera capture, timeline synchronization, message streams,
 * and deletion operations.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Parse Room ID
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("room");

  if (!roomId) {
    alert("No room specified. Redirecting to home.");
    window.location.href = "index.html";
    return;
  }

  // DOM Elements - Header & Connectivity
  const roomStatusText = document.getElementById("roomStatusText");
  const liveStatusDot = document.getElementById("liveStatusDot");
  const shareRoomBtn = document.getElementById("shareRoomBtn");

  // Columns & Timelines
  const personAName = document.getElementById("personAName");
  const personABadge = document.getElementById("personABadge");
  const personATimelineList = document.getElementById("personATimelineList");
  const personAEmptyState = document.getElementById("personAEmptyState");
  const personAFooter = document.getElementById("personAFooter");
  const personADeleteAllBtn = document.getElementById("personADeleteAllBtn");

  const personBName = document.getElementById("personBName");
  const personBBadge = document.getElementById("personBBadge");
  const personBTimelineList = document.getElementById("personBTimelineList");
  const personBEmptyState = document.getElementById("personBEmptyState");
  const personBFooter = document.getElementById("personBFooter");
  const personBDeleteAllBtn = document.getElementById("personBDeleteAllBtn");

  // Water Trackers
  const personAWaterTracker = document.getElementById("personAWaterTracker");
  const personAWaterCount = document.getElementById("personAWaterCount");
  const personAWaterMeter = document.getElementById("personAWaterMeter");

  const personBWaterTracker = document.getElementById("personBWaterTracker");
  const personBWaterCount = document.getElementById("personBWaterCount");
  const personBWaterMeter = document.getElementById("personBWaterMeter");

  // Floating Toolbox Elements
  const toolboxWidget = document.getElementById("toolboxWidget");
  const toolboxTriggerBtn = document.getElementById("toolboxTriggerBtn");
  const toolboxPanel = document.getElementById("toolboxPanel");
  const toolboxCloseBtn = document.getElementById("toolboxCloseBtn");
  const waterToolToggleBtn = document.getElementById("waterToolToggleBtn");
  const waterToolBadge = document.getElementById("waterToolBadge");
  const waterToolCard = document.getElementById("waterToolCard");
  const quickLogsToggleBtn = document.getElementById("quickLogsToggleBtn");
  const quickLogsToolBadge = document.getElementById("quickLogsToolBadge");
  const quickLogsToolCard = document.getElementById("quickLogsToolCard");
  const toolboxActiveCount = document.getElementById("toolboxActiveCount");

  // Todo Lists
  const personATodoSection = document.getElementById("personATodoSection");
  const personATodoCount = document.getElementById("personATodoCount");
  const personATodoForm = document.getElementById("personATodoForm");
  const personATodoInput = document.getElementById("personATodoInput");
  const personATodoList = document.getElementById("personATodoList");
  const personATodoEmpty = document.getElementById("personATodoEmpty");

  const personBTodoSection = document.getElementById("personBTodoSection");
  const personBTodoCount = document.getElementById("personBTodoCount");
  const personBTodoForm = document.getElementById("personBTodoForm");
  const personBTodoInput = document.getElementById("personBTodoInput");
  const personBTodoList = document.getElementById("personBTodoList");
  const personBTodoEmpty = document.getElementById("personBTodoEmpty");

  // My Controls: Timer & Pomodoro
  const timerControlSection = document.getElementById("timerControlSection");
  const timerIdleState = document.getElementById("timerIdleState");
  
  // Stopwatch elements
  const timerRunningState = document.getElementById("timerRunningState");
  const startTimerOpenBtn = document.getElementById("startTimerOpenBtn");
  const activeTaskTitle = document.getElementById("activeTaskTitle");
  const activeTimerClock = document.getElementById("activeTimerClock");
  const finishTimerBtn = document.getElementById("finishTimerBtn");

  // Pomodoro elements
  const startPomodoroOpenBtn = document.getElementById("startPomodoroOpenBtn");
  const pomodoroRunningState = document.getElementById("pomodoroRunningState");
  const pomodoroPhaseBadge = document.getElementById("pomodoroPhaseBadge");
  const activePomodoroTaskTitle = document.getElementById("activePomodoroTaskTitle");
  const activePomodoroClock = document.getElementById("activePomodoroClock");
  const nextPomodoroPhaseBtn = document.getElementById("nextPomodoroPhaseBtn");
  const finishPomodoroBtn = document.getElementById("finishPomodoroBtn");

  // My Controls: Logs & Quick Actions
  const customLogForm = document.getElementById("customLogForm");
  const customLogInput = document.getElementById("customLogInput");
  const quickLogSection = document.getElementById("quickLogSection");
  const quickLogButtons = document.querySelectorAll(".quick-chip[data-log]");
  const quickMoreBtn = document.getElementById("quickMoreBtn");
  const expandedTagsPanel = document.getElementById("expandedTagsPanel");

  // Messages & Camera
  const messagesStream = document.getElementById("messagesStream");
  const messagesEmptyState = document.getElementById("messagesEmptyState");
  const messageForm = document.getElementById("messageForm");
  const messageInput = document.getElementById("messageInput");
  const openCameraBtn = document.getElementById("openCameraBtn");

  // Live Camera Modal Elements
  const cameraModal = document.getElementById("cameraModal");
  const cameraModalTitle = document.getElementById("cameraModalTitle");
  const cameraModalSubtitle = document.getElementById("cameraModalSubtitle");
  const cameraViewfinderState = document.getElementById("cameraViewfinderState");
  const cameraVideo = document.getElementById("cameraVideo");
  const cameraCanvas = document.getElementById("cameraCanvas");
  const cameraLoadingOverlay = document.getElementById("cameraLoadingOverlay");
  const cameraPreviewState = document.getElementById("cameraPreviewState");
  const capturedPhotoImg = document.getElementById("capturedPhotoImg");
  const cameraCaptionInput = document.getElementById("cameraCaptionInput");
  const cameraLiveControls = document.getElementById("cameraLiveControls");
  const cameraPreviewControls = document.getElementById("cameraPreviewControls");
  const cancelCameraBtn = document.getElementById("cancelCameraBtn");
  const shutterBtn = document.getElementById("shutterBtn");
  const switchCameraBtn = document.getElementById("switchCameraBtn");
  const discardSnapshotBtn = document.getElementById("discardSnapshotBtn");
  const sendSnapshotBtn = document.getElementById("sendSnapshotBtn");

  // Image Lightbox Elements
  const imageLightboxModal = document.getElementById("imageLightboxModal");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxCloseBtn = document.getElementById("lightboxCloseBtn");

  // Modals
  const joinRoomModal = document.getElementById("joinRoomModal");
  const joinRoomForm = document.getElementById("joinRoomForm");
  const joinNameInput = document.getElementById("joinNameInput");

  const startTimerModal = document.getElementById("startTimerModal");
  const startTimerForm = document.getElementById("startTimerForm");
  const taskNameInput = document.getElementById("taskNameInput");
  const cancelStartTimerBtn = document.getElementById("cancelStartTimerBtn");

  const startPomodoroModal = document.getElementById("startPomodoroModal");
  const startPomodoroForm = document.getElementById("startPomodoroForm");
  const pomodoroTaskNameInput = document.getElementById("pomodoroTaskNameInput");
  const cancelStartPomodoroBtn = document.getElementById("cancelStartPomodoroBtn");
  const pomodoroPresetButtons = document.querySelectorAll(".pomodoro-preset-card");

  const deleteAllModal = document.getElementById("deleteAllModal");
  const cancelDeleteAllBtn = document.getElementById("cancelDeleteAllBtn");
  const confirmDeleteAllBtn = document.getElementById("confirmDeleteAllBtn");

  const roomFullModal = document.getElementById("roomFullModal");
  const roomFullDescription = document.getElementById("roomFullDescription");

  // Firebase Setup Modal & Banner
  const firebaseBanner = document.getElementById("firebaseBanner");
  const firebaseSetupModal = document.getElementById("firebaseSetupModal");
  const openSetupBtn = document.getElementById("openSetupBtn");
  const closeSetupModalBtn = document.getElementById("closeSetupModalBtn");
  const saveFirebaseConfigBtn = document.getElementById("saveFirebaseConfigBtn");
  const firebaseJsonInput = document.getElementById("firebaseJsonInput");

  // 2. User Identity State
  let userId = localStorage.getItem("dayroom_user_id");
  if (!userId) {
    userId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "user_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    localStorage.setItem("dayroom_user_id", userId);
  }

  let userName = localStorage.getItem("dayroom_user_name") || "";
  let mySlot = null; // "userA" | "userB"
  let currentRoomData = null;
  let activeTimerData = null;
  let hasJoined = false;
  let isAutoProgressing = false;

  // Live Camera State
  let activeMediaStream = null;
  let capturedSnapshotDataUrl = null;
  let currentFacingMode = "user"; // "user" (selfie)

  // Selected Pomodoro configuration preset
  let selectedPomodoroConfig = {
    workMinutes: 25,
    breakMinutes: 5,
    totalCycles: 4
  };

  // Message Tracking & Notification State
  const knownMessageIds = new Set();
  let isInitialMessagesLoaded = false;

  // Audio Context & Web Notifications
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }

  // Play a soft, calming bell chime with Web Audio API
  function playPhaseEndSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: B5 (987.77 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, now + 0.18);
      gain2.gain.setValueAtTime(0.25, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.9);
    } catch (err) {
      console.warn("Could not play notification sound:", err);
    }
  }

  function notifyPhaseEnd(title, body) {
    playPhaseEndSound();
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body });
      } catch (e) {}
    }
  }

  // Notify when companion sends a chat message
  function notifyMessage(senderName) {
    const notifText = `${senderName} sent you a message on ourspace!`;
    playPhaseEndSound();
    
    // In-app toast notification
    showToast(notifText);

    // Browser Web Notification
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const notif = new Notification(notifText, {
          body: notifText,
          icon: "favicon.ico"
        });
        notif.onclick = function () {
          window.focus();
          this.close();
        };
      } catch (e) {
        try {
          const notif = new Notification(notifText);
          notif.onclick = function () {
            window.focus();
            this.close();
          };
        } catch (err) {}
      }
    }
  }

  // Check Firebase Configuration
  if (!DayRoomDB.isReady()) {
    if (firebaseBanner) firebaseBanner.style.display = "flex";
  }

  // Setup modal handlers
  if (openSetupBtn && firebaseSetupModal) {
    openSetupBtn.addEventListener("click", () => firebaseSetupModal.classList.add("active"));
  }
  if (closeSetupModalBtn && firebaseSetupModal) {
    closeSetupModalBtn.addEventListener("click", () => firebaseSetupModal.classList.remove("active"));
  }
  if (saveFirebaseConfigBtn && firebaseJsonInput) {
    saveFirebaseConfigBtn.addEventListener("click", () => {
      try {
        const raw = firebaseJsonInput.value.trim();
        let parsed = null;
        if (raw.startsWith("{") && raw.endsWith("}")) parsed = JSON.parse(raw);
        if (parsed && parsed.apiKey && parsed.databaseURL) {
          window.DayRoomFirebase.saveCustomConfig(parsed);
        } else {
          showToast("Please provide a valid config object.");
        }
      } catch (e) {
        showToast("Invalid JSON syntax.");
      }
    });
  }

  // 3. Share Room Link Handler
  shareRoomBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Room link copied to clipboard");
    } catch (err) {
      showToast("Copied room link: " + window.location.href);
    }
  });

  // 4. Time & Duration Format Helpers
  function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function formatStopwatch(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  function formatDurationShort(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  function formatCountdown(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  // 5. Live Selfie Camera Functions
  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Camera not supported on this browser.");
      return;
    }

    // Reset UI to live viewfinder state
    capturedSnapshotDataUrl = null;
    cameraViewfinderState.style.display = "flex";
    cameraPreviewState.style.display = "none";
    cameraLiveControls.style.display = "flex";
    cameraPreviewControls.style.display = "none";
    cameraLoadingOverlay.style.display = "flex";
    cameraLoadingOverlay.innerHTML = "<span>Starting camera...</span>";
    cameraModalTitle.textContent = "Live Camera";
    cameraModalSubtitle.textContent = "Take a quick picture for the room";

    cameraModal.classList.add("active");

    try {
      if (activeMediaStream) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });

      activeMediaStream = stream;
      cameraVideo.srcObject = stream;
      await cameraVideo.play();
      cameraLoadingOverlay.style.display = "none";
    } catch (err) {
      console.error("Camera access error:", err);
      cameraLoadingOverlay.innerHTML = "<span>Camera access denied or unavailable.</span>";
      showToast("Could not access camera. Please allow permissions.");
    }
  }

  function stopCamera() {
    if (activeMediaStream) {
      activeMediaStream.getTracks().forEach((track) => track.stop());
      activeMediaStream = null;
    }
    if (cameraVideo) {
      cameraVideo.srcObject = null;
    }
  }

  function takeSnapshot() {
    if (!cameraVideo || !cameraVideo.videoWidth) {
      showToast("Camera is not ready yet.");
      return;
    }

    const videoWidth = cameraVideo.videoWidth;
    const videoHeight = cameraVideo.videoHeight;

    // Scale to max 640px for super fast, lightweight ~20KB Firebase payload
    let targetWidth = videoWidth;
    let targetHeight = videoHeight;
    const maxDim = 640;

    if (targetWidth > maxDim || targetHeight > maxDim) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
        targetWidth = maxDim;
      } else {
        targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
        targetHeight = maxDim;
      }
    }

    cameraCanvas.width = targetWidth;
    cameraCanvas.height = targetHeight;
    const ctx = cameraCanvas.getContext("2d");

    // Mirror image for natural selfie result
    if (currentFacingMode === "user") {
      ctx.translate(targetWidth, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(cameraVideo, 0, 0, targetWidth, targetHeight);

    let dataUrl = cameraCanvas.toDataURL("image/jpeg", 0.70);

    capturedSnapshotDataUrl = dataUrl;
    capturedPhotoImg.src = dataUrl;

    // Stop live camera hardware
    stopCamera();

    // Prepopulate caption if user typed note in input
    if (cameraCaptionInput) {
      cameraCaptionInput.value = messageInput ? messageInput.value.trim() : "";
    }

    // Switch to preview state
    cameraViewfinderState.style.display = "none";
    cameraPreviewState.style.display = "flex";
    cameraLiveControls.style.display = "none";
    cameraPreviewControls.style.display = "flex";
    cameraModalTitle.textContent = "Photo Taken";
    cameraModalSubtitle.textContent = "Send or discard your picture";

    setTimeout(() => {
      if (cameraCaptionInput) cameraCaptionInput.focus();
    }, 100);
  }

  function discardSnapshot() {
    capturedSnapshotDataUrl = null;
    stopCamera();
    cameraModal.classList.remove("active");
    showToast("Picture discarded.");
  }

  async function sendSnapshot() {
    if (!capturedSnapshotDataUrl || !hasJoined || !mySlot) return;

    const caption = cameraCaptionInput ? cameraCaptionInput.value.trim() : "";
    const photoToSend = capturedSnapshotDataUrl;

    capturedSnapshotDataUrl = null;
    stopCamera();
    cameraModal.classList.remove("active");
    if (messageInput) messageInput.value = "";
    if (cameraCaptionInput) cameraCaptionInput.value = "";

    try {
      await DayRoomDB.sendMessage(roomId, mySlot, userName, userId, caption, photoToSend);
      showToast("Photo sent to room!");
    } catch (err) {
      console.error("Failed to send photo:", err);
      showToast("Failed to send picture. Check connection.");
    }
  }

  // Camera event listeners
  if (openCameraBtn) {
    openCameraBtn.addEventListener("click", () => {
      if (!hasJoined || !mySlot) {
        showToast("Please enter your name first.");
        return;
      }
      startCamera();
    });
  }

  if (shutterBtn) {
    shutterBtn.addEventListener("click", () => takeSnapshot());
  }

  if (cancelCameraBtn) {
    cancelCameraBtn.addEventListener("click", () => {
      stopCamera();
      cameraModal.classList.remove("active");
    });
  }

  if (discardSnapshotBtn) {
    discardSnapshotBtn.addEventListener("click", () => discardSnapshot());
  }

  if (sendSnapshotBtn) {
    sendSnapshotBtn.addEventListener("click", () => sendSnapshot());
  }

  // Lightbox close handlers
  if (lightboxCloseBtn && imageLightboxModal) {
    lightboxCloseBtn.addEventListener("click", () => {
      imageLightboxModal.classList.remove("active");
    });
    imageLightboxModal.addEventListener("click", (e) => {
      if (e.target === imageLightboxModal) {
        imageLightboxModal.classList.remove("active");
      }
    });
  }

  // 6. Global 1-Second Interval Ticker
  setInterval(() => {
    const now = Date.now();

    // Update My Controls timer if running
    if (activeTimerData && activeTimerData.startedAt) {
      const isPomodoro = activeTimerData.timerSubtype === "pomodoro" || activeTimerData.type === "pomodoro";

      if (isPomodoro) {
        const isBreak = activeTimerData.currentPhase === "break";
        const durationMins = isBreak ? (activeTimerData.breakMinutes || 5) : (activeTimerData.workMinutes || 25);
        const phaseDurationMs = durationMins * 60 * 1000;
        const phaseStarted = activeTimerData.phaseStartedAt || activeTimerData.startedAt;
        const elapsedInPhase = now - phaseStarted;
        const remainingMs = Math.max(0, phaseDurationMs - elapsedInPhase);

        if (activePomodoroClock) {
          activePomodoroClock.textContent = formatCountdown(remainingMs);
        }

        // Auto-advance when countdown reaches 0
        if (remainingMs <= 0 && !isAutoProgressing && hasJoined && mySlot) {
          isAutoProgressing = true;
          advancePomodoroPhase().finally(() => {
            setTimeout(() => { isAutoProgressing = false; }, 3000);
          });
        }
      } else {
        // Standard Stopwatch
        const elapsed = now - activeTimerData.startedAt;
        if (activeTimerClock) {
          activeTimerClock.textContent = formatStopwatch(elapsed);
        }
      }
    }

    // Update standard stopwatch badges in timelines
    const activeTimelineBadges = document.querySelectorAll(".timer-live-ticker");
    activeTimelineBadges.forEach((el) => {
      const startedAt = parseInt(el.getAttribute("data-started-at"), 10);
      if (startedAt) {
        const elapsed = now - startedAt;
        el.textContent = formatDurationShort(elapsed);
      }
    });

    // Update pomodoro countdown badges in timelines
    const activePomodoroBadges = document.querySelectorAll(".pomodoro-live-ticker");
    activePomodoroBadges.forEach((el) => {
      const phaseStartedAt = parseInt(el.getAttribute("data-phase-started-at"), 10);
      const durationMins = parseInt(el.getAttribute("data-duration-mins"), 10) || 25;
      if (phaseStartedAt) {
        const phaseDurationMs = durationMins * 60 * 1000;
        const elapsedInPhase = now - phaseStartedAt;
        const remainingMs = Math.max(0, phaseDurationMs - elapsedInPhase);
        el.textContent = formatCountdown(remainingMs) + " left";
      }
    });
  }, 1000);

  // 7. Realtime Firebase Subscription
  function initRoomSubscription() {
    if (!DayRoomDB.isReady()) {
      roomStatusText.textContent = "Firebase unconfigured";
      liveStatusDot.style.backgroundColor = "var(--accent-amber)";
      return;
    }

    // Connection listener
    const db = window.DayRoomFirebase.getDb();
    if (db) {
      db.ref(".info/connected").on("value", (snap) => {
        if (snap.val() === true) {
          liveStatusDot.style.backgroundColor = "var(--accent-matcha)";
        } else {
          liveStatusDot.style.backgroundColor = "var(--text-faint)";
        }
      });
    }

    // Room Subscription
    DayRoomDB.subscribeRoom(
      roomId,
      async (data, exists) => {
        if (!exists) {
          // Room does not exist yet; create it
          DayRoomDB.createRoom(roomId).then(() => {
            console.log("Room initialized:", roomId);
          }).catch(err => {
            console.error("Error creating room:", err);
            showToast("Failed to initialize room in Firebase.");
          });
          return;
        }

        // Check if room has been inactive for more than 30 hours
        if (DayRoomDB.isRoomExpired(data)) {
          console.log("Room is expired due to 30+ hours of inactivity. Auto-cleaning room data.");
          try {
            await DayRoomDB.resetExpiredRoom(roomId);
            showToast("This room was inactive for over 30 hours and has been refreshed.");
          } catch (err) {
            console.error("Failed to reset expired room:", err);
          }
          return;
        }

        currentRoomData = data;
        handleRoomDataUpdate(data);
      },
      (error) => {
        console.error("Room Subscription Error:", error);
        showToast("Connection issue with Firebase.");
      }
    );

    // Heartbeat to keep active sessions alive
    setInterval(() => {
      if (hasJoined && roomId && DayRoomDB.isReady()) {
        DayRoomDB.touchActivity(roomId);
      }
    }, 15 * 60 * 1000);
  }

  // 8. Handle Room Data & Slot Assignment
  function handleRoomDataUpdate(data) {
    const users = data.users || {};
    const userA = users.userA || {};
    const userB = users.userB || {};

    // Check if current user is already assigned a slot
    if (userA.id === userId) {
      mySlot = "userA";
      userName = userA.name || userName;
      hasJoined = true;
      joinRoomModal.classList.remove("active");
    } else if (userB.id === userId) {
      mySlot = "userB";
      userName = userB.name || userName;
      hasJoined = true;
      joinRoomModal.classList.remove("active");
    } else {
      // User has not joined this room yet
      if (!userA.id) {
        promptJoinModal("userA");
        return;
      } else if (!userB.id) {
        promptJoinModal("userB");
        return;
      } else {
        showRoomFull(userA.name, userB.name);
        return;
      }
    }

    // Update Room Header Status
    updateRoomStatus(userA, userB);

    // Render Room Toolbox State
    renderToolboxState(data.tools || {});

    // Render Columns
    renderPersonColumn("userA", userA, personAName, personABadge, personATimelineList, personAEmptyState, personAFooter);
    renderPersonColumn("userB", userB, personBName, personBBadge, personBTimelineList, personBEmptyState, personBFooter);

    // Render My Controls Timer State
    renderMyTimerControls(users[mySlot]);

    // Render Shared Messages
    renderMessages(data.messages || {});
  }

  // 9. Join Modal Prompts
  let pendingSlotToClaim = null;
  function promptJoinModal(slot) {
    pendingSlotToClaim = slot;
    if (userName && joinNameInput) {
      joinNameInput.value = userName;
    }
    joinRoomModal.classList.add("active");
    setTimeout(() => {
      if (joinNameInput) joinNameInput.focus();
    }, 150);
  }

  function showRoomFull(nameA, nameB) {
    if (roomFullDescription) {
      roomFullDescription.textContent = `This room is currently occupied by ${nameA || "Person A"} and ${nameB || "Person B"}. Day Room is a private room for two people.`;
    }
    roomFullModal.classList.add("active");
  }

  joinRoomForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const enteredName = joinNameInput.value.trim();
    if (!enteredName) return;

    getAudioContext();
    requestNotificationPermission();

    userName = enteredName;
    localStorage.setItem("dayroom_user_name", userName);

    try {
      const slotToClaim = pendingSlotToClaim || "userA";
      await DayRoomDB.claimSlot(roomId, slotToClaim, userId, userName);
      mySlot = slotToClaim;
      hasJoined = true;
      joinRoomModal.classList.remove("active");
      showToast(`Welcome to Day Room, ${userName}`);
    } catch (err) {
      console.error("Error claiming slot:", err);
      showToast("Could not join room. Please check connection.");
    }
  });

  // 10. Update Navbar Status
  function updateRoomStatus(userA, userB) {
    const nameA = userA.name || "Person A";
    const nameB = userB.name || (userA.id ? "Waiting for companion..." : "Person B");

    if (userA.name && userB.name) {
      roomStatusText.textContent = `${userA.name} & ${userB.name} · Day Room`;
    } else if (userA.name) {
      roomStatusText.textContent = `${userA.name}'s Room · Waiting for companion`;
    } else {
      roomStatusText.textContent = "Day Room · Realtime";
    }
  }

  // 11. Render Person Column (A or B)
  function renderPersonColumn(slotKey, userData, nameEl, badgeEl, listEl, emptyEl, footerEl) {
    const isMe = (mySlot === slotKey);
    const hasPerson = Boolean(userData && userData.name);

    // Update Header Name & Badge
    nameEl.textContent = hasPerson ? userData.name : (slotKey === "userA" ? "Person A" : "Person B");
    
    if (isMe) {
      badgeEl.textContent = "You";
      badgeEl.className = "column-badge badge-you";
      footerEl.style.display = "flex";
    } else if (hasPerson) {
      badgeEl.textContent = "Companion";
      badgeEl.className = "column-badge badge-companion";
      footerEl.style.display = "none";
    } else {
      badgeEl.textContent = "Waiting...";
      badgeEl.className = "column-badge badge-waiting";
      footerEl.style.display = "none";
    }

    // Process Logs
    const rawLogs = (userData && userData.logs)
      ? Object.entries(userData.logs).map(([key, val]) => {
          if (val && typeof val === "object") {
            return { ...val, id: val.id || key };
          }
          return { id: key, text: String(val || ""), type: "custom" };
        })
      : [];

    // Render Water Tracker for this person (only visible if enabled in room tools)
    const isWaterTrackerActive = Boolean(currentRoomData && currentRoomData.tools && currentRoomData.tools.waterTracker);
    const waterTrackerEl = (slotKey === "userA") ? personAWaterTracker : personBWaterTracker;
    const waterCountEl = (slotKey === "userA") ? personAWaterCount : personBWaterCount;
    const waterMeterEl = (slotKey === "userA") ? personAWaterMeter : personBWaterMeter;

    if (waterTrackerEl) {
      waterTrackerEl.style.display = isWaterTrackerActive ? "block" : "none";
    }

    const waterLogsCount = rawLogs.filter(l => l.text && l.text.toLowerCase().includes("water")).length;
    const clampedWater = Math.min(9, waterLogsCount);

    if (waterCountEl) {
      if (clampedWater >= 9) {
        waterCountEl.textContent = "9/9 glasses completed";
      } else {
        waterCountEl.textContent = `${clampedWater}/9 glasses`;
      }
    }

    if (waterTrackerEl) {
      waterTrackerEl.classList.toggle("completed", clampedWater >= 9);
    }

    if (waterMeterEl) {
      const segments = waterMeterEl.querySelectorAll(".water-segment");
      segments.forEach((seg, idx) => {
        seg.classList.toggle("filled", (idx + 1) <= clampedWater);
      });
    }

    // Render Todo List for this person
    const todoFormEl = (slotKey === "userA") ? personATodoForm : personBTodoForm;
    const todoCountEl = (slotKey === "userA") ? personATodoCount : personBTodoCount;
    const todoListEl = (slotKey === "userA") ? personATodoList : personBTodoList;
    const todoEmptyEl = (slotKey === "userA") ? personATodoEmpty : personBTodoEmpty;

    if (todoFormEl) {
      todoFormEl.style.display = isMe ? "flex" : "none";
    }

    const rawTodos = (userData && userData.todos)
      ? Object.entries(userData.todos).map(([key, val]) => {
          if (val && typeof val === "object") {
            return { ...val, id: val.id || key };
          }
          return { id: key, text: String(val || ""), completed: false };
        })
      : [];
    const totalTodos = rawTodos.length;
    const completedTodos = rawTodos.filter(t => t.completed).length;

    if (todoCountEl) {
      todoCountEl.textContent = `${completedTodos}/${totalTodos}`;
    }

    if (rawTodos.length === 0) {
      if (todoListEl) todoListEl.innerHTML = "";
      if (todoEmptyEl) todoEmptyEl.style.display = "block";
    } else {
      if (todoEmptyEl) todoEmptyEl.style.display = "none";
      if (todoListEl) {
        // Sort: incomplete items first (newest to oldest), completed items at the end (newest to oldest)
        rawTodos.sort((a, b) => {
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          const timeA = a.createdAt || 0;
          const timeB = b.createdAt || 0;
          return timeB - timeA;
        });

        todoListEl.innerHTML = "";

        rawTodos.forEach((todo) => {
          const itemEl = document.createElement("div");
          itemEl.className = "todo-item" + (todo.completed ? " completed" : "");

          const checkBtn = document.createElement("button");
          checkBtn.type = "button";
          checkBtn.className = "todo-checkbox-btn" + (todo.completed ? " checked" : "");
          checkBtn.title = isMe ? (todo.completed ? "Mark uncompleted" : "Mark completed") : (todo.completed ? "Completed" : "Incomplete");
          checkBtn.innerHTML = `
            <svg class="todo-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          `;

          if (isMe) {
            checkBtn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!todo.id) return;
              DayRoomDB.toggleTodo(roomId, slotKey, todo.id, !todo.completed).catch((err) => {
                console.error("Toggle todo error:", err);
                showToast("Failed to update task.");
              });
            });
          } else {
            checkBtn.disabled = true;
          }

          const textEl = document.createElement("span");
          textEl.className = "todo-text" + (todo.completed ? " completed" : "");
          textEl.textContent = todo.text;

          itemEl.appendChild(checkBtn);
          itemEl.appendChild(textEl);

          if (isMe) {
            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "todo-delete-btn";
            deleteBtn.innerHTML = "&times;";
            deleteBtn.title = "Delete task";
            deleteBtn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!todo.id) {
                console.error("Missing todo id for deletion");
                return;
              }
              DayRoomDB.deleteTodo(roomId, slotKey, todo.id).then(() => {
                showToast("Task deleted.");
              }).catch((err) => {
                console.error("Delete todo error:", err);
                showToast("Failed to delete task.");
              });
            });
            itemEl.appendChild(deleteBtn);
          }

          todoListEl.appendChild(itemEl);
        });
      }
    }
    
    if (rawLogs.length === 0) {
      listEl.innerHTML = "";
      emptyEl.style.display = "flex";
      return;
    }

    emptyEl.style.display = "none";

    // Sort logs: Newest first (descending by timestamp / startedAt)
    rawLogs.sort((a, b) => {
      const timeA = a.timestamp || a.startedAt || 0;
      const timeB = b.timestamp || b.startedAt || 0;
      return timeB - timeA;
    });

    listEl.innerHTML = "";

    rawLogs.forEach((log) => {
      const itemEl = document.createElement("div");
      itemEl.className = "timeline-item";

      const nodeEl = document.createElement("div");
      nodeEl.className = "timeline-node";

      const cardEl = document.createElement("div");
      cardEl.className = "timeline-card";

      // Card Header: Time & Delete Button (Only current user can delete their own logs)
      const headerEl = document.createElement("div");
      headerEl.className = "timeline-card-header";

      const timeEl = document.createElement("span");
      timeEl.className = "timeline-time";
      const logTime = log.timestamp || log.startedAt;
      timeEl.textContent = formatTime(logTime);
      headerEl.appendChild(timeEl);

      if (isMe) {
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "timeline-delete-btn";
        deleteBtn.innerHTML = "&times;";
        deleteBtn.title = "Delete this log";
        deleteBtn.type = "button";
        deleteBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!log.id) return;
          DayRoomDB.deleteLog(roomId, slotKey, log.id).catch((err) => {
            console.error("Delete log error:", err);
            showToast("Failed to delete log.");
          });
        });
        headerEl.appendChild(deleteBtn);
      }

      cardEl.appendChild(headerEl);

      // Card Content based on type
      if (log.type === "timer") {
        const isPomodoro = log.timerSubtype === "pomodoro";

        if (isPomodoro) {
          nodeEl.classList.add("node-pomodoro");
        } else {
          nodeEl.classList.add("node-timer");
        }
        cardEl.classList.add("timer-card");

        const isCurrentlyActive = log.isActive === true;

        if (isCurrentlyActive) {
          nodeEl.classList.add("node-active");
          cardEl.classList.add("active-timer");

          if (isPomodoro) {
            const isBreak = log.currentPhase === "break";
            const durationMins = isBreak ? (log.breakMinutes || 5) : (log.workMinutes || 25);
            const phaseDurationMs = durationMins * 60 * 1000;
            const phaseStarted = log.phaseStartedAt || log.startedAt;
            const elapsedInPhase = Date.now() - phaseStarted;
            const remainingMs = Math.max(0, phaseDurationMs - elapsedInPhase);

            cardEl.insertAdjacentHTML("beforeend", `
              <div class="pomodoro-badge ${isBreak ? 'badge-break' : ''}">
                ${isBreak ? 'Break' : 'Focus'} · Cycle ${log.currentCycle || 1} of ${log.totalCycles || 4}
              </div>
              <div class="timer-task-title">
                <span><strong>"${escapeHtml(log.task || "Pomodoro Session")}"</strong></span>
              </div>
              <div class="timer-active-badge">
                <span>${isBreak ? 'Resting' : 'Focusing'} · </span>
                <span class="ticker pomodoro-live-ticker" 
                      data-phase-started-at="${phaseStarted}" 
                      data-duration-mins="${durationMins}">
                  ${formatCountdown(remainingMs)} left
                </span>
              </div>
            `);
          } else {
            const elapsedNow = Date.now() - log.startedAt;
            cardEl.insertAdjacentHTML("beforeend", `
              <div class="timer-task-title">
                <span>Started timer for <strong>"${escapeHtml(log.task || "Task")}"</strong></span>
              </div>
              <div class="timer-active-badge">
                <span>Currently active · </span>
                <span class="ticker timer-live-ticker" data-started-at="${log.startedAt}">${formatDurationShort(elapsedNow)}</span>
              </div>
            `);
          }
        } else {
          // Finished Timer / Pomodoro
          const startTimeStr = formatTime(log.startedAt);
          const finishTimeStr = formatTime(log.finishedAt || log.timestamp);
          const durationStr = log.durationFormatted || formatDurationShort(log.duration || 0);

          if (isPomodoro) {
            cardEl.insertAdjacentHTML("beforeend", `
              <div class="pomodoro-badge">
                Pomodoro · ${log.completedCycles || log.totalCycles || 1}/${log.totalCycles || 4} cycles
              </div>
              <div class="timer-task-title">
                <span><strong>${escapeHtml(log.task || "Pomodoro Session")}</strong></span>
              </div>
              <div class="timer-details">
                <span>Started at ${startTimeStr}</span>
                <span>Duration: ${durationStr}</span>
                ${log.finishedAt ? `<span>Finished at ${finishTimeStr}</span>` : ""}
              </div>
            `);
          } else {
            cardEl.insertAdjacentHTML("beforeend", `
              <div class="timer-task-title">
                <span><strong>${escapeHtml(log.task || "Task")}</strong></span>
              </div>
              <div class="timer-details">
                <span>Started at ${startTimeStr}</span>
                <span>Duration: ${durationStr}</span>
                ${log.finishedAt ? `<span>Finished at ${finishTimeStr}</span>` : ""}
              </div>
            `);
          }
        }
      } else {
        // Standard / Quick / Custom Log
        const contentEl = document.createElement("div");
        contentEl.className = "timeline-content";
        contentEl.textContent = log.text || "";
        cardEl.appendChild(contentEl);
      }

      itemEl.appendChild(nodeEl);
      itemEl.appendChild(cardEl);
      listEl.appendChild(itemEl);
    });
  }

  // 12. Render My Controls Timer & Pomodoro State
  function renderMyTimerControls(myUserData) {
    if (!myUserData) return;

    activeTimerData = myUserData.activeTimer || null;

    if (activeTimerData && activeTimerData.startedAt) {
      timerControlSection.classList.add("running");
      timerIdleState.style.display = "none";

      const isPomodoro = activeTimerData.timerSubtype === "pomodoro" || activeTimerData.type === "pomodoro";

      if (isPomodoro) {
        timerRunningState.style.display = "none";
        pomodoroRunningState.style.display = "flex";

        const isBreak = activeTimerData.currentPhase === "break";
        const cycle = activeTimerData.currentCycle || 1;
        const total = activeTimerData.totalCycles || 4;

        pomodoroPhaseBadge.textContent = isBreak
          ? `Break Phase · Cycle ${cycle} of ${total}`
          : `Focus Phase · Cycle ${cycle} of ${total}`;

        if (isBreak) {
          pomodoroPhaseBadge.classList.add("phase-break");
        } else {
          pomodoroPhaseBadge.classList.remove("phase-break");
        }

        activePomodoroTaskTitle.textContent = activeTimerData.task || "Pomodoro Session";

        const durationMins = isBreak ? (activeTimerData.breakMinutes || 5) : (activeTimerData.workMinutes || 25);
        const phaseDurationMs = durationMins * 60 * 1000;
        const phaseStarted = activeTimerData.phaseStartedAt || activeTimerData.startedAt;
        const elapsedInPhase = Date.now() - phaseStarted;
        const remainingMs = Math.max(0, phaseDurationMs - elapsedInPhase);

        activePomodoroClock.textContent = formatCountdown(remainingMs);
      } else {
        // Standard Stopwatch
        pomodoroRunningState.style.display = "none";
        timerRunningState.style.display = "flex";

        activeTaskTitle.textContent = activeTimerData.task || "Task";
        const elapsed = Date.now() - activeTimerData.startedAt;
        activeTimerClock.textContent = formatStopwatch(elapsed);
      }
    } else {
      // Idle State
      timerControlSection.classList.remove("running");
      timerIdleState.style.display = "block";
      timerRunningState.style.display = "none";
      pomodoroRunningState.style.display = "none";
    }
  }

  // 13. Standard Stopwatch Handlers
  startTimerOpenBtn.addEventListener("click", () => {
    getAudioContext();
    requestNotificationPermission();
    if (!hasJoined || !mySlot) {
      showToast("Please enter your name first.");
      return;
    }
    taskNameInput.value = "";
    startTimerModal.classList.add("active");
    setTimeout(() => taskNameInput.focus(), 150);
  });

  cancelStartTimerBtn.addEventListener("click", () => {
    startTimerModal.classList.remove("active");
  });

  startTimerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const taskName = taskNameInput.value.trim();
    if (!taskName) return;

    try {
      startTimerModal.classList.remove("active");
      await DayRoomDB.startTimer(roomId, mySlot, taskName);
      showToast(`Started timer for "${taskName}"`);
    } catch (err) {
      console.error("Start timer error:", err);
      showToast("Failed to start timer. Check connection.");
    }
  });

  finishTimerBtn.addEventListener("click", async () => {
    if (!activeTimerData || !mySlot) return;

    const startedAt = activeTimerData.startedAt;
    const logId = activeTimerData.logId;
    const duration = Date.now() - startedAt;
    const durationFormatted = formatDurationShort(duration);

    try {
      await DayRoomDB.finishTimer(roomId, mySlot, logId, startedAt, durationFormatted);
      showToast(`Completed timer. Total: ${durationFormatted}`);
    } catch (err) {
      console.error("Finish timer error:", err);
      showToast("Failed to finish timer.");
    }
  });

  // 14. Pomodoro Modal & Session Handlers
  if (startPomodoroOpenBtn) {
    startPomodoroOpenBtn.addEventListener("click", () => {
      getAudioContext();
      requestNotificationPermission();
      if (!hasJoined || !mySlot) {
        showToast("Please enter your name first.");
        return;
      }
      if (pomodoroTaskNameInput) pomodoroTaskNameInput.value = "";
      if (startPomodoroModal) startPomodoroModal.classList.add("active");
      setTimeout(() => {
        if (pomodoroTaskNameInput) pomodoroTaskNameInput.focus();
      }, 150);
    });
  }

  if (cancelStartPomodoroBtn && startPomodoroModal) {
    cancelStartPomodoroBtn.addEventListener("click", () => {
      startPomodoroModal.classList.remove("active");
    });
  }

  // Preset Selection Handlers
  pomodoroPresetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      getAudioContext();
      pomodoroPresetButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedPomodoroConfig = {
        workMinutes: parseInt(btn.getAttribute("data-work"), 10) || 25,
        breakMinutes: parseInt(btn.getAttribute("data-break"), 10) || 5,
        totalCycles: parseInt(btn.getAttribute("data-cycles"), 10) || 4
      };
    });
  });

  if (startPomodoroForm) {
    startPomodoroForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const taskName = pomodoroTaskNameInput ? pomodoroTaskNameInput.value.trim() : "";
      if (!taskName) return;

      getAudioContext();
      requestNotificationPermission();

      try {
        if (startPomodoroModal) startPomodoroModal.classList.remove("active");
        await DayRoomDB.startPomodoro(
          roomId,
          mySlot,
          taskName,
          selectedPomodoroConfig.workMinutes,
          selectedPomodoroConfig.breakMinutes,
          selectedPomodoroConfig.totalCycles
        );
        showToast(`Started Pomodoro: "${taskName}" (${selectedPomodoroConfig.workMinutes}m/${selectedPomodoroConfig.breakMinutes}m × ${selectedPomodoroConfig.totalCycles})`);
      } catch (err) {
        console.error("Start Pomodoro error:", err);
        showToast("Failed to start Pomodoro. Check connection.");
      }
    });
  }

  // Advance Phase helper with Sound and Notification
  async function advancePomodoroPhase() {
    if (!activeTimerData || !mySlot) return;

    const currentPhase = activeTimerData.currentPhase || "work";
    const currentCycle = activeTimerData.currentCycle || 1;
    const totalCycles = activeTimerData.totalCycles || 4;
    const logId = activeTimerData.logId;

    if (currentPhase === "work") {
      try {
        notifyPhaseEnd(
          "Focus Phase Finished",
          `Great focus! Starting ${activeTimerData.breakMinutes || 5}m break (Cycle ${currentCycle}/${totalCycles}).`
        );
        await DayRoomDB.updatePomodoroPhase(roomId, mySlot, logId, currentCycle, "break");
        showToast(`Focus finished! Starting ${activeTimerData.breakMinutes || 5}m break (Cycle ${currentCycle}/${totalCycles})`);
      } catch (err) {
        console.error("Update pomodoro phase error:", err);
      }
    } else {
      if (currentCycle < totalCycles) {
        try {
          notifyPhaseEnd(
            "Break Time Over",
            `Ready for Focus cycle ${currentCycle + 1} of ${totalCycles}?`
          );
          await DayRoomDB.updatePomodoroPhase(roomId, mySlot, logId, currentCycle + 1, "work");
          showToast(`Break over! Starting Focus cycle ${currentCycle + 1} of ${totalCycles}`);
        } catch (err) {
          console.error("Update pomodoro cycle error:", err);
        }
      } else {
        notifyPhaseEnd(
          "Pomodoro Session Complete",
          `Congratulations! You finished all ${totalCycles} cycles.`
        );
        await handleFinishPomodoro();
      }
    }
  }

  // Finish Pomodoro helper
  async function handleFinishPomodoro() {
    if (!activeTimerData || !mySlot) return;
    const startedAt = activeTimerData.startedAt;
    const logId = activeTimerData.logId;
    const completedCycles = activeTimerData.currentCycle || 1;
    const totalCycles = activeTimerData.totalCycles || 4;
    const duration = Date.now() - startedAt;
    const durationFormatted = formatDurationShort(duration);

    try {
      await DayRoomDB.finishPomodoro(roomId, mySlot, logId, startedAt, completedCycles, totalCycles, durationFormatted);
      showToast(`Finished Pomodoro session! (${completedCycles}/${totalCycles} cycles · ${durationFormatted})`);
    } catch (err) {
      console.error("Finish pomodoro error:", err);
      showToast("Failed to finish Pomodoro.");
    }
  }

  if (nextPomodoroPhaseBtn) {
    nextPomodoroPhaseBtn.addEventListener("click", () => {
      getAudioContext();
      advancePomodoroPhase();
    });
  }

  if (finishPomodoroBtn) {
    finishPomodoroBtn.addEventListener("click", () => {
      getAudioContext();
      handleFinishPomodoro();
    });
  }

  // Water Tracker Click Handlers
  function setupWaterTrackerClick(trackerEl, slot) {
    if (!trackerEl) return;
    trackerEl.style.cursor = "pointer";
    trackerEl.title = "Click to log water";
    trackerEl.addEventListener("click", async () => {
      if (!hasJoined || !mySlot) {
        showToast("Please enter your name first.");
        return;
      }
      try {
        await DayRoomDB.addLog(roomId, mySlot, { text: "Water consumed", type: "quick" });
        showToast("Logged: Water consumed");
      } catch (e) {
        showToast("Failed to log water.");
      }
    });
  }

  setupWaterTrackerClick(personAWaterTracker, "userA");
  setupWaterTrackerClick(personBWaterTracker, "userB");

  // Todo Form Submit Handlers
  function setupTodoFormHandler(formEl, inputEl, slotKey) {
    if (!formEl || !inputEl) return;
    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = inputEl.value.trim();
      if (!text) return;

      if (!hasJoined || mySlot !== slotKey) {
        showToast("Please enter your name first.");
        return;
      }

      try {
        inputEl.value = "";
        await DayRoomDB.addTodo(roomId, slotKey, text);
        showToast(`Added task: "${text}"`);
      } catch (err) {
        console.error("Add todo error:", err);
        showToast("Failed to add task.");
      }
    });
  }

  setupTodoFormHandler(personATodoForm, personATodoInput, "userA");
  setupTodoFormHandler(personBTodoForm, personBTodoInput, "userB");

  // 15. Custom Log Submission
  customLogForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = customLogInput.value.trim();
    if (!text) return;

    if (!hasJoined || !mySlot) {
      showToast("Please enter your name first.");
      return;
    }

    try {
      customLogInput.value = "";
      await DayRoomDB.addLog(roomId, mySlot, { text, type: "custom" });
    } catch (err) {
      console.error("Custom log error:", err);
      showToast("Failed to post log.");
    }
  });

  // 16. Quick Logs Click
  quickLogButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-log");
      if (!text) return;

      if (!hasJoined || !mySlot) {
        showToast("Please enter your name first.");
        return;
      }

      try {
        await DayRoomDB.addLog(roomId, mySlot, { text, type: "quick" });
        showToast(`Logged: ${text}`);
      } catch (err) {
        console.error("Quick log error:", err);
        showToast("Failed to save log.");
      }
    });
  });

  // Expanded quick log chips toggle
  if (quickMoreBtn && expandedTagsPanel) {
    quickMoreBtn.addEventListener("click", () => {
      expandedTagsPanel.classList.toggle("show");
      quickMoreBtn.textContent = expandedTagsPanel.classList.contains("show") ? "- Less" : "+ More";
    });
  }

  // 17. Delete All Logs
  function setupDeleteAllHandlers(btn, slot) {
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (mySlot !== slot) return;
      deleteAllModal.classList.add("active");
    });
  }

  setupDeleteAllHandlers(personADeleteAllBtn, "userA");
  setupDeleteAllHandlers(personBDeleteAllBtn, "userB");

  cancelDeleteAllBtn.addEventListener("click", () => {
    deleteAllModal.classList.remove("active");
  });

  confirmDeleteAllBtn.addEventListener("click", async () => {
    if (!mySlot) return;

    try {
      deleteAllModal.classList.remove("active");
      await DayRoomDB.deleteAllLogs(roomId, mySlot);
      showToast("All your logs deleted.");
    } catch (err) {
      console.error("Delete all error:", err);
      showToast("Failed to delete all logs.");
    }
  });

  // 18. Render Messages Stream
  function renderMessages(messagesObj) {
    const rawMessages = Object.values(messagesObj || {});
    const messageEntries = Object.entries(messagesObj || {});
    
    // Check for incoming new messages from companion
    if (!isInitialMessagesLoaded) {
      // First snapshot on page load: record all existing message IDs without alerting
      messageEntries.forEach(([key, msg]) => {
        const id = (msg && msg.id) || key;
        knownMessageIds.add(id);
      });
      isInitialMessagesLoaded = true;
    } else {
      let companionSenderName = null;
      let newCompanionMsgCount = 0;

      messageEntries.forEach(([key, msg]) => {
        const id = (msg && msg.id) || key;
        if (!knownMessageIds.has(id)) {
          knownMessageIds.add(id);
          const isFromMe = (msg.authorId === userId || (mySlot && msg.authorSlot === mySlot));
          if (!isFromMe) {
            newCompanionMsgCount++;
            if (msg.author) {
              companionSenderName = msg.author;
            } else {
              const otherSlot = mySlot === "userA" ? "userB" : "userA";
              const otherUser = currentRoomData && currentRoomData.users && currentRoomData.users[otherSlot];
              if (otherUser && otherUser.name) {
                companionSenderName = otherUser.name;
              }
            }
          }
        }
      });

      if (newCompanionMsgCount > 0) {
        const senderDisplayName = companionSenderName || "Companion";
        notifyMessage(senderDisplayName);
      }
    }

    if (rawMessages.length === 0) {
      messagesStream.innerHTML = "";
      messagesEmptyState.style.display = "block";
      return;
    }

    messagesEmptyState.style.display = "none";

    // Sort messages chronologically (oldest to newest)
    rawMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    messagesStream.innerHTML = "";

    rawMessages.forEach((msg) => {
      const isFromMe = (msg.authorId === userId || (mySlot && msg.authorSlot === mySlot));
      const itemEl = document.createElement("div");
      itemEl.className = `message-item ${isFromMe ? "from-me" : "from-them"}`;

      const metaEl = document.createElement("span");
      metaEl.className = "message-meta";
      const timeStr = formatTime(msg.timestamp);
      const authorDisplayName = isFromMe ? "Me" : (msg.author || "Companion");
      metaEl.textContent = `${timeStr} · ${authorDisplayName}`;

      const bubbleEl = document.createElement("div");
      bubbleEl.className = "message-bubble";

      // If message includes an image (selfie/camera snapshot)
      if (msg.imageUrl) {
        const photoWrapper = document.createElement("div");
        photoWrapper.className = "message-photo-wrapper";

        const imgEl = document.createElement("img");
        imgEl.src = msg.imageUrl;
        imgEl.alt = "IRL Photo";
        imgEl.className = "message-photo";
        imgEl.loading = "lazy";

        imgEl.addEventListener("click", () => {
          if (lightboxImg) lightboxImg.src = msg.imageUrl;
          if (lightboxCaption) lightboxCaption.textContent = msg.text || "";
          if (imageLightboxModal) imageLightboxModal.classList.add("active");
        });

        photoWrapper.appendChild(imgEl);
        bubbleEl.appendChild(photoWrapper);
      }

      if (msg.text) {
        const textEl = document.createElement("div");
        textEl.className = msg.imageUrl ? "message-caption" : "message-text";
        textEl.textContent = msg.text;
        bubbleEl.appendChild(textEl);
      }

      itemEl.appendChild(metaEl);
      itemEl.appendChild(bubbleEl);
      messagesStream.appendChild(itemEl);
    });

    // Auto-scroll to bottom of messages stream
    messagesStream.scrollTop = messagesStream.scrollHeight;
  }

  if (messageInput) {
    messageInput.addEventListener("focus", () => {
      getAudioContext();
      requestNotificationPermission();
    }, { once: true });
  }

  messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    getAudioContext();
    requestNotificationPermission();

    if (!hasJoined || !mySlot) {
      showToast("Please enter your name first.");
      return;
    }

    try {
      messageInput.value = "";
      await DayRoomDB.sendMessage(roomId, mySlot, userName, userId, text);
    } catch (err) {
      console.error("Message send error:", err);
      showToast("Failed to send note.");
    }
  });

  // 17. Toolbox Rendering & Handlers
  function renderToolboxState(tools) {
    const isWaterActive = Boolean(tools && tools.waterTracker);
    const isQuickLogsActive = Boolean(tools && tools.quickLogs);

    if (waterToolToggleBtn) {
      waterToolToggleBtn.classList.toggle("active", isWaterActive);
      waterToolToggleBtn.setAttribute("aria-pressed", isWaterActive ? "true" : "false");
    }

    if (waterToolBadge) {
      waterToolBadge.textContent = isWaterActive ? "Active" : "Off";
      waterToolBadge.classList.toggle("active", isWaterActive);
    }

    if (quickLogsToggleBtn) {
      quickLogsToggleBtn.classList.toggle("active", isQuickLogsActive);
      quickLogsToggleBtn.setAttribute("aria-pressed", isQuickLogsActive ? "true" : "false");
    }

    if (quickLogsToolBadge) {
      quickLogsToolBadge.textContent = isQuickLogsActive ? "Active" : "Off";
      quickLogsToolBadge.classList.toggle("active", isQuickLogsActive);
    }

    if (quickLogSection) {
      quickLogSection.style.display = isQuickLogsActive ? "block" : "none";
    }

    if (toolboxActiveCount) {
      const activeCount = (isWaterActive ? 1 : 0) + (isQuickLogsActive ? 1 : 0);
      if (activeCount > 0) {
        toolboxActiveCount.textContent = activeCount;
        toolboxActiveCount.style.display = "inline-flex";
      } else {
        toolboxActiveCount.style.display = "none";
      }
    }
  }

  if (toolboxTriggerBtn && toolboxPanel) {
    toolboxTriggerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = toolboxPanel.style.display !== "none";
      if (isVisible) {
        toolboxPanel.style.display = "none";
        toolboxTriggerBtn.classList.remove("active-open");
        toolboxTriggerBtn.setAttribute("aria-expanded", "false");
      } else {
        toolboxPanel.style.display = "block";
        toolboxTriggerBtn.classList.add("active-open");
        toolboxTriggerBtn.setAttribute("aria-expanded", "true");
      }
    });

    if (toolboxCloseBtn) {
      toolboxCloseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toolboxPanel.style.display = "none";
        toolboxTriggerBtn.classList.remove("active-open");
        toolboxTriggerBtn.setAttribute("aria-expanded", "false");
      });
    }

    // Close toolbox on outside click
    document.addEventListener("click", (e) => {
      if (toolboxPanel.style.display !== "none" && toolboxWidget && !toolboxWidget.contains(e.target)) {
        toolboxPanel.style.display = "none";
        toolboxTriggerBtn.classList.remove("active-open");
        toolboxTriggerBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Toggle water tool
    if (waterToolToggleBtn) {
      waterToolToggleBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const currentTools = (currentRoomData && currentRoomData.tools) ? currentRoomData.tools : {};
        const isWaterActive = Boolean(currentTools.waterTracker);
        const newState = !isWaterActive;

        try {
          await DayRoomDB.setToolActive(roomId, "waterTracker", newState);
          showToast(newState ? "💧 Water tracker added to room" : "Water tracker removed from room");
        } catch (err) {
          console.error("Failed to toggle water tracker tool:", err);
          showToast("Failed to update tool. Check connection.");
        }
      });
    }

    // Toggle quick logs tool
    if (quickLogsToggleBtn) {
      quickLogsToggleBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const currentTools = (currentRoomData && currentRoomData.tools) ? currentRoomData.tools : {};
        const isQuickLogsActive = Boolean(currentTools.quickLogs);
        const newState = !isQuickLogsActive;

        try {
          await DayRoomDB.setToolActive(roomId, "quickLogs", newState);
          showToast(newState ? "⚡ Quick logs added to room" : "Quick logs removed from room");
        } catch (err) {
          console.error("Failed to toggle quick logs tool:", err);
          showToast("Failed to update tool. Check connection.");
        }
      });
    }
  }

  // Helper to escape HTML in text output
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 19. Initialize Subscription
  initRoomSubscription();
});

/**
 * Global Toast Helper
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
