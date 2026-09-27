/**
 * Day Room - Room View Logic
 * 
 * Manages participant slots, live stopwatch, timeline synchronization,
 * message streams, quick actions, and deletion operations.
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

  // DOM Elements
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

  // My Controls: Timer
  const timerControlSection = document.getElementById("timerControlSection");
  const timerIdleState = document.getElementById("timerIdleState");
  const timerRunningState = document.getElementById("timerRunningState");
  const startTimerOpenBtn = document.getElementById("startTimerOpenBtn");
  const activeTaskTitle = document.getElementById("activeTaskTitle");
  const activeTimerClock = document.getElementById("activeTimerClock");
  const finishTimerBtn = document.getElementById("finishTimerBtn");

  // My Controls: Logs
  const customLogForm = document.getElementById("customLogForm");
  const customLogInput = document.getElementById("customLogInput");
  const quickLogButtons = document.querySelectorAll(".quick-chip[data-log]");
  const quickMoreBtn = document.getElementById("quickMoreBtn");
  const expandedTagsPanel = document.getElementById("expandedTagsPanel");

  // Messages
  const messagesStream = document.getElementById("messagesStream");
  const messagesEmptyState = document.getElementById("messagesEmptyState");
  const messageForm = document.getElementById("messageForm");
  const messageInput = document.getElementById("messageInput");

  // Modals
  const joinRoomModal = document.getElementById("joinRoomModal");
  const joinRoomForm = document.getElementById("joinRoomForm");
  const joinNameInput = document.getElementById("joinNameInput");

  const startTimerModal = document.getElementById("startTimerModal");
  const startTimerForm = document.getElementById("startTimerForm");
  const taskNameInput = document.getElementById("taskNameInput");
  const cancelStartTimerBtn = document.getElementById("cancelStartTimerBtn");

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

  // 5. Global 1-Second Interval Ticker
  // This updates local active timers on screen without querying Firebase every second
  setInterval(() => {
    const now = Date.now();

    // Update My Controls timer if running
    if (activeTimerData && activeTimerData.startedAt) {
      const elapsed = now - activeTimerData.startedAt;
      if (activeTimerClock) {
        activeTimerClock.textContent = formatStopwatch(elapsed);
      }
    }

    // Update any active timer badges in Person A or Person B timelines
    const activeTimelineBadges = document.querySelectorAll(".timer-live-ticker");
    activeTimelineBadges.forEach((el) => {
      const startedAt = parseInt(el.getAttribute("data-started-at"), 10);
      if (startedAt) {
        const elapsed = now - startedAt;
        el.textContent = formatDurationShort(elapsed);
      }
    });
  }, 1000);

  // 6. Realtime Firebase Subscription
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
      (data, exists) => {
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

        currentRoomData = data;
        handleRoomDataUpdate(data);
      },
      (error) => {
        console.error("Room Subscription Error:", error);
        showToast("Connection issue with Firebase.");
      }
    );
  }

  // 7. Handle Room Data & Slot Assignment
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
        // Slot A is available
        promptJoinModal("userA");
        return;
      } else if (!userB.id) {
        // Slot B is available
        promptJoinModal("userB");
        return;
      } else {
        // Both slots filled by other users!
        showRoomFull(userA.name, userB.name);
        return;
      }
    }

    // Update Room Header Status
    updateRoomStatus(userA, userB);

    // Render Columns
    renderPersonColumn("userA", userA, personAName, personABadge, personATimelineList, personAEmptyState, personAFooter);
    renderPersonColumn("userB", userB, personBName, personBBadge, personBTimelineList, personBEmptyState, personBFooter);

    // Render My Controls Timer State
    renderMyTimerControls(users[mySlot]);

    // Render Shared Messages
    renderMessages(data.messages || {});
  }

  // 8. Join Modal Prompts
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

  // 9. Update Navbar Status
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

  // 10. Render Person Column (A or B)
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
    const rawLogs = (userData && userData.logs) ? Object.values(userData.logs) : [];
    
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
        deleteBtn.addEventListener("click", () => {
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
        nodeEl.classList.add("node-timer");
        cardEl.classList.add("timer-card");

        const isCurrentlyActive = log.isActive === true;

        if (isCurrentlyActive) {
          nodeEl.classList.add("node-active");
          cardEl.classList.add("active-timer");

          const elapsedNow = Date.now() - log.startedAt;
          
          cardEl.innerHTML += `
            <div class="timer-task-title">
              <span>Started timer for <strong>"${escapeHtml(log.task || "Task")}"</strong></span>
            </div>
            <div class="timer-active-badge">
              <span>Currently active · </span>
              <span class="ticker timer-live-ticker" data-started-at="${log.startedAt}">${formatDurationShort(elapsedNow)}</span>
            </div>
          `;
        } else {
          // Finished Timer
          const startTimeStr = formatTime(log.startedAt);
          const finishTimeStr = formatTime(log.finishedAt || log.timestamp);
          const durationStr = log.durationFormatted || formatDurationShort(log.duration || 0);

          cardEl.innerHTML += `
            <div class="timer-task-title">
              <span><strong>${escapeHtml(log.task || "Task")}</strong></span>
            </div>
            <div class="timer-details">
              <span>Started at ${startTimeStr}</span>
              <span>Duration: ${durationStr}</span>
              ${log.finishedAt ? `<span>Finished at ${finishTimeStr}</span>` : ""}
            </div>
          `;
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

  // 11. Render My Controls Timer State
  function renderMyTimerControls(myUserData) {
    if (!myUserData) return;

    activeTimerData = myUserData.activeTimer || null;

    if (activeTimerData && activeTimerData.startedAt) {
      // Timer is running
      timerControlSection.classList.add("running");
      timerIdleState.style.display = "none";
      timerRunningState.style.display = "flex";

      activeTaskTitle.innerHTML = escapeHtml(activeTimerData.task || "Task");
      const elapsed = Date.now() - activeTimerData.startedAt;
      activeTimerClock.textContent = formatStopwatch(elapsed);
    } else {
      // Timer is idle
      timerControlSection.classList.remove("running");
      timerIdleState.style.display = "block";
      timerRunningState.style.display = "none";
    }
  }

  // 12. Start Timer Action
  startTimerOpenBtn.addEventListener("click", () => {
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

  // 13. Finish Timer Action
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

  // 14. Custom Log Submission
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

  // 15. Quick Logs Click
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

  // 16. Delete All Logs
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

  // 17. Messages Rendering & Sending
  function renderMessages(messagesObj) {
    const rawMessages = Object.values(messagesObj || {});
    
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
      const isFromMe = (msg.authorId === userId || msg.authorSlot === mySlot);
      const itemEl = document.createElement("div");
      itemEl.className = `message-item ${isFromMe ? "from-me" : "from-them"}`;

      const metaEl = document.createElement("span");
      metaEl.className = "message-meta";
      const timeStr = formatTime(msg.timestamp);
      const authorDisplayName = isFromMe ? "Me" : (msg.author || "Companion");
      metaEl.textContent = `${timeStr} · ${authorDisplayName}`;

      const bubbleEl = document.createElement("div");
      bubbleEl.className = "message-bubble";
      bubbleEl.textContent = msg.text || "";

      itemEl.appendChild(metaEl);
      itemEl.appendChild(bubbleEl);
      messagesStream.appendChild(itemEl);
    });

    // Auto-scroll to bottom of messages stream
    messagesStream.scrollTop = messagesStream.scrollHeight;
  }

  messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

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

  // 18. Initialize Subscription
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
