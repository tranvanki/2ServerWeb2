const express = require('express');
require('dotenv').config();
const app = express();
app.use(express.json());
const expressJwt = require('express-jwt');
const { signup, login, logout } = require('./api/controllers/authController');
const path = require('path');
// const session = require('express-session');
const cors = require('cors');

// body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ FIXED CORS configuration with correct port
const corsOptions = {
  origin: [
    'https://hospitalmanagement3.vercel.app',  
    'http://localhost:8080',                   
    'http://localhost:3001',                  
    process.env.CLIENT                         
  ].filter(Boolean), // Remove any undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type', 
    'Accept',
    'Authorization',
    'Cache-Control'
  ],
  optionsSuccessStatus: 200
};

// ✅ Apply CORS before any routes
app.use(cors(corsOptions));

// ✅ Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Connect to MongoDB
const mongoose = require('mongoose');
const databaseUrl = process.env.DBURL;
mongoose.connect(databaseUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });

// ✅ Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    allowedOrigins: corsOptions.origin
  });
});

//routes
const authRoutes = require('./api/routes/authRoutes');
const patientRoutes = require('./api/routes/patientRoutes');
const staffRoutes = require('./api/routes/staffRoutes');
const vitalsRoutes = require('./api/routes/vitalsRoutes');
const medicRecordRoutes = require('./api/routes/MedicRecordRoutes');
const protectedRoutes = require('./api/routes/protectedRoutes');
app.use('/api', protectedRoutes);
app.use('/', authRoutes);
app.use('/patients', patientRoutes);
app.use('/staffs', staffRoutes);
app.use('/vitals', vitalsRoutes);
app.use('/medic-records', medicRecordRoutes);

// Global error handler for production
if (process.env.NODE_ENV === 'production') {
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });
}

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  if (process.env.NODE_ENV === 'production') {
    console.log(`Server is running on port ${port}`);
  } else {
    console.log(`Server is running at http://localhost:${port}`);
  }
});
