/**
 * Floating PiP Button (Vivaldi Style)
 * Renders an unobtrusive floating button over HTML5 videos on hover.
 */

import { togglePiP } from './pip-controller.js';
import { STORAGE_KEYS, FLOATING_BUTTON_POSITIONS } from '../constants/extension.js';

let overlayHost = null;
let shadowRoot = null;
let activeVideo = null;
let hideTimeout = null;
let isEnabled = true;
let buttonPosition = FLOATING_BUTTON_POSITIONS.TOP_CENTER;

export function initFloatingOverlay(settings = {}) {
  if (settings[STORAGE_KEYS.SHOW_FLOATING_BUTTON] !== undefined) {
    isEnabled = Boolean(settings[STORAGE_KEYS.SHOW_FLOATING_BUTTON]);
  }
  if (settings[STORAGE_KEYS.FLOATING_BUTTON_POSITION]) {
    buttonPosition = settings[STORAGE_KEYS.FLOATING_BUTTON_POSITION];
  }

  if (overlayHost) {
    if (!isEnabled) {
      hideOverlay();
    }
    return;
  }

  // Create isolated Shadow DOM host to prevent page CSS contamination
  overlayHost = document.createElement('div');
  overlayHost.id = 'floatview-overlay-host';
  overlayHost.style.position = 'absolute';
  overlayHost.style.top = '0';
  overlayHost.style.left = '0';
  overlayHost.style.width = '100%';
  overlayHost.style.height = '100%';
  overlayHost.style.pointerEvents = 'none';
  overlayHost.style.zIndex = '2147483647'; // Max z-index

  shadowRoot = overlayHost.attachShadow({ mode: 'open' });

  // Styles inside shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    .fv-pip-btn {
      position: fixed;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 9999px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.02em;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      transform: translateY(-4px) scale(0.95);
      user-select: none;
      z-index: 2147483647;
    }
    .fv-pip-btn.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .fv-pip-btn:hover {
      background: rgba(239, 57, 57, 0.95);
      border-color: rgba(255, 255, 255, 0.4);
      box-shadow: 0 6px 20px rgba(239, 57, 57, 0.4);
      transform: translateY(-1px) scale(1.02);
    }
    .fv-pip-btn.in-pip {
      background: rgba(239, 57, 57, 0.9);
    }
    .fv-pip-btn svg {
      width: 15px;
      height: 15px;
      stroke: currentColor;
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      flex-shrink: 0;
    }
  `;

  const btn = document.createElement('button');
  btn.className = 'fv-pip-btn';
  btn.setAttribute('type', 'button');
  btn.setAttribute('title', 'FloatView: Picture-in-Picture (Alt+Shift+P)');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      <rect x="12" y="10" width="8" height="8" rx="1" fill="currentColor" fill-opacity="0.3"></rect>
    </svg>
    <span class="btn-text">Float View</span>
  `;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeVideo) {
      try {
        await togglePiP(activeVideo);
        updateButtonState();
      } catch (err) {
        console.error('[FloatView Overlay] Error toggling PiP:', err);
      }
    }
  });

  btn.addEventListener('mouseenter', () => {
    if (hideTimeout) clearTimeout(hideTimeout);
  });

  btn.addEventListener('mouseleave', () => {
    scheduleHide(1200);
  });

  shadowRoot.appendChild(style);
  shadowRoot.appendChild(btn);
  document.documentElement.appendChild(overlayHost);

  // Global mousemove tracker for videos
  document.addEventListener('mousemove', handleDocumentMouseMove, { passive: true });
}

function handleDocumentMouseMove(e) {
  if (!isEnabled) return;

  const target = document.elementFromPoint(e.clientX, e.clientY);
  if (!target) return;

  let video = null;
  if (target instanceof HTMLVideoElement) {
    video = target;
  } else {
    // Check if target is inside a video container or overlay
    video = target.querySelector('video') || target.closest('div, section, article')?.querySelector('video');
  }

  if (video && isElementUsable(video)) {
    activeVideo = video;
    showOverlayForVideo(video);
  } else if (activeVideo) {
    scheduleHide(800);
  }
}

function isElementUsable(video) {
  const rect = video.getBoundingClientRect();
  return rect.width >= 160 && rect.height >= 90;
}

function showOverlayForVideo(video) {
  if (!shadowRoot || !isEnabled) return;
  const btn = shadowRoot.querySelector('.fv-pip-btn');
  if (!btn) return;

  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  const rect = video.getBoundingClientRect();
  if (rect.width < 100 || rect.height < 60) return;

  const inPip = document.pictureInPictureElement === video;
  const textSpan = btn.querySelector('.btn-text');
  if (textSpan) {
    textSpan.textContent = inPip ? 'Exit PiP' : 'Float View';
  }
  if (inPip) {
    btn.classList.add('in-pip');
  } else {
    btn.classList.remove('in-pip');
  }

  // Calculate position based on buttonPosition setting
  const top = Math.max(10, rect.top + 12);
  let left = rect.left + rect.width / 2;

  if (buttonPosition === FLOATING_BUTTON_POSITIONS.TOP_RIGHT) {
    left = rect.right - 90;
  } else if (buttonPosition === FLOATING_BUTTON_POSITIONS.TOP_LEFT) {
    left = rect.left + 90;
  }

  btn.style.top = `${top}px`;
  btn.style.left = `${left}px`;
  btn.style.transform = 'translate(-50%, 0)';
  btn.classList.add('visible');

  scheduleHide(3000);
}

function scheduleHide(delayMs = 1500) {
  if (hideTimeout) clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    hideOverlay();
  }, delayMs);
}

function hideOverlay() {
  if (!shadowRoot) return;
  const btn = shadowRoot.querySelector('.fv-pip-btn');
  if (btn) {
    btn.classList.remove('visible');
  }
}

function updateButtonState() {
  if (!shadowRoot || !activeVideo) return;
  const btn = shadowRoot.querySelector('.fv-pip-btn');
  if (!btn) return;
  const inPip = document.pictureInPictureElement === activeVideo;
  const textSpan = btn.querySelector('.btn-text');
  if (textSpan) {
    textSpan.textContent = inPip ? 'Exit PiP' : 'Float View';
  }
  if (inPip) {
    btn.classList.add('in-pip');
  } else {
    btn.classList.remove('in-pip');
  }
}

