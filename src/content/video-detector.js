/**
 * Video Detector
 * Discovers HTML5 <video> elements in the page, tracks their status,
 * and maintains unique stable IDs for messaging.
 */

let videoCounter = 0;
const videoMap = new Map(); // id -> HTMLVideoElement
const elementToIdMap = new WeakMap(); // HTMLVideoElement -> id

/**
 * Assign or retrieve stable FloatView ID for a video element
 * @param {HTMLVideoElement} video
 * @returns {string}
 */
export function getOrCreateVideoId(video) {
  let id = elementToIdMap.get(video);
  if (!id) {
    videoCounter++;
    id = `fv-vid-${Date.now()}-${videoCounter}`;
    elementToIdMap.set(video, id);
    video.dataset.floatviewId = id;
  }
  videoMap.set(id, video);
  return id;
}

/**
 * Extract human-readable title for a video element
 * @param {HTMLVideoElement} video
 * @returns {string}
 */
function extractVideoTitle(video, index) {
  if (video.title) return video.title.trim();
  if (video.getAttribute('aria-label')) return video.getAttribute('aria-label').trim();

  // Check parent or nearby headings
  const container = video.closest('article, section, [class*="player"], [id*="player"]') || video.parentElement;
  if (container) {
    const heading = container.querySelector('h1, h2, h3, [class*="title"]');
    if (heading && heading.textContent.trim().length > 2) {
      return heading.textContent.trim().slice(0, 80);
    }
  }

  // Fallback to document title or source name
  if (document.title && document.title.length > 0) {
    return `${document.title.slice(0, 50)} (Video #${index + 1})`;
  }

  return `Video #${index + 1}`;
}

/**
 * Scan DOM for all video elements
 * @returns {HTMLVideoElement[]}
 */
export function scanForVideos() {
  const elements = Array.from(document.querySelectorAll('video'));
  
  // Clean up references to removed videos
  for (const [id, el] of videoMap.entries()) {
    if (!document.contains(el)) {
      videoMap.delete(id);
    }
  }

  // Register all discovered elements
  elements.forEach((v) => {
    getOrCreateVideoId(v);
  });

  return elements;
}

/**
 * Convert HTMLVideoElement to serializable data object
 * @param {HTMLVideoElement} video
 * @param {number} index
 * @returns {Object}
 */
export function serializeVideo(video, index = 0) {
  const id = getOrCreateVideoId(video);
  const isPiP = document.pictureInPictureElement === video;
  const isPipEnabled = document.pictureInPictureEnabled && !video.disablePictureInPicture;

  let posterUrl = video.poster || '';
  // If YouTube or similar has video poster, use it, else empty
  const rect = video.getBoundingClientRect();

  return {
    id,
    index,
    title: extractVideoTitle(video, index),
    src: video.currentSrc || video.src || '',
    poster: posterUrl,
    duration: Number.isFinite(video.duration) ? Math.round(video.duration) : 0,
    currentTime: Math.round(video.currentTime || 0),
    paused: video.paused,
    muted: video.muted,
    volume: Math.round(video.volume * 100) / 100,
    inPiP: isPiP,
    canPiP: isPipEnabled,
    width: video.videoWidth || Math.round(rect.width),
    height: video.videoHeight || Math.round(rect.height),
    isVisible: rect.width > 20 && rect.height > 20 && window.getComputedStyle(video).visibility !== 'hidden'
  };
}

/**
 * Get all videos formatted for extension popup
 * @returns {Array<Object>}
 */
export function getAllVideosInfo() {
  const videos = scanForVideos();
  return videos.map((v, i) => serializeVideo(v, i));
}

/**
 * Retrieve video DOM element by its FloatView ID
 * @param {string} id
 * @returns {HTMLVideoElement|null}
 */
export function getVideoById(id) {
  if (videoMap.has(id)) {
    const el = videoMap.get(id);
    if (document.contains(el)) return el;
    videoMap.delete(id);
  }

  // Search if re-rendered
  const el = document.querySelector(`video[data-floatview-id="${id}"]`);
  if (el) {
    videoMap.set(id, el);
    return el;
  }

  return null;
}

