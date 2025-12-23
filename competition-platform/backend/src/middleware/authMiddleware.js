const supabase = require("../config/supabaseClient");

const authMiddleware = async (req, res, next) => {
  try {
    // PUBLIC MODE: We just need a user ID to link data in the database.
    // We look for 'x-user-id' in headers.
    console.log("Auth Middleware - Received Headers:", req.headers);
    const userId = req.headers['x-user-id'];
    console.log("Auth Middleware - extracted userId:", userId);

    if (!userId) {
      console.log("Auth Middleware - No User ID header found");
      // Option 1: Error if no ID provided
      return res.status(400).json({ message: "Public Mode: Please provide 'x-user-id' header" });

      // Option 2 (Uncomment if you want a hardcoded default for testing without headers)
      // req.userId = "your-test-user-uuid-here";
      // return next();
    }

    // Verify this user actually exists in the DB to avoid foreign key errors
    const { data: user, error } = await supabase
      .from("users")
      .select("id, role, department_id")
      .eq("id", userId)
      .single();

    if (error || !user) {
      console.log("Auth Middleware - User lookup failed:", error);
      return res.status(404).json({ message: "User ID provided in header not found in database" });
    }

    console.log("Auth Middleware - User authenticated:", user.id, user.role);
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ message: "Internal Server Error in Auth Middleware" });
  }
};

module.exports = authMiddleware;
