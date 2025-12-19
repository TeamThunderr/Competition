export const requireAuth = async (req, res, next) => {
  // assume frontend sends user info after login
  // in real case → decode JWT
  req.user = req.headers.user
    ? JSON.parse(req.headers.user)
    : null;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};
