const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');

const app = express();

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  throw new Error('MONGO_URI and JWT_SECRET must be configured in the environment');
}

// Middleware
const allowedOrigins = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()) : true;
app.use(cors({ origin: allowedOrigins, credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/supervisors', supervisorRoutes);

// Serve built React client if available
const fs = require('fs');
const path = require('path');
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // Fallback API root route
  app.get('/', (req, res) => {
    res.json({ message: 'Smart Civic Issue Reporting Platform API' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
  }

  if (err.message && err.message.includes('Only')) {
    return res.status(400).json({ message: err.message });
  }

  const status = err.name === 'ValidationError' ? 400 : err.statusCode || 500;
  res.status(status).json({ message: status === 500 ? 'Internal server error.' : err.message });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
