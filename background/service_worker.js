// Unfollow Guard - Background Service Worker (Manifest V3)

const DEFAULT_STATE = {
  following: [],
  followers: [],
  nonFollowers: [],
  whitelist: [],
  settings: {
    minDelay: 8,
    maxDelay: 18,
    batchLimit: 20,
    fastMode: false
  },
  queue: {
    running: false,
    users: [],
    total: 0,
    processed: 0,
    nextCountdown: 0,
    currentUser: ''
  }
};

// Initialize Storage Defaults
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['unfollowGuardState'], (result) => {
    if (!result.unfollowGuardState) {
      chrome.storage.local.set({ unfollowGuardState: DEFAULT_STATE });
      console.log('[Background] Initialized storage state.');
    }
  });
});

let countdownTimer = null;
let savedThreadsTabId = null;

// Find Threads Tab specifically (Independent of active tab selection)
function getThreadsTab(callback) {
  if (savedThreadsTabId) {
    chrome.tabs.get(savedThreadsTabId, (tab) => {
      if (chrome.runtime.lastError || !tab || (!tab.url.includes('threads.com') && !tab.url.includes('threads.net'))) {
        savedThreadsTabId = null;
        findThreadsTabFromQuery(callback);
      } else {
        callback(tab);
      }
    });
  } else {
    findThreadsTabFromQuery(callback);
  }
}

function findThreadsTabFromQuery(callback) {
  chrome.tabs.query({ url: ['https://*.threads.com/*', 'https://*.threads.net/*'] }, (tabs) => {
    if (tabs && tabs.length > 0) {
      savedThreadsTabId = tabs[0].id;
      callback(tabs[0]);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
        if (activeTabs && activeTabs.length > 0 && activeTabs[0].url && (activeTabs[0].url.includes('threads.com') || activeTabs[0].url.includes('threads.net'))) {
          savedThreadsTabId = activeTabs[0].id;
          callback(activeTabs[0]);
        } else {
          callback(null);
        }
      });
    }
  });
}

// Message Handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  chrome.storage.local.get(['unfollowGuardState'], (result) => {
    let state = result.unfollowGuardState || { ...DEFAULT_STATE };

    switch (message.action) {
      case 'GET_STATE':
        sendResponse({ state });
        break;

      case 'UPDATE_SCAN_RESULTS':
        state.following = message.following || [];
        state.followers = message.followers || [];
        
        const followerSet = new Set(state.followers.map(f => f.username.toLowerCase()));
        state.nonFollowers = state.following.filter(f => !followerSet.has(f.username.toLowerCase()));

        chrome.storage.local.set({ unfollowGuardState: state }, () => {
          broadcastToRuntime({ action: 'STATE_UPDATED', state });
          sendResponse({ status: 'SUCCESS', state });
        });
        break;

      case 'TOGGLE_WHITELIST':
        const username = message.username;
        const wlSet = new Set(state.whitelist.map(w => w.toLowerCase()));
        if (wlSet.has(username.toLowerCase())) {
          state.whitelist = state.whitelist.filter(w => w.toLowerCase() !== username.toLowerCase());
        } else {
          state.whitelist.push(username);
        }

        chrome.storage.local.set({ unfollowGuardState: state }, () => {
          broadcastToRuntime({ action: 'STATE_UPDATED', state });
          sendResponse({ status: 'SUCCESS', state });
        });
        break;

      case 'SAVE_SETTINGS':
        state.settings = { ...state.settings, ...message.settings };
        chrome.storage.local.set({ unfollowGuardState: state }, () => {
          broadcastToRuntime({ action: 'STATE_UPDATED', state });
          sendResponse({ status: 'SAVED' });
        });
        break;

      case 'CLEAR_DATA':
        state.following = [];
        state.followers = [];
        state.nonFollowers = [];
        chrome.storage.local.set({ unfollowGuardState: state }, () => {
          broadcastToRuntime({ action: 'STATE_UPDATED', state });
          sendResponse({ status: 'SUCCESS', state });
        });
        break;

      case 'START_SEMI_AUTO_QUEUE':
        state.queue.running = true;
        state.queue.users = message.users || [];
        state.queue.total = state.queue.users.length;
        state.queue.processed = 0;
        state.queue.nextCountdown = 0;
        state.queue.currentUser = '';

        if (message.settings) {
          state.settings = { ...state.settings, ...message.settings };
        }

        if (sender.tab && sender.tab.id) {
          savedThreadsTabId = sender.tab.id;
        }

        chrome.storage.local.set({ unfollowGuardState: state }, () => {
          broadcastToRuntime({ action: 'QUEUE_PROGRESS', queue: state.queue });
          processNextQueueItem();
          sendResponse({ status: 'QUEUED' });
        });
        break;

      case 'STOP_QUEUE':
        stopQueue(state, () => {
          sendResponse({ status: 'STOPPED' });
        });
        break;
    }
  });

  return true; // Keep channel open
});

