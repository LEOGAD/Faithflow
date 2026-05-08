const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

const JWT_SECRET = process.env.JWT_SECRET || 'faithflow_super_secret_key_2026';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Validate if user exists and hasn't been deleted
    const userDoc = await db.collection('users').doc(decoded.id).get();
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    // Attach decoded user info + churchId to the request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      churchId: decoded.churchId || userDoc.data().churchId
    };

    if (!req.user.churchId) {
      return res.status(401).json({ error: 'Unauthorized: No workspace assigned' });
    }

    next();
  } catch (error) {
    console.error('Auth Error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = authMiddleware;
