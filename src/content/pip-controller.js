/**
 * Picture-in-Picture Controller
 * Handles native HTML5 Picture-in-Picture API actions and video playback controls.
 */

export async function requestPiP(video) {
  if (!video) throw new Error('Video element not found');

  if (!document.pictureInPictureEnabled) {
    throw new Error('Picture-in-Picture API is not enabled in this browser');
  }

  // Bypass arbitrary site restrictions if present
  if (video.disablePictureInPicture) {
    video.disablePictureInPicture = false;
  }

  if (document.pictureInPictureElement === video) {
    return true;
  }

  try {
    await video.requestPictureInPicture();
    return true;
  } catch (err) {
    console.error('[FloatView PiP] requestPictureInPicture failed:', err);
    throw err;
  }
}

export async function exitPiP() {
  if (document.pictureInPictureElement) {
    try {
      await document.exitPictureInPicture();
      return true;
    } catch (err) {
      console.error('[FloatView PiP] exitPictureInPicture failed:', err);
      throw err;
    }
  }
  return false;
}

export async function togglePiP(video) {
  if (!video) throw new Error('Video element not found');

  if (document.pictureInPictureElement === video) {
    return exitPiP();
  } else {
    return requestPiP(video);
  }
}

export function togglePlayback(video) {
  if (!video) return false;
  if (video.paused) {
    video.play().catch((err) => console.warn('[FloatView] Play failed:', err));
  } else {
    video.pause();
  }
  return !video.paused;
}

export function seekBy(video, deltaSeconds) {
  if (!video || !Number.isFinite(video.duration)) return;
  const newTime = Math.max(0, Math.min(video.duration, video.currentTime + deltaSeconds));
  video.currentTime = newTime;
}

export function setCurrentTime(video, targetSeconds) {
  if (!video || !Number.isFinite(video.duration)) return;
  video.currentTime = Math.max(0, Math.min(video.duration, targetSeconds));
}

export function toggleMute(video) {
  if (!video) return;
  video.muted = !video.muted;
}

export function setVolume(video, volumeLevel) {
  if (!video) return;
  const safeVol = Math.max(0, Math.min(1, Number(volumeLevel)));
  video.volume = safeVol;
  if (safeVol > 0 && video.muted) {
    video.muted = false;
  }
}

