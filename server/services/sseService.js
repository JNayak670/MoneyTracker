/**
 * Server-Sent Events (SSE) Manager Service
 * Manages active real-time client streams for instant notifications
 * Compatible with Render free tier (with 25s keep-alive heartbeat)
 */

// Map of userId string -> Set of Express Response objects
const clients = new Map();

// Render dashboard automatically timestamps all log lines; only prefix on localhost
const getLogTime = () => process.env.RENDER ? '' : `[${new Date().toLocaleTimeString('en-US', { hour12: true })}] `;

/**
 * Register a new SSE client connection
 * @param {string} userId - User ID string
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
function addClient(userId, req, res) {
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const userIdStr = userId.toString();

  // Set mandatory SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Critical: disables proxy buffering on Render / Nginx
  });

  // Flush headers immediately if method exists
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  // Initial connection handshake
  res.write(`data: ${JSON.stringify({
    type: 'CONNECTED',
    message: 'SSE stream connected successfully',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Add response to user's client set (supports multiple tabs / devices per user)
  if (!clients.has(userIdStr)) {
    clients.set(userIdStr, new Set());
  }
  const userClients = clients.get(userIdStr);
  userClients.add(res);

  console.log(`${getLogTime()}📡 SSE Stream connected • User ${userIdStr}`);

  // Keep-alive heartbeat every 25 seconds
  // Render's reverse proxy drops connections that are idle for > 60-100s
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (err) {
      clearInterval(heartbeatTimer);
    }
  }, 25000);

  // Clean up when client disconnects or closes tab
  req.on('close', () => {
    clearInterval(heartbeatTimer);
    const userSet = clients.get(userIdStr);
    if (userSet) {
      userSet.delete(res);
      if (userSet.size === 0) {
        clients.delete(userIdStr);
      }
    }
    console.log(`${getLogTime()}🔌 SSE Stream disconnected • User ${userIdStr}`);
  });

  req.on('error', () => {
    clearInterval(heartbeatTimer);
    const userSet = clients.get(userIdStr);
    if (userSet) {
      userSet.delete(res);
      if (userSet.size === 0) {
        clients.delete(userIdStr);
      }
    }
  });
}

/**
 * Send a typed real-time event to a specific user
 * @param {string} userId - Target user ID
 * @param {string} type - Event type (e.g. 'NEW_NOTIFICATION', 'NOTIFICATION_READ')
 * @param {any} data - Event payload
 * @returns {boolean} Whether at least one active client was sent the event
 */
function sendToUser(userId, type, data) {
  if (!userId) return false;
  const userIdStr = userId.toString();
  const userClients = clients.get(userIdStr);

  if (!userClients || userClients.size === 0) {
    return false;
  }

  const payload = `data: ${JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  })}\n\n`;

  for (const res of userClients) {
    try {
      res.write(payload);
    } catch (err) {
      console.warn(`Failed to push SSE event to user ${userIdStr}:`, err.message);
    }
  }

  console.log(`${getLogTime()}⚡ Realtime '${type}' pushed to User ${userIdStr}`);

  return true;
}

/**
 * Broadcast an event to ALL currently connected users
 * @param {string} type - Event type
 * @param {any} data - Event payload
 */
function broadcast(type, data) {
  const payload = `data: ${JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  })}\n\n`;

  for (const [userId, userClients] of clients.entries()) {
    for (const res of userClients) {
      try {
        res.write(payload);
      } catch (err) {
        // ignore individual failed writes
      }
    }
  }
}

/**
 * Get active connection counts for debugging / monitoring
 */
function getStats() {
  let totalConnections = 0;
  for (const set of clients.values()) {
    totalConnections += set.size;
  }
  return {
    connectedUsers: clients.size,
    totalConnections
  };
}

module.exports = {
  addClient,
  sendToUser,
  broadcast,
  getStats
};
