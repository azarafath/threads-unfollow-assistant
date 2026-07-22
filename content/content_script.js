// Threads Unfollow Guard - Content Script (100% Zero-Touch Automated Scanner & Semi-Auto Unfollow Engine)

(function () {
  if (window.hasUnfollowGuardInjected) {
    console.log('[Threads Unfollow] Content script active.');
    return;
  }
  window.hasUnfollowGuardInjected = true;

  console.log('%c🚀 [Threads Unfollow] Engine Ready on ' + window.location.href, 'color: #818cf8; font-weight: bold; font-size: 13px;');

  // Floating Toast Component
  let toastElement = null;

  function createToastOverlay() {
    if (document.getElementById('unfollow-guard-toast')) return;

    toastElement = document.createElement('div');
    toastElement.id = 'unfollow-guard-toast';
    toastElement.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(99, 102, 241, 0.5);
      color: #f8fafc;
      padding: 12px 18px;
      border-radius: 12px;
      font-family: 'Inter', sans-serif, system-ui;
      font-size: 13px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      gap: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    toastElement.innerHTML = `
      <div style="width: 10px; height: 10px; border-radius: 50%; background: #06b6d4; box-shadow: 0 0 10px #06b6d4;" id="toast-indicator"></div>
      <div>
        <div style="font-weight: 600; font-size: 12px; color: #818cf8;" id="toast-title">Threads Guard</div>
        <div style="font-size: 11px; color: #94a3b8;" id="toast-body">Siap...</div>
      </div>
    `;

    document.body.appendChild(toastElement);
  }

  function showToast(title, body, durationMs = 4000) {
    // Disabled web page toast overlay per user preference. Progress is rendered directly in Popup UI.
    console.log(`[Toast Notification] ${title}: ${body}`);
  }

  // --- RUNTIME MESSAGING ---
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_SCAN') {
      console.log('%c🔍 [Threads Guard] Scan Request Received', 'color: #06b6d4; font-weight: bold;');
      showToast('Mulai Pindaian Otomatis', 'Navigasi Profil -> Membuka Modal -> Auto Scrolling...', 0);

      runFullAutomatedScan().then((result) => {
        if (result.success) {
          const followerSet = new Set(result.followers.map(f => f.username.toLowerCase()));
          const nonFollowers = result.following.filter(f => !followerSet.has(f.username.toLowerCase()));

          console.log('%c🎉 [Threads Guard] FULL SCAN COMPLETED SUCCESSFULLY!', 'color: #10b981; font-weight: bold; font-size: 14px;');
          console.log(`📊 TOTAL FOLLOWERS : ${result.followers.length}`);
          console.log(`📊 TOTAL FOLLOWING : ${result.following.length}`);
          console.log(`❌ TAK FOLLBACK (${nonFollowers.length}) :`, nonFollowers.map(n => `@${n.username}`));

          showToast('Scan Selesai!', `Followers: ${result.followers.length} | Following: ${result.following.length} | Tak Follback: ${nonFollowers.length}`, 7000);
          
          chrome.runtime.sendMessage({
            action: 'UPDATE_SCAN_RESULTS',
            following: result.following,
            followers: result.followers
          });
        } else {
          console.warn('⚠️ [Threads Guard] Scan canceled/failed:', result.message);
          showToast('Pindaian Dibatalkan', result.message || 'Tidak dapat menemukan elemen followers.', 5000);
        }
      });
      sendResponse({ status: 'STARTED' });
    } else if (message.action === 'PERFORM_SINGLE_UNFOLLOW') {
      const username = message.username;
      console.log(`%c⚡ [Threads Guard] Executing Semi-Auto Unfollow for @${username}`, 'color: #3b82f6; font-weight: bold;');
      showToast('Semi-Auto Action', `Mencari & Unfollowing Threads @${username}...`, 0);

      performHumanizedThreadsUnfollow(username).then((success) => {
        if (success) {
          console.log(`%c✅ [Threads Guard] Successfully unfollowed @${username}`, 'color: #10b981; font-weight: bold;');
          showToast('Tindakan Sukses', `Berhasil unfollow @${username}.`, 3000);
          sendResponse({ success: true, username });
        } else {
          console.warn(`%c❌ [Threads Guard] Could not unfollow @${username} (Not visible in modal)`, 'color: #ef4444; font-weight: bold;');
          showToast('Perhatian', `Tidak dapat menemukan tombol unfollow untuk @${username}.`, 4000);
          sendResponse({ success: false, username });
        }
      });
      return true;
    } else if (message.action === 'SHOW_TOAST') {
      showToast(message.title, message.body, message.duration || 3000);
      sendResponse({ status: 'OK' });
    }
  });

  // --- AUTOMATIC PROFILE NAVIGATION ---
  async function ensureOnProfilePage() {
    const currentUrl = window.location.href.toLowerCase();
    const isAlreadyOnProfile = currentUrl.includes('/@') || currentUrl.includes('/profile') || !!document.querySelector('a[href*="followers"]');

    if (isAlreadyOnProfile) {
      console.log('✅ [Threads Guard] Already on Profile page.');
      return true;
    }

    console.log('👉 [Threads Guard] Navigating to Profile page automatically...');
    showToast('Auto Navigation', 'Membuka halaman Profil Threads Anda...', 2500);

    const allLinks = Array.from(document.querySelectorAll('a, div[role="button"], button'));
    const profileBtn = allLinks.find(el => {
      const href = (el.getAttribute('href') || '').toLowerCase();
      const txt = (el.innerText || '').toLowerCase().trim();
      return href.includes('/profile') || txt === 'profile' || txt === 'profil' || href.includes('/@');
    });

    if (profileBtn) {
      const clickEl = profileBtn.closest('a, div[role="button"], button') || profileBtn;
      clickEl.click();
      await sleep(1500);
      return true;
    }

    const fallbackLink = document.querySelector('a[href*="/profile"], a[href*="/@"]');
    if (fallbackLink) {
      fallbackLink.click();
      await sleep(1500);
      return true;
    }

    return false;
  }

  // --- FULL AUTOMATED SCANNING WORKFLOW ---
  async function runFullAutomatedScan() {
    await ensureOnProfilePage();

    let dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) {
      console.log('👉 [Threads Guard] Opening Followers modal from profile...');
      showToast('Auto Open Modal', 'Mencari tombol Followers di profil Threads...', 2500);
      const opened = findAndClickFollowersButton();
      if (opened) {
        await sleep(1500);
      } else {
        return {
          success: false,
          message: 'Buka halaman Threads lalu coba klik Pindai kembali.'
        };
      }
    }

    dialog = document.querySelector('div[role="dialog"]') || document.body;

    // 1. Scan Followers Tab
    console.log('%c👥 [Threads Guard] STEP 1/2: Scanning Followers Tab...', 'color: #6366f1; font-weight: bold;');
    showToast('Scan [1/2]', 'Memindai Followers (Auto Scrolling)...', 0);
    await switchToModalTab('followers');
    const followers = await scrollAndHarvestItems('Followers');
    console.log(`✅ [Threads Guard] Harvested ${followers.length} Followers.`);

    // 2. Switch to Following Tab Header
    console.log('%c🔄 [Threads Guard] STEP 2/2: Switching to Following Tab Header...', 'color: #6366f1; font-weight: bold;');
    showToast('Scan [2/2]', 'Memilih Tab Following & Auto Scrolling...', 0);
    const switched = await switchToModalTab('following');
    if (!switched) {
      console.warn('⚠️ [Threads Guard] Could not switch to Following tab header.');
    }
    await sleep(1000);

    const following = await scrollAndHarvestItems('Following');
    console.log(`✅ [Threads Guard] Harvested ${following.length} Following.`);

    return {
      success: true,
      followers,
      following
    };
  }

  // --- FIND & CLICK FOLLOWERS BUTTON ON PROFILE HEADER ---
  function findAndClickFollowersButton() {
    const dialog = document.querySelector('div[role="dialog"]');
    if (dialog) return true;

    const buttons = Array.from(document.querySelectorAll('div[role="button"], a, button, span'));
    
    const target = buttons.find(el => {
      const txt = (el.innerText || '').toLowerCase().trim();
      return (txt.includes('followers') || txt.includes('pengikut')) && txt.length < 40;
    });

    if (target) {
      console.log('[Threads Guard] Target followers button clicked:', target);
      const clickEl = target.closest('div[role="button"], a, button') || target;
      clickEl.click();
      return true;
    }

    const linkEl = document.querySelector('a[href*="followers"]');
    if (linkEl) {
      linkEl.click();
      return true;
    }

    return false;
  }

  // --- SWITCH TABS SPECIFICALLY IN MODAL HEADER ---
  async function switchToModalTab(tabKeyword) {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return false;

    const dialogRect = dialog.getBoundingClientRect();

    const headerCandidates = Array.from(dialog.querySelectorAll('div[role="tab"], button, div[role="button"], a, span, div')).filter(el => {
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - dialogRect.top;
      return relativeTop >= 0 && relativeTop < 120;
    });

    const targetTab = headerCandidates.find(el => {
      const txt = (el.innerText || '').toLowerCase().trim();
      return (txt.startsWith(tabKeyword) || txt.includes(tabKeyword)) && !txt.includes('\n');
    }) || headerCandidates.find(el => {
      const txt = (el.innerText || '').toLowerCase().trim();
      return (txt.startsWith(tabKeyword) || txt.includes(tabKeyword));
    });

    if (targetTab) {
      console.log(`[Threads Guard] Switching modal header tab for "${tabKeyword}":`, targetTab);
      const clickEl = targetTab.closest('div[role="tab"], button, div[role="button"]') || targetTab;
      clickEl.click();
      await sleep(1200);
      return true;
    }

    return false;
  }

  // Find exact scrollable container inside modal dialog
  function getModalScrollContainer(dialog) {
    if (!dialog) return null;
    const allDivs = Array.from(dialog.querySelectorAll('div'));
    
    const scrollable = allDivs.find(d => {
      const style = window.getComputedStyle(d);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto') && d.scrollHeight > d.clientHeight;
    });

    if (scrollable) return scrollable;

    let maxScrollDiv = null;
    let maxScroll = 0;
    allDivs.forEach(d => {
      if (d.clientHeight > 80 && d.scrollHeight > d.clientHeight && d.scrollHeight > maxScroll) {
        maxScroll = d.scrollHeight;
        maxScrollDiv = d;
      }
    });

    return maxScrollDiv || dialog;
  }

  // Robust Auto-Scroll & Item Harvester
  async function scrollAndHarvestItems(tabName = 'Items') {
    const dialog = document.querySelector('div[role="dialog"]') || document.body;
    const scrollContainer = getModalScrollContainer(dialog);

    const list = [];
    const seen = new Set();
    let noNewAttempts = 0;
    const maxScrolls = 100;

    console.log(`📜 [Threads Guard] Starting continuous scroll for ${tabName}...`);

    for (let scrollIdx = 1; scrollIdx <= maxScrolls; scrollIdx++) {
      let addedInScroll = 0;

      const userLinks = Array.from(dialog.querySelectorAll('a[href*="/@"]'));
      userLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        const match = href.match(/\/@([a-zA-Z0-9_.]+)/);
        if (match && match[1]) {
          const handle = match[1];
          if (!seen.has(handle.toLowerCase())) {
            seen.add(handle.toLowerCase());
            addedInScroll++;
            const parentRow = link.closest('[data-pressable-container="true"], div[role="button"], div[style*="flex"], div') || link;
            const img = parentRow.querySelector('img');
            const avatarUrl = img ? img.src : '';
            list.push({ username: handle, avatarUrl });
          }
        }
      });

      const textRows = Array.from(dialog.querySelectorAll('[data-pressable-container="true"], div[role="button"], div[style*="flex"]'));
      textRows.forEach(row => {
        const txt = row.innerText || '';
        const match = txt.match(/@([a-zA-Z0-9_.]+)/);
        if (match && match[1]) {
          const handle = match[1];
          if (!seen.has(handle.toLowerCase())) {
            seen.add(handle.toLowerCase());
            addedInScroll++;
            const img = row.querySelector('img');
            const avatarUrl = img ? img.src : '';
            list.push({ username: handle, avatarUrl });
          }
        }
      });

      if (addedInScroll > 0) {
        console.log(`➡️ [Threads Guard] ${tabName} Scroll #${scrollIdx}: +${addedInScroll} new accounts (Total: ${list.length})`);
        noNewAttempts = 0;
      } else {
        noNewAttempts++;
        console.log(`⏳ [Threads Guard] ${tabName} Scroll #${scrollIdx}: Waiting network fetch... (${noNewAttempts}/6)`);
        if (noNewAttempts >= 6) {
          console.log(`✅ [Threads Guard] ${tabName} scan complete! All ${list.length} accounts harvested.`);
          break;
        }
      }

      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        scrollContainer.dispatchEvent(new Event('scroll', { bubbles: true }));
      } else {
        window.scrollTo(0, document.body.scrollHeight);
      }
      
      await sleep(1000);
    }

    return list;
  }

  // --- SMART UNFOLLOW ENGINE WITH MODAL AUTO-SCROLL SEARCH ---
  async function performHumanizedThreadsUnfollow(username) {
    const targetHandle = username.toLowerCase().replace('@', '');
    console.log(`%c⚡ [Threads Guard] Locating Following button for @${targetHandle}...`, 'color: #06b6d4; font-weight: bold;');

    // 1. Ensure modal is open on Following tab
    let dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) {
      console.log('👉 [Threads Guard] Opening modal for unfollow operation...');
      findAndClickFollowersButton();
      await sleep(1200);
      dialog = document.querySelector('div[role="dialog"]');
    }

    if (dialog) {
      // Ensure Following tab header is active
      await switchToModalTab('following');
    }

    const modalDialog = document.querySelector('div[role="dialog"]') || document.body;
    const scrollContainer = getModalScrollContainer(modalDialog);

    let targetButton = null;

    // 2. Scroll-Search Loop: Scroll modal down until @targetHandle element is visible in DOM
    for (let scrollStep = 0; scrollStep < 40; scrollStep++) {
      // Strategy A: Match link element
      const userLink = modalDialog.querySelector(`a[href*="/@${targetHandle}"]`);
      if (userLink) {
        const parentRow = userLink.closest('[data-pressable-container="true"]') || userLink.closest('div[style*="flex"]') || userLink.closest('div');
        if (parentRow) {
          targetButton = Array.from(parentRow.querySelectorAll('div[role="button"], button')).find(b => {
            const txt = (b.innerText || '').trim().toLowerCase();
            return txt === 'following' || txt === 'mengikuti';
          });
        }
      }

      // Strategy B: Match text in pressable container
      if (!targetButton) {
        const allRows = Array.from(modalDialog.querySelectorAll('[data-pressable-container="true"], div'));
        const matchingRow = allRows.find(row => {
          const txt = (row.innerText || '').toLowerCase();
          return txt.includes(`@${targetHandle}`) || txt.includes(targetHandle);
        });
        if (matchingRow) {
          targetButton = Array.from(matchingRow.querySelectorAll('div[role="button"], button')).find(b => {
            const txt = (b.innerText || '').trim().toLowerCase();
            return txt === 'following' || txt === 'mengikuti';
          });
        }
      }

      if (targetButton) {
        console.log(`✅ [Threads Guard] Found Following button for @${targetHandle} at scroll step #${scrollStep}!`, targetButton);
        break;
      }

      // If not found yet, scroll container down to load next batch
      console.log(`📜 [Threads Guard] Scrolling modal down to locate @${targetHandle} (Step #${scrollStep + 1})...`);
      if (scrollContainer) {
        scrollContainer.scrollTop += 450;
        scrollContainer.dispatchEvent(new Event('scroll', { bubbles: true }));
      } else {
        window.scrollBy(0, 450);
      }
      await sleep(350);
    }

    if (!targetButton) {
      console.warn(`❌ [Threads Guard] Failed to locate Following button for @${targetHandle} after scrolling modal.`);
      return false;
    }

    // 3. Scroll element into view smoothly
    targetButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(400 + Math.random() * 300);

    // 4. Click Following button
    console.log(`👆 [Threads Guard] Clicking Following button for @${targetHandle}...`);
    simulateHumanClick(targetButton);
    await sleep(800 + Math.random() * 400);

    // 5. Confirm in Threads modal dialog (Unfollow / Batal Mengikuti)
    const confirmBtn = await waitForThreadsConfirmButton();
    if (confirmBtn) {
      console.log('🔴 [Threads Guard] Clicking confirmation modal button:', confirmBtn);
      await sleep(300 + Math.random() * 300);
      simulateHumanClick(confirmBtn);
      await sleep(600);
      console.log(`%c🎉 [Threads Guard] Successfully unfollowed @${targetHandle}`, 'color: #10b981; font-weight: bold;');
    } else {
      console.log(`ℹ️ [Threads Guard] Unfollow triggered for @${targetHandle}`);
    }

    return true;
  }

  function simulateHumanClick(element) {
    const opts = { bubbles: true, cancelable: true, view: window };
    element.dispatchEvent(new MouseEvent('pointerover', opts));
    element.dispatchEvent(new MouseEvent('mouseover', opts));
    element.dispatchEvent(new MouseEvent('pointerdown', opts));
    element.dispatchEvent(new MouseEvent('mousedown', opts));
    element.focus();
    element.dispatchEvent(new MouseEvent('pointerup', opts));
    element.dispatchEvent(new MouseEvent('mouseup', opts));
    element.click();
  }

  async function waitForThreadsConfirmButton() {
    let elapsed = 0;
    while (elapsed < 2500) {
      const allBtns = Array.from(document.querySelectorAll('div[role="dialog"] div[role="button"], div[role="dialog"] button, div[role="button"], button'));
      const confirmBtn = allBtns.find(b => {
        const txt = (b.innerText || '').trim().toLowerCase();
        return txt === 'unfollow' || txt === 'batal mengikuti' || txt === 'berhenti mengikuti' || txt.includes('unfollow');
      });
      if (confirmBtn) return confirmBtn;
      await sleep(200);
      elapsed += 200;
    }
    return null;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
})();
