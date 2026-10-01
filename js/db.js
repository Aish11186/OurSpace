/**
 * Day Room - Realtime Database Service Layer
 * 
 * Handles all reads, writes, and realtime subscriptions to Firebase Realtime Database.
 */

const DayRoomDB = (function () {
  /**
   * 30 hours in milliseconds (30 * 60 * 60 * 1000)
   */
  const INACTIVITY_TIMEOUT_MS = 30 * 60 * 60 * 1000;

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
   * Calculate the most recent activity timestamp for a room
   * Checks explicit lastActivity, createdAt, slot join timestamps, logs, messages, and todos.
   * @param {Object} data 
   * @returns {number}
   */
  function getLastActivityTime(data) {
    if (!data) return 0;

    let latest = data.lastActivity || data.createdAt || 0;

    const users = data.users || {};
    ["userA", "userB"].forEach((slot) => {
      const u = users[slot];
      if (u) {
        if (u.joinedAt && u.joinedAt > latest) latest = u.joinedAt;
        if (u.activeTimer && u.activeTimer.startedAt && u.activeTimer.startedAt > latest) {
          latest = u.activeTimer.startedAt;
        }
        if (u.logs) {
          Object.values(u.logs).forEach((log) => {
            if (log.timestamp && log.timestamp > latest) latest = log.timestamp;
            if (log.startedAt && log.startedAt > latest) latest = log.startedAt;
            if (log.finishedAt && log.finishedAt > latest) latest = log.finishedAt;
          });
        }
        if (u.todos) {
          Object.values(u.todos).forEach((todo) => {
            if (todo.createdAt && todo.createdAt > latest) latest = todo.createdAt;
            if (todo.completedAt && todo.completedAt > latest) latest = todo.completedAt;
          });
        }
      }
    });

    if (data.messages) {
      Object.values(data.messages).forEach((msg) => {
        if (msg.timestamp && msg.timestamp > latest) latest = msg.timestamp;
      });
    }

    return latest;
  }

  /**
   * Check if a room has been inactive for more than 30 hours
   * @param {Object} data 
   * @returns {boolean}
   */
  function isRoomExpired(data) {
    if (!data) return false;
    const lastActive = getLastActivityTime(data);
    if (!lastActive) return false;
    return (Date.now() - lastActive) > INACTIVITY_TIMEOUT_MS;
  }

  /**
   * Reset / wipe all expired room data and re-initialize a fresh empty room
   * @param {string} roomId 
   * @returns {Promise<Object>}
   */
  async function resetExpiredRoom(roomId) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    const now = Date.now();
    const freshData = {
      createdAt: now,
      lastActivity: now,
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
      tools: {
        waterTracker: false,
        quickLogs: false
      },
      messages: {}
    };

    await db.ref(`rooms/${roomId}`).set(freshData);
    return freshData;
  }

  /**
   * Touch activity timestamp on active room
   * @param {string} roomId 
   */
  async function touchActivity(roomId) {
    const db = getDb();
    if (!db) return;
    try {
      await db.ref(`rooms/${roomId}/lastActivity`).set(Date.now());
    } catch (e) {}
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
      const data = snapshot.val();
      if (isRoomExpired(data)) {
        await resetExpiredRoom(roomId);
      }
      return true;
    }

    const now = Date.now();
    const initialData = {
      createdAt: now,
      lastActivity: now,
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
      tools: {
        waterTracker: false,
        quickLogs: false
      },
      messages: {}
    };

    await roomRef.set(initialData);
    return true;
  }

  /**
   * Check if a room exists and whether it is expired
   * @param {string} roomId 
   * @returns {Promise<boolean>}
   */
  async function checkRoomExists(roomId) {
    const db = getDb();
    if (!db) return false;
    const snapshot = await db.ref(`rooms/${roomId}`).once("value");
    if (!snapshot.exists()) return false;

    const data = snapshot.val();
    if (isRoomExpired(data)) {
      await resetExpiredRoom(roomId);
    }
    return true;
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

    const now = Date.now();
    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/id`] = userId;
    updates[`rooms/${roomId}/users/${slot}/name`] = name.trim();
    updates[`rooms/${roomId}/users/${slot}/joinedAt`] = now;
    updates[`rooms/${roomId}/lastActivity`] = now;

    await db.ref().update(updates);
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

    const now = Date.now();
    const logsRef = db.ref(`rooms/${roomId}/users/${slot}/logs`);
    const newLogRef = logsRef.push();

    const entry = {
      id: newLogRef.key,
      text: logData.text || "",
      type: logData.type || "custom", // "custom" | "quick" | "timer"
      timestamp: now
    };

    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/logs/${entry.id}`] = entry;
    updates[`rooms/${roomId}/lastActivity`] = now;

    await db.ref().update(updates);
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
    updates[`rooms/${roomId}/lastActivity`] = now;

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
    updates[`rooms/${roomId}/lastActivity`] = now;

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
    updates[`rooms/${roomId}/lastActivity`] = now;

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
    updates[`rooms/${roomId}/lastActivity`] = now;

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
    updates[`rooms/${roomId}/lastActivity`] = now;

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
    if (!logId) {
      console.error("deleteLog: missing logId");
      return;
    }

    // Check if this log is currently the active timer
    const activeSnapshot = await db.ref(`rooms/${roomId}/users/${slot}/activeTimer`).once("value");
    const active = activeSnapshot.val();

    const now = Date.now();
    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/logs/${logId}`] = null;
    if (active && active.logId === logId) {
      updates[`rooms/${roomId}/users/${slot}/activeTimer`] = null;
    }
    updates[`rooms/${roomId}/lastActivity`] = now;

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

    const now = Date.now();
    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/logs`] = null;
    updates[`rooms/${roomId}/users/${slot}/activeTimer`] = null;
    updates[`rooms/${roomId}/lastActivity`] = now;

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

    const now = Date.now();
    const messagesRef = db.ref(`rooms/${roomId}/messages`);
    const newMsgRef = messagesRef.push();

    const messageData = {
      id: newMsgRef.key,
      author: authorName,
      authorSlot: authorSlot,
      authorId: authorId,
      text: (text || "").trim(),
      timestamp: now
    };

    if (imageUrl) {
      messageData.imageUrl = imageUrl;
    }

    const updates = {};
    updates[`rooms/${roomId}/messages/${newMsgRef.key}`] = messageData;
    updates[`rooms/${roomId}/lastActivity`] = now;

    await db.ref().update(updates);
    return messageData;
  }

  /**
   * Add a todo item for a user slot
   * @param {string} roomId 
   * @param {"userA"|"userB"} slot 
   * @param {string} text 
   */
  async function addTodo(roomId, slot, text) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    const now = Date.now();
    const todosRef = db.ref(`rooms/${roomId}/users/${slot}/todos`);
    const newTodoRef = todosRef.push();

    const todoItem = {
      id: newTodoRef.key,
      text: (text || "").trim(),
      completed: false,
      createdAt: now,
      completedAt: null
    };

    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/todos/${newTodoRef.key}`] = todoItem;
    updates[`rooms/${roomId}/lastActivity`] = now;

    await db.ref().update(updates);
    return todoItem;
  }

  /**
   * Toggle completion status of a todo item
   * @param {string} roomId 
   * @param {"userA"|"userB"} slot 
   * @param {string} todoId 
   * @param {boolean} isCompleted 
   */
  async function toggleTodo(roomId, slot, todoId, isCompleted) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");
    if (!todoId) {
      console.error("toggleTodo: missing todoId");
      return;
    }

    const now = Date.now();
    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/todos/${todoId}/completed`] = isCompleted;
    updates[`rooms/${roomId}/users/${slot}/todos/${todoId}/completedAt`] = isCompleted ? now : null;
    updates[`rooms/${roomId}/lastActivity`] = now;

    await db.ref().update(updates);
  }

  /**
   * Delete an individual todo item
   * @param {string} roomId 
   * @param {"userA"|"userB"} slot 
   * @param {string} todoId 
   */
  async function deleteTodo(roomId, slot, todoId) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");
    if (!todoId) {
      console.error("deleteTodo: missing todoId");
      return;
    }

    const now = Date.now();
    const updates = {};
    updates[`rooms/${roomId}/users/${slot}/todos/${todoId}`] = null;
    updates[`rooms/${roomId}/lastActivity`] = now;

    await db.ref().update(updates);
  }

  /**
   * Toggle or set an active tool for the room
   * @param {string} roomId 
   * @param {string} toolName 
   * @param {boolean} isActive 
   */
  async function setToolActive(roomId, toolName, isActive) {
    const db = getDb();
    if (!db) throw new Error("Firebase not initialized.");

    const now = Date.now();
    const updates = {};
    updates[`rooms/${roomId}/tools/${toolName}`] = Boolean(isActive);
    updates[`rooms/${roomId}/lastActivity`] = now;

    await db.ref().update(updates);
  }

  return {
    isReady,
    INACTIVITY_TIMEOUT_MS,
    getLastActivityTime,
    isRoomExpired,
    resetExpiredRoom,
    touchActivity,
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
    sendMessage,
    addTodo,
    toggleTodo,
    deleteTodo,
    setToolActive
  };
})();
