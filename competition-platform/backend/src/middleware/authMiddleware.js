const authMiddleware = (req, res, next) => {
  // TEMP: Mock logged-in ADMIN user
  req.user = {
    id: 1,
    role: "admin"   // 👈 IMPORTANT
  };

  next();
};

module.exports = authMiddleware;
