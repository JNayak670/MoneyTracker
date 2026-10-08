import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const cleanBase = API_BASE.replace(/\/+$/, '');
const HEALTH_URL = cleanBase.endsWith('/api') ? `${cleanBase}/health` : `${cleanBase}/api/health`;

// In-memory server status tracker: 'unknown' | 'waking' | 'online'
let currentServerStatus = 'unknown';
const statusListeners = new Set();
let pingPromise = null;

export function subscribeServerStatus(callback) {
  statusListeners.add(callback);
  callback(currentServerStatus);
  return () => statusListeners.delete(callback);
}

function notifyStatus(status) {
  if (currentServerStatus !== status) {
    currentServerStatus = status;
    statusListeners.forEach((fn) => {
      try { fn(status); } catch (e) { console.error(e); }
    });
  }
}

export function getCurrentServerStatus() {
  return currentServerStatus;
}

/**
 * Checks whether an error indicates that the Render backend is sleeping or spinning up.
 */
export function isSleepingServerError(err) {
  if (!err) return false;
  if (err.isSleepingServer) return true;
  if (!err.response) return true; // Network Error / no connection / CORS during cold start
  const status = err.response?.status || err.status;
  // 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout are typical Render cold start responses
  if ([502, 503, 504].includes(status)) return true;
  if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || err.message === 'Network Error') return true;
  return false;
}

/**
 * Non-blocking silent ping to wake up the Render free-tier instance as early as possible.
 */
export function pingServer() {
  if (pingPromise) return pingPromise;

  pingPromise = axios.get(HEALTH_URL, { timeout: 8000 })
    .then((res) => {
      if (res.status === 200) {
        notifyStatus('online');
        return true;
      }
      notifyStatus('waking');
      return false;
    })
    .catch(() => {
      notifyStatus('waking');
      return false;
    })
    .finally(() => {
      pingPromise = null;
    });

  return pingPromise;
}

/**
 * Continuously polls /api/health until Render's backend responds with 200 OK.
 * Keeps calling onProgress with attempt and elapsed time.
 */
export async function waitForServerWakeup({
  onProgress,
  maxTimeoutMs = 120000, // up to 120 seconds (Render cold starts typically take 30-55s)
  intervalMs = 2500
} = {}) {
  notifyStatus('waking');
  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < maxTimeoutMs) {
    attempt += 1;
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);

    if (onProgress) {
      onProgress({
        attempt,
        elapsedSec,
        message: `Waking up Cloud Server (${elapsedSec}s)...`
      });
    }

    try {
      const res = await axios.get(HEALTH_URL, { timeout: 7000 });
      if (res.status === 200) {
        notifyStatus('online');
        return true;
      }
    } catch (err) {
      // Still booting up; continue loop
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  notifyStatus('waking');
  throw new Error('Cloud backend wake-up timed out. Please refresh the page or try again.');
}

/**
 * Executes an action function. If it fails because the Render backend is sleeping,
 * it automatically notifies the user, waits for the server to wake up, and retries.
 */
export async function executeWithServerWakeup(actionFn, { onWakeupProgress, autoShowLoader = false } = {}) {
  try {
    return await actionFn();
  } catch (err) {
    if (isSleepingServerError(err)) {
      notifyStatus('waking');
      let loaderTriggered = false;
      if (autoShowLoader && typeof window !== 'undefined') {
        loaderTriggered = true;
        window.dispatchEvent(new CustomEvent('show-operation-loader', {
          detail: {
            tag: 'CLOUD BACKEND WAKE UP',
            message: 'Waking Up Cloud Server...',
            submessage: 'Render free tier spins down idle instances. Booting container now (usually ~30–50s)...',
            statusText: 'Connecting to Cloud API'
          }
        }));
      }

      const handleProgress = (info) => {
        if (onWakeupProgress) {
          onWakeupProgress(info);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('update-operation-loader', {
            detail: {
              tag: 'CLOUD BACKEND WAKE UP',
              message: `Waking Up Cloud Server (${info.elapsedSec}s)...`,
              submessage: `Render free tier spins down inactive servers. Booting container now (${info.elapsedSec}s elapsed, typically ~30–50s)...`,
              statusText: `Attempt ${info.attempt} • Connecting`
            }
          }));
        }
      };

      try {
        await waitForServerWakeup({ onProgress: handleProgress });
        // Retry once the server has responded online
        return await actionFn();
      } finally {
        if (loaderTriggered && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hide-operation-loader'));
        }
      }
    }
    throw err;
  }
}
