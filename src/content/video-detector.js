/**
 * Video Detector
 * Discovers HTML5 <video> elements in the page (including Shadow DOM), tracks their status,
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
    try {
      video.dataset.floatviewId = id;
    } catch (e) {
      // Ignore if read-only
    }
  }
  videoMap.set(id, video);
  return id;
}

/**
 * Extract human-readable title for a video element
 * @param {HTMLVideoElement} video
 * @param {number} index
 * @returns {string}
 */
function extractVideoTitle(video, index) {
  // 1. YouTube specific title detection
  if (window.location.hostname.includes('youtube.com')) {
    const ytTitle = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1 yt-formatted-string, ytd-watch-metadata h1, h1.title')?.textContent?.trim();
    if (ytTitle && ytTitle.length > 1) return ytTitle;
  }

  // 2. Direct video title attributes
  if (video.title && video.title.trim().length > 0) return video.title.trim();
  if (video.getAttribute('aria-label') && video.getAttribute('aria-label').trim().length > 0) {
    return video.getAttribute('aria-label').trim();
  }

  // 3. Check parent or nearby headings
  const container = video.closest('article, section, [class*="player"], [id*="player"]') || video.parentElement;
  if (container) {
    const heading = container.querySelector('h1, h2, h3, [class*="title"]');
    if (heading && heading.textContent.trim().length > 2) {
      return heading.textContent.trim().slice(0, 80);
    }
  }

  // 4. Clean document title
  if (document.title && document.title.length > 0) {
    const cleanTitle = document.title.replace(/\s*-\s*YouTube$/i, '').trim();
    if (cleanTitle) return cleanTitle;
  }

  return `Video #${index + 1}`;
}

/**
 * Scan DOM and Shadow DOM roots for all video elements
 * @returns {HTMLVideoElement[]}
 */
export function scanForVideos() {
  const elements = [];

  try {
    // 1. Standard DOM query
    const directVideos = Array.from(document.querySelectorAll('video'));
    elements.push(...directVideos);

    // 2. YouTube specific main player video
    const ytVideo = document.querySelector('video.html5-main-video, #movie_player video');
    if (ytVideo && !elements.includes(ytVideo)) {
      elements.unshift(ytVideo);
    }

    // 3. Shadow DOM traversal for modern web components (Reddit, Twitter, VideoJS, etc.)
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.shadowRoot) {
        try {
          const shadowVideos = el.shadowRoot.querySelectorAll('video');
          for (const sv of shadowVideos) {
            if (!elements.includes(sv)) {
              elements.push(sv);
            }
          }
        } catch (e) {
          // Ignore closed shadow roots
        }
      }
    }
  } catch (err) {
    console.warn('[YouTube Floating View] Error scanning videos:', err);
  }

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

  // Sort: Playing videos first, then in-pip, then largest resolution
  elements.sort((a, b) => {
    const aInPip = document.pictureInPictureElement === a;
    const bInPip = document.pictureInPictureElement === b;
    if (aInPip && !bInPip) return -1;
    if (!aInPip && bInPip) return 1;

    const aPlaying = !a.paused && a.currentTime > 0;
    const bPlaying = !b.paused && b.currentTime > 0;
    if (aPlaying && !bPlaying) return -1;
    if (!aPlaying && bPlaying) return 1;

    const aArea = (a.videoWidth || a.clientWidth || 0) * (a.videoHeight || a.clientHeight || 0);
    const bArea = (b.videoWidth || b.clientWidth || 0) * (b.videoHeight || b.clientHeight || 0);
    return bArea - aArea;
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
    isVisible: (rect.width > 20 && rect.height > 20) || (video.videoWidth > 20 && video.videoHeight > 20)
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

  // Fallback: check all videos
  const all = scanForVideos();
  const found = all.find((v) => v.dataset?.floatviewId === id);
  if (found) {
    videoMap.set(id, found);
    return found;
  }

  return null;
}
