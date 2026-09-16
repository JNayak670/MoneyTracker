const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./db');
const authRoutes = require('./routes/authRoutes');
const friendRoutes = require('./routes/friendRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const shareRoutes = require('./routes/shareRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect MongoDB & Auto-Seed Demo User if missing
connectDB().then(async () => {
  try {
    const { User } = require('./db');
    const demoUser = await User.findOne({ email: 'demo@moneytracker.com' });
    if (!demoUser) {
      console.log('🌱 No demo user found. Auto-seeding initial demo data...');
      const { seed } = require('./seed-mongo');
      await seed(false);
    }
  } catch (seedErr) {
    console.warn('⚠️ Auto-seed check notice:', seedErr.message);
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Live Terminal Event Logger Middleware with Full Timestamp
app.use((req, res, next) => {
  const start = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const cleanIp = ip.replace(/^.*:/, ''); // Strip IPv6 prefix if any
  const isLocal = cleanIp === '1' || cleanIp === '127.0.0.1';
  const deviceTag = isLocal ? '💻 Localhost' : `📱 Device (${cleanIp})`;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusEmoji = status < 300 ? '🟢' : status < 400 ? '🔵' : status < 500 ? '🟡' : '🔴';
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString('en-US', { hour12: true })}`;
    
    console.log(
      `[API EVENT • ${timestamp}] ${statusEmoji} ${status} ${req.method.padEnd(6)} ${req.originalUrl} (${duration}ms) • ${deviceTag}`
    );
  });

  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/admin', adminRoutes);


// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Money Tracker API'
  });
});

// Serve frontend static build in production (single-service deployments)
const path = require('path');
const fs = require('fs');
const clientDistPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Resilient server startup with port fallback
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`=======================================================`);
    console.log(` 🚀 Money Tracker API Server running on port ${port}`);
    console.log(` 📡 Health check: http://localhost:${port}/api/health`);
    console.log(`=======================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(port) + 1;
      console.log(`⚠️ Port ${port} is occupied. Retrying on port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('Server startup error:', err);
    }
  });
}

startServer(PORT);
