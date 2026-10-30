/* ── Offline Mode & Auto-Sync Controller ─────────────────────── */
const OfflineManager = (() => {
  const STORAGE_KEY = 'qm_offline_sync_queue';
  let isOnline = navigator.onLine;

  function init() {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    updateBanner();
    syncPendingQueue();

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }

  function handleOnline() {
    isOnline = true;
    updateBanner();
    showToast('🌐 Network connection restored. Syncing offline data…', 'success');
    syncPendingQueue();
  }

  function handleOffline() {
    isOnline = false;
    updateBanner();
    showToast('⚠ Offline Mode Active: Quizzes & progress saved locally.', 'warning');
  }

  function updateBanner() {
    let banner = document.getElementById('offline-status-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'offline-status-banner';
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;height:28px;background:var(--amber);color:#000;font-size:0.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;z-index:99999;transition:transform 0.3s ease;';
      banner.innerHTML = '⚡ OFFLINE MODE ACTIVE — All responses are stored locally and will auto-sync upon reconnection.';
      document.body.appendChild(banner);
    }

    banner.style.transform = isOnline ? 'translateY(-100%)' : 'translateY(0)';
  }

  function queueSubmission(quizId, payload) {
    const queue = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    queue.push({
      quizId,
      payload,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    showToast('📦 Submission queued offline. Will sync automatically.', 'info');
  }

  async function syncPendingQueue() {
    if (!navigator.onLine) return;
    const queue = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (queue.length === 0) return;

    const remaining = [];
    for (const item of queue) {
      try {
        await API.post(`/quizzes/${item.quizId}/submit`, item.payload);
      } catch {
        remaining.push(item);
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    if (queue.length > remaining.length) {
      showToast(`✓ Synced ${queue.length - remaining.length} offline submission(s) to server!`, 'success');
    }
  }

  function getIsOnline() {
    return isOnline;
  }

  return { init, getIsOnline, queueSubmission, syncPendingQueue };
})();
