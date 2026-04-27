// backend/middleware/authorizeRole.js

module.exports = function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    try {
      // req.user is set by JWT auth middleware
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
