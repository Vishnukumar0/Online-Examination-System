/* ── AI Proctoring & Lockdown Security Controller ─────────── */
const AntiCheatSecurity = (() => {
  let active = false;
  let violationCount = 0;
  let onViolationCallback = null;

  function enableLockdown(onViolation) {
    active = true;
    violationCount = 0;
    onViolationCallback = onViolation;

    document.addEventListener('copy', blockEvent);
    document.addEventListener('cut', blockEvent);
    document.addEventListener('paste', blockEvent);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyShortcuts);

    // Request Fullscreen
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}

    showToast('🛡️ Proctored Security Active: Fullscreen & Copy-Paste Disabled', 'info');
  }

  function disableLockdown() {
    active = false;
    document.removeEventListener('copy', blockEvent);
    document.removeEventListener('cut', blockEvent);
    document.removeEventListener('paste', blockEvent);
    document.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('keydown', handleKeyShortcuts);

    // Exit Fullscreen
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {}
  }

  function blockEvent(e) {
    if (!active) return;
    e.preventDefault();
    triggerViolation('Copy/Paste action intercepted and blocked.');
  }

  function handleContextMenu(e) {
    if (!active) return;
    // Allow context menu only if targeting an exam option for elimination
    if (!e.target.closest('.exam-option-card')) {
      e.preventDefault();
      triggerViolation('Right-click context menu disabled during exam.');
    }
  }

  function handleKeyShortcuts(e) {
    if (!active) return;
    // Intercept F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+C, Ctrl+V
    const isInspect = e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      (e.ctrlKey && (e.key === 'u' || e.key === 'U'));

    if (isInspect) {
      e.preventDefault();
      triggerViolation('Developer inspect shortcuts are strictly prohibited.');
    }
  }

  function triggerViolation(reason) {
    violationCount++;
    SoundFX.playWrong();
    showToast(`⚠ Security Violation #${violationCount}: ${reason}`, 'warning');
    if (onViolationCallback) {
      onViolationCallback(violationCount, reason);
    }
  }

  function getViolationCount() {
    return violationCount;
  }

  return { enableLockdown, disableLockdown, getViolationCount, triggerViolation };
})();
