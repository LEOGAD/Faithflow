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

// Mount Routes (Protected)
app.use('/income', authMiddleware, incomeRoutes);
app.use('/expenses', authMiddleware, expenseRoutes);
app.use('/attendance', authMiddleware, attendanceRoutes);
app.use('/reports', authMiddleware, reportRoutes);
app.use('/members', authMiddleware, memberRoutes);
app.use('/settings', authMiddleware, settingsRoutes);

// Unprotected Auth Route
app.use('/auth', authRoutes);

// Serve Frontend (Static files from parent directory)
const frontendPath = path.join(__dirname, '../');
app.use(express.static(frontendPath, { index: false }));

// Catch-all middleware to serve login.html for root, or index.html for others
app.use((req, res, next) => {
  const apiRoutes = ['/income', '/expenses', '/attendance', '/reports', '/auth', '/members', '/settings'];
  if (apiRoutes.some(route => req.url.startsWith(route))) return next();
  
  // Default root redirects to login
  if (req.url === '/') {
      return res.redirect('/login.html');
  }
  
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
