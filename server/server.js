const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();
const config = require('./config/config');
const connectDB = require('./config/db');
const { createSuperAdmin } = require('./controllers/authController');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');


// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB', err);
});

// Only create superadmin if DB connection is successful
mongoose.connection.once('connected', () => {
  try {
    createSuperAdmin();
  } catch (error) {
    console.error('Error creating superadmin:', error);
  }
});

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(__dirname + '/uploads'));

// Serve static images
app.use('/images', express.static(__dirname + '/uploads/images'));

// Import routes
const apiRoutes = require('./routes/api');

// Use routes
app.use('/api', apiRoutes);

// Make sure Swagger documentation is accessible
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(require('./routes/api').swaggerSpec);
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});