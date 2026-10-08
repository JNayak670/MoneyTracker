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
      if (typeof res.flush === 'function') {
        res.flush();
      }
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
      if (typeof res.flush === 'function') {
        res.flush();
      }
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
        if (typeof res.flush === 'function') {
          res.flush();
        }
      } catch (err) {
        // ignore individual failed writes
      }
    }
  }
}

// Set of active Express Response objects for Admin console
const adminClients = new Set();
let adminDebounceTimer = null;

/**
 * Register a new Admin SSE client connection
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
function addAdminClient(req, res) {
  // Set mandatory SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disables proxy buffering
  });

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  // Initial connection handshake
  res.write(`data: ${JSON.stringify({
    type: 'ADMIN_CONNECTED',
    message: 'Admin SSE stream connected successfully',
    timestamp: new Date().toISOString()
  })}\n\n`);
  if (typeof res.flush === 'function') {
    res.flush();
  }

  adminClients.add(res);
  console.log(`${getLogTime()}🛡️ Admin SSE Stream connected • Active Admins: ${adminClients.size}`);

  const heartbeatTimer = setInterval(() => {
    try {
      res.write(': ping\n\n');
      if (typeof res.flush === 'function') {
        res.flush();
      }
    } catch (err) {
      clearInterval(heartbeatTimer);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    adminClients.delete(res);
    console.log(`${getLogTime()}🔌 Admin SSE Stream disconnected • Active Admins: ${adminClients.size}`);
  });

  req.on('error', () => {
    clearInterval(heartbeatTimer);
    adminClients.delete(res);
  });
}

/**
 * Broadcast an event directly to all connected Admin dashboards
 * @param {string} type - Event type
 * @param {any} data - Event payload
 */
function broadcastToAdmin(type, data) {
  if (adminClients.size === 0) return;

  const payload = `data: ${JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  })}\n\n`;

  for (const res of adminClients) {
    try {
      res.write(payload);
      if (typeof res.flush === 'function') {
        res.flush();
      }
    } catch (err) {
      // client write error
    }
  }
}

/**
 * Debounced notification helper: signals all connected Admin pages to auto-refresh
 * Consolidates multiple rapid database mutations into a single immediate refresh signal.
 * @param {string} reason - The model or business action that triggered the update
 * @param {object} meta - Optional additional metadata
 */
function notifyAdmin(reason = 'DATA_UPDATED', meta = {}) {
  if (adminClients.size === 0) return;

  if (adminDebounceTimer) {
    clearTimeout(adminDebounceTimer);
  }

  adminDebounceTimer = setTimeout(() => {
    broadcastToAdmin('ADMIN_DATA_UPDATED', {
      reason,
      ...meta,
      timestamp: Date.now()
    });
    adminDebounceTimer = null;
  }, 100);
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
    connectedAdmins: adminClients.size,
    totalConnections: totalConnections + adminClients.size
  };
}

module.exports = {
  addClient,
  sendToUser,
  broadcast,
  addAdminClient,
  broadcastToAdmin,
  notifyAdmin,
  getStats
};