// Background Queue Processor Engine (Tab Switch Independent)
function processNextQueueItem() {
  chrome.storage.local.get(['unfollowGuardState'], (res) => {
    let state = res.unfollowGuardState;
    if (!state || !state.queue || !state.queue.running) return;

    if (state.queue.users.length === 0) {
      state.queue.running = false;
      state.queue.currentUser = '';
      chrome.storage.local.set({ unfollowGuardState: state }, () => {
        broadcastToRuntime({ action: 'QUEUE_PROGRESS', queue: state.queue });
      });
      return;
    }

    const nextUser = state.queue.users.shift();
    state.queue.currentUser = nextUser;

    getThreadsTab((threadsTab) => {
      if (!threadsTab) {
        console.warn('[Background] Threads tab not found. Stopping queue.');
        stopQueue(state);
        return;
      }

      // Ensure content script is ready or inject programmatically
      chrome.tabs.sendMessage(threadsTab.id, {
        action: 'PERFORM_SINGLE_UNFOLLOW',
        username: nextUser
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('[Background] Injecting script to Threads tab...');
          chrome.scripting.executeScript({
            target: { tabId: threadsTab.id },
            files: ['content/content_script.js']
          }, () => {
            setTimeout(() => {
              chrome.tabs.sendMessage(threadsTab.id, {
                action: 'PERFORM_SINGLE_UNFOLLOW',
                username: nextUser
              }, (retryRes) => {
                handleUnfollowResponse(state, nextUser);
              });
            }, 300);
          });
        } else {
          handleUnfollowResponse(state, nextUser);
        }
      });
    });
  });
}

function handleUnfollowResponse(state, username) {
  state.queue.processed += 1;

  // Remove unfollowed user from following and nonFollowers state so it vanishes from the UI list instantly
  if (username) {
    const lower = username.toLowerCase();
    state.following = state.following.filter(u => u.username.toLowerCase() !== lower);
    state.nonFollowers = state.nonFollowers.filter(u => u.username.toLowerCase() !== lower);
  }

  let delaySeconds = 0;
  if (!state.settings.fastMode) {
    const min = state.settings.minDelay !== undefined ? state.settings.minDelay : 8;
    const max = state.settings.maxDelay !== undefined ? state.settings.maxDelay : 18;
    delaySeconds = Math.max(0, Math.floor(Math.random() * (max - min + 1)) + min);
  }

  state.queue.nextCountdown = delaySeconds;

  chrome.storage.local.set({ unfollowGuardState: state }, () => {
    broadcastToRuntime({ action: 'STATE_UPDATED', state });
    broadcastToRuntime({ action: 'QUEUE_PROGRESS', queue: state.queue });
    
    if (state.queue.users.length > 0) {
      if (state.settings.fastMode || delaySeconds <= 0) {
        setTimeout(() => {
          processNextQueueItem();
        }, 400);
      } else {
        startCountdownTimer(delaySeconds, () => {
          processNextQueueItem();
        });
      }
    } else {
      state.queue.running = false;
      state.queue.currentUser = '';
      chrome.storage.local.set({ unfollowGuardState: state }, () => {
        broadcastToRuntime({ action: 'QUEUE_PROGRESS', queue: state.queue });
      });
    }
  });
}

function startCountdownTimer(seconds, onComplete) {
  let remaining = seconds;
  if (countdownTimer) clearInterval(countdownTimer);

  countdownTimer = setInterval(() => {
    remaining -= 1;
    chrome.storage.local.get(['unfollowGuardState'], (res) => {
      if (!res.unfollowGuardState || !res.unfollowGuardState.queue.running) {
        clearInterval(countdownTimer);
        return;
      }
      res.unfollowGuardState.queue.nextCountdown = remaining;
      chrome.storage.local.set({ unfollowGuardState: res.unfollowGuardState });
      broadcastToRuntime({ action: 'QUEUE_PROGRESS', queue: res.unfollowGuardState.queue });
    });

    if (remaining <= 0) {
      clearInterval(countdownTimer);
      if (onComplete) onComplete();
    }
  }, 1000);
}

function stopQueue(state, callback) {
  if (countdownTimer) clearInterval(countdownTimer);

  if (state && state.queue) {
    state.queue.running = false;
    state.queue.users = [];
    state.queue.currentUser = '';
    chrome.storage.local.set({ unfollowGuardState: state }, () => {
      broadcastToRuntime({ action: 'QUEUE_PROGRESS', queue: state.queue });
      if (callback) callback();
    });
  } else if (callback) callback();
}

function broadcastToRuntime(message) {
  chrome.runtime.sendMessage(message, () => {
    if (chrome.runtime.lastError) {}
  });
}
