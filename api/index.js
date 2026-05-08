const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = ['http://localhost:8080', 'http://localhost:5000', 'https://faithflow-church.vercel.app'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(null, true); // For now allow all during initial deploy, refine later
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/public', express.static('public')); // Serve generated PDFs

// Import Routes
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const authMiddleware = require('./middleware/authMiddleware');

// API Router
const apiRouter = express.Router();

// Mount Routes (Protected)
apiRouter.use('/income', authMiddleware, incomeRoutes);
apiRouter.use('/expenses', authMiddleware, expenseRoutes);
apiRouter.use('/attendance', authMiddleware, attendanceRoutes);
apiRouter.use('/reports', authMiddleware, reportRoutes);
apiRouter.use('/members', authMiddleware, memberRoutes);
apiRouter.use('/settings', authMiddleware, settingsRoutes);

// Unprotected Auth Route
apiRouter.use('/auth', authRoutes);

// Main Entry
app.use('/api', apiRouter);

// Serve Frontend (Static files from parent directory)
// On Vercel, static files are served automatically from the root
// So we only need to serve the public folder for PDFs if needed
app.use('/public', express.static(path.join(__dirname, 'public')));

module.exports = app;
