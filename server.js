const express = require('express');
require('dotenv').config();
const app = express();
app.use(express.json());
const expressJwt = require('express-jwt');
const { signup, login, logout } = require('./api/controllers/authController');
const path = require('path');
const cors = require('cors');

// body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ CORS configuration with explicit origins
const corsOptions = {
  origin: [
    'https://hospitalmanagement3.vercel.app',
    'http://localhost:8080',
    'http://localhost:3001',
    'https://2-client-web2-p8dv.vercel.app'
  ],
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

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ Configure express-jwt
app.use(expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  credentialsRequired: false
}).unless({ path: ['/api/login', '/api/signup', '/health'] }));

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
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
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
