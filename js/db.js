/**
 * Day Room - Realtime Database Service Layer
 * 
 * Handles all reads, writes, and realtime subscriptions to Firebase Realtime Database.
 */

const DayRoomDB = (function () {
  /**
   * Helper to safely get the Firebase Database instance
   */
  function getDb() {
    if (window.DayRoomFirebase && window.DayRoomFirebase.getDb()) {
      return window.DayRoomFirebase.getDb();
    }
    return null;
  }

  /**
   * Check if Firebase is ready
   */
  function isReady() {
    return window.DayRoomFirebase && window.DayRoomFirebase.isConfigured() && getDb() !== null;
  }

  /**
   * Create a new room in Firebase Realtime Database
   * @param {string} roomId
   * @returns {Promise<boolean>}
   */
  async function createRoom(roomId) {
    const db = getDb();
    if (!db) {
      throw new Error("Firebase Realtime Database is not configured.");
    }

    const roomRef = db.ref(`rooms/${roomId}`);

    // Check if room already exists
    const snapshot = await roomRef.once("value");
    if (snapshot.exists()) {
      return true; // Already exists, proceed
    }

    const initialData = {
      createdAt: Date.now(),
      users: {
        userA: {
          id: "",
          name: "",
          joinedAt: 0,
          activeTimer: null
        },
        userB: {
          id: "",
          name: "",
          joinedAt: 0,
          activeTimer: null
        }
      },
      messages: {}
    };

    await roomRef.set(initialData);
    return true;
  }

  /**
   * Check if a room exists
   * @param {string} roomId 
   * @returns {Promise<boolean>}
   */
  async function checkRoomExists(roomId) {
    const db = getDb();
    if (!db) return false;
    const snapshot = await db.ref(`rooms/${roomId}`).once("value");
    return snapshot.exists();
  }

  /**
   * Subscribe to real-time changes of a room
   * @param {string} roomId 
   * @param {Function} onDataCallback 
   * @param {Function} onErrorCallback 
   * @returns {Function} Unsubscribe function
   */
  function subscribeRoom(roomId, onDataCallback, onErrorCallback) {
    const db = getDb();
    if (!db) {
      if (onErrorCallback) onErrorCallback(new Error("Firebase is not configured."));
      return () => { };
    }

    const roomRef = db.ref(`rooms/${roomId}`);
    const listener = roomRef.on(
      "value",
      (snapshot) => {
        onDataCallback(snapshot.val(), snapshot.exists());
      },
      (error) => {
        console.error("Firebase Room Subscription Error:", error);
        if (onErrorCallback) onErrorCallback(error);
      }
    );

    return function unsubscribe() {
      roomRef.off("value", listener);
    };
  }

  /**
   * Claim a participant slot (userA or userB)
   * @param {string} roomId 
   * @param {"userA"|"userB"} slot 
   * @param {string} userId 
   * @param {string} name 
   */
  async function claimSlot(roomId, slot, userId, name) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    const userRef = db.ref(`rooms/${roomId}/users/${slot}`);
    await userRef.update({
      id: userId,
      name: name.trim(),
      joinedAt: Date.now()
    });
  }

  /**
   * Add a generic or quick log entry
   * @param {string} roomId 
   * @param {"userA"|"userB"} slot 
   * @param {Object} logData 
   */
  async function addLog(roomId, slot, logData) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    const logsRef = db.ref(`rooms/${roomId}/users/${slot}/logs`);
    const newLogRef = logsRef.push();

    const entry = {
      id: newLogRef.key,
      text: logData.text || "",
      type: logData.type || "custom", // "custom" | "quick" | "timer"
      timestamp: Date.now()
    };

    await newLogRef.set(entry);
    return entry;
  }

  /**
   * Start a stopwatch timer
   * @param {string} roomId 
   * @param {"userA"|"userB"} slot 
   * @param {string} taskName 
   */
  async function startTimer(roomId, slot, taskName) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    const now = Date.now();
    const logsRef = db.ref(`rooms/${roomId}/users/${slot}/logs`);
    const newLogRef = logsRef.push();
    const logId = newLogRef.key;

    const timerLog = {
      id: logId,
      type: "timer",
      task: taskName.trim(),
      startedAt: now,
      timestamp: now,
      isActive: true
    };

    const activeTimerState = {
      logId: logId,
      task: taskName.trim(),
      startedAt: now
    };

    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}`] = timerLog;
    updates[`rooms/${roomId}/users/${slot}/activeTimer`] = activeTimerState;

    await db.ref().update(updates);
    return timerLog;
  }

  /**
   * Finish an active stopwatch timer
   * @param {string} roomId 
   * @param {"userA"|"userB"} slot 
   * @param {string} logId 
   * @param {number} startedAt 
   * @param {string} durationFormatted 
   */
  async function finishTimer(roomId, slot, logId, startedAt, durationFormatted) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    const now = Date.now();
    const duration = now - startedAt;

    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/isActive`] = false;
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/finishedAt`] = now;
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/duration`] = duration;
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/durationFormatted`] = durationFormatted;
    updates[`rooms/${roomId}/users/${slot}/activeTimer`] = null;

    await db.ref().update(updates);
  }

  /**
   * Start a Pomodoro timer session
   * @param {string} roomId 
   * @param {"userA"|"userB"} slot 
   * @param {string} taskName 
   * @param {number} workMinutes 
   * @param {number} breakMinutes 
   * @param {number} totalCycles 
   */
  async function startPomodoro(roomId, slot, taskName, workMinutes, breakMinutes, totalCycles) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    const now = Date.now();
    const logsRef = db.ref(`rooms/${roomId}/users/${slot}/logs`);
    const newLogRef = logsRef.push();
    const logId = newLogRef.key;

    const pomodoroLog = {
      id: logId,
      type: "timer",
      timerSubtype: "pomodoro",
      task: taskName.trim(),
      workMinutes: Number(workMinutes),
      breakMinutes: Number(breakMinutes),
      totalCycles: Number(totalCycles),
      currentCycle: 1,
      currentPhase: "work", // "work" | "break"
      phaseStartedAt: now,
      startedAt: now,
      timestamp: now,
      isActive: true
    };

    const activeTimerState = {
      logId: logId,
      task: taskName.trim(),
      type: "pomodoro",
      timerSubtype: "pomodoro",
      workMinutes: Number(workMinutes),
      breakMinutes: Number(breakMinutes),
      totalCycles: Number(totalCycles),
      currentCycle: 1,
      currentPhase: "work",
      phaseStartedAt: now,
      startedAt: now
    };

    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}`] = pomodoroLog;
    updates[`rooms/${roomId}/users/${slot}/activeTimer`] = activeTimerState;

    await db.ref().update(updates);
    return pomodoroLog;
  }

  /**
   * Update Pomodoro to the next phase/cycle
   * @param {string} roomId 
   * @param {"userA"|"userB"} slot 
   * @param {string} logId 
   * @param {number} nextCycle 
   * @param {"work"|"break"} nextPhase 
   */
  async function updatePomodoroPhase(roomId, slot, logId, nextCycle, nextPhase) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    const now = Date.now();
    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/currentCycle`] = nextCycle;
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/currentPhase`] = nextPhase;
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/phaseStartedAt`] = now;

    updates[`rooms/${roomId}/users/${slot}/activeTimer/currentCycle`] = nextCycle;
    updates[`rooms/${roomId}/users/${slot}/activeTimer/currentPhase`] = nextPhase;
    updates[`rooms/${roomId}/users/${slot}/activeTimer/phaseStartedAt`] = now;

    await db.ref().update(updates);
  }

  /**
   * Finish Pomodoro session
   * @param {string} roomId 
   * @param {"userA"|"userB"} slot 
   * @param {string} logId 
   * @param {number} startedAt 
   * @param {number} completedCycles 
   * @param {number} totalCycles 
   * @param {string} durationFormatted 
   */
  async function finishPomodoro(roomId, slot, logId, startedAt, completedCycles, totalCycles, durationFormatted) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    const now = Date.now();
    const duration = now - startedAt;

    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/isActive`] = false;
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/finishedAt`] = now;
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/duration`] = duration;
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/durationFormatted`] = durationFormatted;
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/completedCycles`] = completedCycles;
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}/totalCycles`] = totalCycles;
    updates[`rooms/${roomId}/users/${slot}/activeTimer`] = null;

    await db.ref().update(updates);
  }

  /**
   * Delete an individual log
   * @param {string} roomId 
   * @param {"userA"|"userB"} slot 
   * @param {string} logId 
   */
  async function deleteLog(roomId, slot, logId) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    // Check if this log is currently the active timer
    const activeSnapshot = await db.ref(`rooms/${roomId}/users/${slot}/activeTimer`).once("value");
    const active = activeSnapshot.val();

    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}`] = null;
    if (active && active.logId === logId) {
      updates[`rooms/${roomId}/users/${slot}/activeTimer`] = null;
    }

    await db.ref().update(updates);
  }

  /**
   * Delete all logs for the current user slot
   * @param {string} roomId 
   * @param {"userA"|"userB"} slot 
   */
  async function deleteAllLogs(roomId, slot) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/logs`] = null;
    updates[`rooms/${roomId}/users/${slot}/activeTimer`] = null;

    await db.ref().update(updates);
  }

  /**
   * Send a note/message in the room
   * @param {string} roomId 
   * @param {"userA"|"userB"} authorSlot 
   * @param {string} authorName 
   * @param {string} authorId 
   * @param {string} text 
   * @param {string|null} imageUrl 
   */
  async function sendMessage(roomId, authorSlot, authorName, authorId, text, imageUrl = null) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    const messagesRef = db.ref(`rooms/${roomId}/messages`);
    const newMsgRef = messagesRef.push();

    const messageData = {
      id: newMsgRef.key,
      author: authorName,
      authorSlot: authorSlot,
      authorId: authorId,
      text: (text || "").trim(),
      timestamp: Date.now()
    };

    if (imageUrl) {
      messageData.imageUrl = imageUrl;
    }

    await newMsgRef.set(messageData);
    return messageData;
  }

  return {
    isReady,
    createRoom,
    checkRoomExists,
    subscribeRoom,
    claimSlot,
    addLog,
    startTimer,
    finishTimer,
    startPomodoro,
    updatePomodoroPhase,
    finishPomodoro,
    deleteLog,
    deleteAllLogs,
    sendMessage
  };
})();
