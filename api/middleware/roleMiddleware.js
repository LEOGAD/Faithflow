const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // req.user is populated by authMiddleware before this runs
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized: No role assigned' });
    }

    // Owner (and legacy admin) implicitly has full access to all routes
    if (req.user.role === 'owner' || req.user.role === 'admin') {
      return next();
    }

    // Check if the user's role is in the allowed array
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource' });
  };
};

module.exports = roleMiddleware;
