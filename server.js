const express = require('express');
require('dotenv').config();
const app = express();
app.use(express.json());
const { expressjwt: jwt } = require('express-jwt'); // ✅ Sửa import
const { signup, login, logout } = require('./api/controllers/authController');
const path = require('path');
const cors = require('cors');

// body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ CORS configuration
const corsOptions = {
  origin: [
    'https://hospitalmanagement3.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
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

// Connect to MongoDB
const mongoose = require('mongoose');
const databaseUrl = process.env.DBURL;
mongoose.connect(databaseUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

//routes
const authRoutes = require('./api/routes/authRoutes');
const patientRoutes = require('./api/routes/patientRoutes');
const staffRoutes = require('./api/routes/staffRoutes');
const vitalsRoutes = require('./api/routes/vitalsRoutes');
const medicRecordRoutes = require('./api/routes/MedicRecordRoutes');
const protectedRoutes = require('./api/routes/protectedRoutes');

// ✅ Apply JWT middleware to protected routes only
app.use('/api', jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256']
}), protectedRoutes);

app.use('/', authRoutes);
app.use('/patients', patientRoutes);
app.use('/staffs', staffRoutes);
app.use('/vitals', vitalsRoutes);
app.use('/medic-records', medicRecordRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  res.status(500).json({ message: 'Something broke!' });
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
