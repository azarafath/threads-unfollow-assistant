// Threads Unfollow Assistant - Content Script (100% Zero-Touch Automated Scanner Engine)

(function () {
  if (window.hasUnfollowGuardInjected) {
    console.log('[Threads Unfollow] Content script active.');
    return;
  }
  window.hasUnfollowGuardInjected = true;

  console.log('%c🚀 [Threads Unfollow] Engine Ready on ' + window.location.href, 'color: #818cf8; font-weight: bold; font-size: 13px;');

  function showToast(title, body, durationMs = 4000) {
    console.log(`[Toast Notification] ${title}: ${body}`);
  }

  // --- RUNTIME MESSAGING ---
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_SCAN') {
      console.log('%c🔍 [Threads Unfollow] Scan Request Received', 'color: #06b6d4; font-weight: bold;');
      showToast('Mulai Pindaian Otomatis', 'Navigasi Profil -> Membuka Modal -> Auto Scrolling...', 0);

      runFullAutomatedScan().then((result) => {
        if (result.success) {
          const followerSet = new Set(result.followers.map(f => f.username.toLowerCase()));
          const nonFollowers = result.following.filter(f => !followerSet.has(f.username.toLowerCase()));

          console.log('%c🎉 [Threads Unfollow] FULL SCAN COMPLETED SUCCESSFULLY!', 'color: #10b981; font-weight: bold; font-size: 14px;');
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
          console.warn('⚠️ [Threads Unfollow] Scan canceled/failed:', result.message);
          showToast('Pindaian Dibatalkan', result.message || 'Tidak dapat menemukan elemen followers.', 5000);
        }
      });
      sendResponse({ status: 'STARTED' });
    } else if (message.action === 'PERFORM_SINGLE_UNFOLLOW') {
      const username = message.username;
      console.log(`%c⚡ [Threads Unfollow] Executing Semi-Auto Unfollow for @${username}`, 'color: #3b82f6; font-weight: bold;');

      performHumanizedThreadsUnfollow(username).then((success) => {
        if (success) {
          console.log(`%c✅ [Threads Unfollow] Successfully unfollowed @${username}`, 'color: #10b981; font-weight: bold;');
          sendResponse({ success: true, username });
        } else {
          console.warn(`%c❌ [Threads Unfollow] Could not unfollow @${username} (Not visible in modal)`, 'color: #ef4444; font-weight: bold;');
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
      console.log('✅ [Threads Unfollow] Already on Profile page.');
      return true;
    }

    console.log('👉 [Threads Unfollow] Navigating to Profile page automatically...');

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
      console.log('👉 [Threads Unfollow] Opening Followers modal from profile...');
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

    // 1. Scan Followers Tab (Pengikut / Followers)
    console.log('%c👥 [Threads Unfollow] STEP 1/2: Scanning Followers Tab (Pengikut)...', 'color: #6366f1; font-weight: bold;');
    await switchToModalTab('followers');
    const followers = await scrollAndHarvestItems('Followers');
    console.log(`✅ [Threads Unfollow] Harvested ${followers.length} Followers.`);

    // 2. Switch to Following Tab Header (Mengikuti / Following)
    console.log('%c🔄 [Threads Unfollow] STEP 2/2: Switching to Following Tab Header (Mengikuti)...', 'color: #6366f1; font-weight: bold;');
    const switched = await switchToModalTab('following');
    if (!switched) {
      console.warn('⚠️ [Threads Unfollow] Could not switch to Following/Mengikuti tab header.');
    }
    await sleep(1500);

    const following = await scrollAndHarvestItems('Following');
    console.log(`✅ [Threads Unfollow] Harvested ${following.length} Following.`);

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
      console.log('[Threads Unfollow] Target followers/pengikut button clicked:', target);
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

  // --- SWITCH TABS SPECIFICALLY IN MODAL HEADER (Bilingual Support: English & Indonesian) ---
  async function switchToModalTab(tabKeyword) {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return false;

    const dialogRect = dialog.getBoundingClientRect();

    // Target elements inside modal top header area (relativeTop < 120px)
    const headerCandidates = Array.from(dialog.querySelectorAll('div[role="tab"], button, div[role="button"], a, span, div')).filter(el => {
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - dialogRect.top;
      return relativeTop >= 0 && relativeTop < 120;
    });

    // Bilingual Keyword Matching
    const keywords = tabKeyword === 'following' ? ['following', 'mengikuti'] : ['followers', 'pengikut'];

    const targetTab = headerCandidates.find(el => {
      const txt = (el.innerText || '').toLowerCase().trim();
      return keywords.some(k => txt.startsWith(k) || txt.includes(k)) && !txt.includes('\n');
    }) || headerCandidates.find(el => {
      const txt = (el.innerText || '').toLowerCase().trim();
      return keywords.some(k => txt.startsWith(k) || txt.includes(k));
    });

    if (targetTab) {
      console.log(`[Threads Unfollow] Switching modal header tab for "${tabKeyword}" (Found: "${targetTab.innerText.trim()}"):`, targetTab);
      const clickEl = targetTab.closest('div[role="tab"], button, div[role="button"]') || targetTab;
      clickEl.click();
      await sleep(1500); // Wait for DOM list replacement
      return true;
    }

    console.warn(`⚠️ [Threads Unfollow] Could not locate tab header for "${tabKeyword}" (Tried keywords: ${keywords.join(', ')})`);
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
    const maxScrolls = 200; // Increased to 200 for large accounts with 500+ following

    console.log(`📜 [Threads Unfollow] Starting continuous scroll for ${tabName}...`);

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
        console.log(`➡️ [Threads Unfollow] ${tabName} Scroll #${scrollIdx}: +${addedInScroll} new accounts (Total: ${list.length})`);
        noNewAttempts = 0;
      } else {
        noNewAttempts++;
        console.log(`⏳ [Threads Unfollow] ${tabName} Scroll #${scrollIdx}: Waiting network fetch... (${noNewAttempts}/6)`);
        if (noNewAttempts >= 6) {
          console.log(`✅ [Threads Unfollow] ${tabName} scan complete! All ${list.length} accounts harvested.`);
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
    console.log(`%c⚡ [Threads Unfollow] Locating Following button for @${targetHandle}...`, 'color: #06b6d4; font-weight: bold;');

    let dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) {
      console.log('👉 [Threads Unfollow] Opening modal for unfollow operation...');
      findAndClickFollowersButton();
      await sleep(1200);
      dialog = document.querySelector('div[role="dialog"]');
    }

    if (dialog) {
      await switchToModalTab('following');
    }

    const modalDialog = document.querySelector('div[role="dialog"]') || document.body;
    const scrollContainer = getModalScrollContainer(modalDialog);

    let targetButton = null;

    for (let scrollStep = 0; scrollStep < 50; scrollStep++) {
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
        console.log(`✅ [Threads Unfollow] Found Following/Mengikuti button for @${targetHandle} at scroll step #${scrollStep}!`, targetButton);
        break;
      }

      console.log(`📜 [Threads Unfollow] Scrolling modal down to locate @${targetHandle} (Step #${scrollStep + 1})...`);
      if (scrollContainer) {
        scrollContainer.scrollTop += 450;
        scrollContainer.dispatchEvent(new Event('scroll', { bubbles: true }));
      } else {
        window.scrollBy(0, 450);
      }
      await sleep(350);
    }

    if (!targetButton) {
      console.warn(`❌ [Threads Unfollow] Failed to locate Following button for @${targetHandle} after scrolling modal.`);
      return false;
    }

    targetButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(400 + Math.random() * 300);

    console.log(`👆 [Threads Unfollow] Clicking Following/Mengikuti button for @${targetHandle}...`);
    simulateHumanClick(targetButton);
    await sleep(800 + Math.random() * 400);

    const confirmBtn = await waitForThreadsConfirmButton();
    if (confirmBtn) {
      console.log('🔴 [Threads Unfollow] Clicking confirmation modal button:', confirmBtn);
      await sleep(300 + Math.random() * 300);
      simulateHumanClick(confirmBtn);
      await sleep(600);
      console.log(`%c🎉 [Threads Unfollow] Successfully unfollowed @${targetHandle}`, 'color: #10b981; font-weight: bold;');
    } else {
      console.log(`ℹ️ [Threads Unfollow] Unfollow triggered for @${targetHandle}`);
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
