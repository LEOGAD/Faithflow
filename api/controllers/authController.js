const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Ensure a JWT secret exists
const JWT_SECRET = process.env.JWT_SECRET || 'faithflow_super_secret_key_2026';

exports.register = async (req, res) => {
  try {
    const { name, email, password, churchName, churchAddress, churchPhone } = req.body;
    
    if (!name || !email || !password || !churchName) {
      return res.status(400).json({ error: 'Name, email, password, and Church Name are required' });
    }

    // Check if user exists
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    
    if (!snapshot.empty) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a 6-digit OTP
    // Generate a unique churchId for this registration
    const churchId = 'ch_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

    // Bypass OTP for now - auto verify
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'owner',
      churchId,
      isVerified: true,
      created_at: new Date().toISOString()
    };

    const docRef = await db.collection('users').add(newUser);

    // Bootstrap initial settings for this new church
    await db.collection(`churches/${churchId}/settings`).doc('config').set({
      church_profile: {
        churchName: churchName || 'My Church',
        address: churchAddress || '',
        phone: churchPhone || '',
        email: email.toLowerCase(),
        website: '',
        pastorName: name,
        tagline: '',
        currency: 'USD',
        logoUrl: ''
      }
    });
    
    // Auto login
    const token = jwt.sign(
      { id: docRef.id, email: newUser.email, role: newUser.role, churchId: newUser.churchId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: docRef.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        churchId: newUser.churchId
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    
    if (snapshot.empty) return res.status(404).json({ error: 'User not found' });
    
    const userDoc = snapshot.docs[0];
    const user = userDoc.data();
    
    if (user.otp === otp) {
      await usersRef.doc(userDoc.id).update({ isVerified: true, otp: null });
      
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: userDoc.id, role: user.role, churchId: user.churchId }, 
        process.env.JWT_SECRET || 'faithflow_super_secret_key_2026', 
        { expiresIn: '7d' }
      );
      
      res.status(200).json({ 
        message: 'Email verified successfully', 
        token, 
        user: { id: userDoc.id, name: user.name, email: user.email } 
      });
    } else {
      res.status(400).json({ error: 'Invalid verification code' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    
    if (snapshot.empty) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: userDoc.id, role: user.role, churchId: user.churchId }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: userDoc.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    // Find user
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userDoc = snapshot.docs[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await usersRef.doc(userDoc.id).update({ password: hashedPassword });

    res.status(200).json({ message: 'Password has been reset successfully. Please login.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Internal server error during password reset' });
  }
};
