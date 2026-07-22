// Threads Unfollow Guard - Clean Popup Controller

document.addEventListener('DOMContentLoaded', () => {
  // DOM Selectors
  const segBtns = document.querySelectorAll('.seg-btn');
  const tabPages = document.querySelectorAll('.tab-page');
  
  // Metric Display Elements
  const statFollowing = document.getElementById('statFollowing');
  const statFollowers = document.getElementById('statFollowers');
  const statNonFollowers = document.getElementById('statNonFollowers');
  const statWhitelist = document.getElementById('statWhitelist');
  const nonFollowersBadge = document.getElementById('nonFollowersBadge');
  
  // Buttons
  const btnStartScan = document.getElementById('btnStartScan');
  const btnClearData = document.getElementById('btnClearData');
  const btnStartSemiAuto = document.getElementById('btnStartSemiAuto');
  const btnStartSemiAutoOverview = document.getElementById('btnStartSemiAutoOverview');
  const btnBulkWhitelist = document.getElementById('btnBulkWhitelist');
  const btnStopQueue = document.getElementById('btnStopQueue');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const selectedCount = document.getElementById('selectedCount');
  
  // Search & Filter Components
  const searchInput = document.getElementById('searchInput');
  const filterChips = document.querySelectorAll('.chip-btn');
  const accountsListContainer = document.getElementById('accountsListContainer');
  const countFilterAll = document.getElementById('countFilterAll');
  const countFilterNon = document.getElementById('countFilterNon');
  const countFilterWhite = document.getElementById('countFilterWhite');
  
  // Settings Components
  const inputMinDelay = document.getElementById('inputMinDelay');
  const inputMaxDelay = document.getElementById('inputMaxDelay');
  const inputBatchLimit = document.getElementById('inputBatchLimit');
  const toggleFastMode = document.getElementById('toggleFastMode');
  const valMinDelay = document.getElementById('valMinDelay');
  const valMaxDelay = document.getElementById('valMaxDelay');
  const valBatchLimit = document.getElementById('valBatchLimit');
  
  // Queue Progress UI
  const queueStatusCard = document.getElementById('queueStatusCard');
  const progressBarFill = document.getElementById('progressBarFill');
  const queueProgressText = document.getElementById('queueProgressText');
  const queueDelayCountdown = document.getElementById('queueDelayCountdown');
  const globalStatusMsg = document.getElementById('globalStatusMsg');
  const activePlatform = document.getElementById('activePlatform');

  // Application State
  let appState = {
    following: [],
    followers: [],
    nonFollowers: [],
    whitelist: [],
    selectedUsers: new Set(),
    activeFilter: 'all',
    searchQuery: '',
    settings: {
      minDelay: 8,
      maxDelay: 18,
      batchLimit: 20,
      fastMode: false
    },
    queue: {
      running: false,
      total: 0,
      processed: 0,
      nextCountdown: 0
    }
  };

  // --- SEGMENTED TAB SWITCHING ---
  segBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      segBtns.forEach(b => b.classList.remove('active'));
      tabPages.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPage = document.getElementById(targetTab);
      if (targetPage) targetPage.classList.add('active');
    });
  });

  // --- SLIDER VALUE INPUT HANDLERS ---
  if (inputMinDelay) {
    inputMinDelay.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (valMinDelay) valMinDelay.textContent = `${val} Detik`;
      if (inputMaxDelay && parseInt(inputMaxDelay.value) < val) {
        inputMaxDelay.value = val;
        if (valMaxDelay) valMaxDelay.textContent = `${val} Detik`;
      }
    });
  }

  if (inputMaxDelay) {
    inputMaxDelay.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (valMaxDelay) valMaxDelay.textContent = `${val} Detik`;
      if (inputMinDelay && parseInt(inputMinDelay.value) > val) {
        inputMinDelay.value = val;
        if (valMinDelay) valMinDelay.textContent = `${val} Detik`;
      }
    });
  }

  if (inputBatchLimit) {
    inputBatchLimit.addEventListener('input', (e) => {
      if (valBatchLimit) valBatchLimit.textContent = `${e.target.value} Akun`;
    });
  }

  // --- FETCH STORAGE STATE ---
  function loadState() {
    chrome.runtime.sendMessage({ action: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response && response.state) {
        appState = { ...appState, ...response.state };
        updateSettingsUI();
        renderStats();
        renderAccountsList();
        updateQueueUI();
      }
    });

    // Check Active Domain
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        const url = tabs[0].url;
        if (activePlatform) {
          if (url.includes('threads.net') || url.includes('threads.com')) {
            activePlatform.textContent = 'Threads';
          } else if (url.includes('instagram.com')) {
            activePlatform.textContent = 'Instagram';
          } else {
            activePlatform.textContent = 'Web';
          }
        }
      }
    });
  }

  function updateSettingsUI() {
    if (inputMinDelay) inputMinDelay.value = appState.settings.minDelay;
    if (valMinDelay) valMinDelay.textContent = `${appState.settings.minDelay} Detik`;
    if (inputMaxDelay) inputMaxDelay.value = appState.settings.maxDelay;
    if (valMaxDelay) valMaxDelay.textContent = `${appState.settings.maxDelay} Detik`;
    if (inputBatchLimit) inputBatchLimit.value = appState.settings.batchLimit;
    if (valBatchLimit) valBatchLimit.textContent = `${appState.settings.batchLimit} Akun`;
    if (toggleFastMode) toggleFastMode.checked = !!appState.settings.fastMode;
  }

  function renderStats() {
    const followerSet = new Set(appState.followers.map(u => u.username.toLowerCase()));
    appState.nonFollowers = appState.following.filter(u => !followerSet.has(u.username.toLowerCase()));

    if (statFollowing) statFollowing.textContent = appState.following.length;
    if (statFollowers) statFollowers.textContent = appState.followers.length;
    if (statNonFollowers) statNonFollowers.textContent = appState.nonFollowers.length;
    if (statWhitelist) statWhitelist.textContent = appState.whitelist.length;
    if (nonFollowersBadge) nonFollowersBadge.textContent = appState.nonFollowers.length;

    if (countFilterAll) countFilterAll.textContent = appState.following.length;
    if (countFilterNon) countFilterNon.textContent = appState.nonFollowers.length;
    if (countFilterWhite) countFilterWhite.textContent = appState.whitelist.length;
  }

  function renderAccountsList() {
    if (!accountsListContainer) return;
    accountsListContainer.innerHTML = '';
    const whitelistSet = new Set(appState.whitelist.map(w => w.toLowerCase()));
    const nonFollowerSet = new Set(appState.nonFollowers.map(n => n.username.toLowerCase()));

    let filtered = appState.following;

    if (appState.activeFilter === 'nonfollowers') {
      filtered = appState.nonFollowers;
    } else if (appState.activeFilter === 'whitelisted') {
      filtered = appState.following.filter(u => whitelistSet.has(u.username.toLowerCase()));
    }

    if (appState.searchQuery.trim() !== '') {
      const q = appState.searchQuery.toLowerCase();
      filtered = filtered.filter(u => u.username.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      accountsListContainer.innerHTML = `
        <div class="empty-box">
          Tidak ada akun yang sesuai dengan kriteria.
        </div>
      `;
      return;
    }

    filtered.forEach(user => {
      const isNonFollower = nonFollowerSet.has(user.username.toLowerCase());
      const isWhitelisted = whitelistSet.has(user.username.toLowerCase());
      const isSelected = appState.selectedUsers.has(user.username);

      const row = document.createElement('div');
      row.className = 'account-row';

      const avatarSrc = user.avatarUrl || '../assets/icon48.png';

      row.innerHTML = `
        <div class="account-meta">
          <label class="checkbox-label">
            <input type="checkbox" class="user-checkbox" data-username="${user.username}" ${isSelected ? 'checked' : ''}>
          </label>
          <img src="${avatarSrc}" class="avatar" alt="${user.username}" onerror="this.src='../assets/icon48.png'">
          <div class="user-details">
            <span class="user-handle">@${user.username}</span>
            <span class="status-badge ${isWhitelisted ? 'whitelisted' : ''}">
              ${isWhitelisted ? '★ Whitelisted' : (isNonFollower ? '✕ Tak Follback' : '✓ Mutual')}
            </span>
          </div>
        </div>
        <div class="actions-inline">
          <button class="btn btn-secondary btn-xs btn-toggle-whitelist" data-username="${user.username}">
            ${isWhitelisted ? 'Batal White' : 'Whitelist'}
          </button>
          ${isNonFollower && !isWhitelisted ? `
            <button class="btn btn-danger btn-xs btn-single-unfollow" data-username="${user.username}">
              Unfollow
            </button>
          ` : ''}
        </div>
      `;

      accountsListContainer.appendChild(row);
    });

    // Attach Event Listeners
    accountsListContainer.querySelectorAll('.user-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const username = e.target.getAttribute('data-username');
        if (e.target.checked) appState.selectedUsers.add(username);
        else appState.selectedUsers.delete(username);
        if (selectedCount) selectedCount.textContent = appState.selectedUsers.size;
      });
    });

    accountsListContainer.querySelectorAll('.btn-toggle-whitelist').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = e.target.getAttribute('data-username');
        toggleWhitelist(username);
      });
    });

    accountsListContainer.querySelectorAll('.btn-single-unfollow').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = e.target.getAttribute('data-username');
        startSemiAuto([username]);
      });
    });
  }

  function toggleWhitelist(username) {
    chrome.runtime.sendMessage({ action: 'TOGGLE_WHITELIST', username }, (res) => {
      if (res && res.state) {
        appState = { ...appState, ...res.state };
        renderStats();
        renderAccountsList();
      }
    });
  }

  // --- SAFE MESSAGING WITH AUTO SCRIPT INJECTION ---
  function sendTabMessageWithAutoInject(tabId, messagePayload, onResponse) {
    chrome.tabs.sendMessage(tabId, messagePayload, (response) => {
      if (chrome.runtime.lastError) {
        console.log('[Popup] Content script not connected. Injecting content_script.js programmatically...');
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content/content_script.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('[Popup] Script injection error:', chrome.runtime.lastError.message);
            if (globalStatusMsg) globalStatusMsg.textContent = 'Gagal terhubung ke halaman web.';
            return;
          }
          // Retry message after programmatic injection
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, messagePayload, (retryRes) => {
              if (onResponse) onResponse(retryRes);
            });
          }, 300);
        });
      } else {
        if (onResponse) onResponse(response);
      }
    });
  }

  // --- ACTIONS ---
  if (btnStartScan) {
    btnStartScan.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        const activeTab = tabs[0];

        if (!activeTab.url || (!activeTab.url.includes('threads.com') && !activeTab.url.includes('threads.net') && !activeTab.url.includes('instagram.com'))) {
          alert('Silakan buka halaman profil Threads Anda (threads.com) terlebih dahulu.');
          return;
        }

        if (globalStatusMsg) globalStatusMsg.textContent = 'Merefresh halaman Threads...';

        // Reload tab to get clean page state
        chrome.tabs.reload(activeTab.id, {}, () => {
          // Listen for load completion
          const listener = (tabId, changeInfo) => {
            if (tabId === activeTab.id && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              if (globalStatusMsg) globalStatusMsg.textContent = 'Memulai pindaian Threads...';
              
              setTimeout(() => {
                sendTabMessageWithAutoInject(activeTab.id, { action: 'START_SCAN' }, (res) => {
                  if (res && res.status === 'STARTED') {
                    if (globalStatusMsg) globalStatusMsg.textContent = 'Pindaian berjalan di Threads...';
                  }
                });
              }, 1200);
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
        });
      });
    });
  }

  if (btnClearData) {
    btnClearData.addEventListener('click', () => {
      if (confirm('Reset seluruh data pindaian?')) {
        chrome.runtime.sendMessage({ action: 'CLEAR_DATA' }, (res) => {
          if (res && res.state) {
            appState = { ...appState, ...res.state };
            renderStats();
            renderAccountsList();
            if (globalStatusMsg) globalStatusMsg.textContent = 'Data direset.';
          }
        });
      }
    });
  }

  function triggerSemiAutoExecution() {
    let targetUsers = Array.from(appState.selectedUsers);
    if (targetUsers.length === 0) {
      const whitelistSet = new Set(appState.whitelist.map(w => w.toLowerCase()));
      targetUsers = appState.nonFollowers
        .map(u => u.username)
        .filter(u => !whitelistSet.has(u.toLowerCase()));
    }

    if (targetUsers.length === 0) {
      alert('Tidak ada akun non-follback yang perlu di-unfollow.');
      return;
    }

    const modeText = appState.settings.fastMode ? 'Mode Fast (Tanpa Jeda)' : `Jeda: ${appState.settings.minDelay}-${appState.settings.maxDelay}s`;
    if (confirm(`Jalankan unfollow semi-auto untuk seluruh ${targetUsers.length} akun?\n${modeText}`)) {
      startSemiAuto(targetUsers);
    }
  }

  if (btnStartSemiAuto) {
    btnStartSemiAuto.addEventListener('click', triggerSemiAutoExecution);
  }

  if (btnStartSemiAutoOverview) {
    btnStartSemiAutoOverview.addEventListener('click', triggerSemiAutoExecution);
  }

  function startSemiAuto(userList) {
    chrome.runtime.sendMessage({
      action: 'START_SEMI_AUTO_QUEUE',
      users: userList,
      settings: appState.settings
    }, (res) => {
      if (res && res.status === 'QUEUED') {
        if (globalStatusMsg) globalStatusMsg.textContent = `Proses semi-auto berjalan...`;
        updateQueueUI();
      }
    });
  }

  if (btnStopQueue) {
    btnStopQueue.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'STOP_QUEUE' }, () => {
        if (globalStatusMsg) globalStatusMsg.textContent = 'Proses dihentikan.';
        updateQueueUI();
      });
    });
  }

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      const newSettings = {
        minDelay: inputMinDelay ? parseInt(inputMinDelay.value) : 8,
        maxDelay: inputMaxDelay ? parseInt(inputMaxDelay.value) : 18,
        batchLimit: inputBatchLimit ? parseInt(inputBatchLimit.value) : 20,
        fastMode: toggleFastMode ? toggleFastMode.checked : false
      };

      chrome.runtime.sendMessage({ action: 'SAVE_SETTINGS', settings: newSettings }, (res) => {
        if (res && res.status === 'SAVED') {
          appState.settings = newSettings;
          if (globalStatusMsg) globalStatusMsg.textContent = 'Pengaturan disimpan.';
        }
      });
    });
  }

  // --- FILTERS & SEARCH ---
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value;
      renderAccountsList();
    });
  }

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      appState.activeFilter = chip.getAttribute('data-filter');
      renderAccountsList();
    });
  });

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const nonFollowerSet = new Set(appState.nonFollowers.map(n => n.username));
      const whitelistSet = new Set(appState.whitelist.map(w => w.toLowerCase()));

      appState.selectedUsers.clear();
      if (isChecked) {
        appState.following.forEach(u => {
          if (nonFollowerSet.has(u.username) && !whitelistSet.has(u.username.toLowerCase())) {
            appState.selectedUsers.add(u.username);
          }
        });
      }
      renderAccountsList();
      if (selectedCount) selectedCount.textContent = appState.selectedUsers.size;
    });
  }

  // --- RUNTIME LISTENERS ---
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'STATE_UPDATED') {
      appState = { ...appState, ...message.state };
      renderStats();
      renderAccountsList();
      updateQueueUI();
    } else if (message.action === 'QUEUE_PROGRESS') {
      appState.queue = message.queue;
      updateQueueUI();
    }
  });

  function updateQueueUI() {
    if (appState.queue && appState.queue.running) {
      if (queueStatusCard) queueStatusCard.classList.remove('hidden');
      const percent = appState.queue.total > 0 ? (appState.queue.processed / appState.queue.total) * 100 : 0;
      if (progressBarFill) progressBarFill.style.width = `${percent}%`;
      
      const currentText = appState.queue.currentUser ? `Unfollowing @${appState.queue.currentUser}` : 'Memproses antrean...';
      if (queueProgressText) queueProgressText.textContent = `${currentText} (${appState.queue.processed}/${appState.queue.total})`;
      
      if (queueDelayCountdown) {
        if (appState.settings.fastMode) {
          queueDelayCountdown.textContent = `Mode Fast`;
        } else {
          queueDelayCountdown.textContent = `Jeda: ${appState.queue.nextCountdown || '--'}s`;
        }
      }
    } else {
      if (queueStatusCard) queueStatusCard.classList.add('hidden');
    }
  }

  loadState();
});
