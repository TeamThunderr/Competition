const supabase = require("../config/supabaseClient");

const authMiddleware = async (req, res, next) => {
  try {
    // PUBLIC MODE: We just need a user ID to link data in the database.
    // We look for 'x-user-id' in headers.
    const userId = req.headers['x-user-id'];

    if (!userId) {
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
      return res.status(404).json({ message: "User ID provided in header not found in database" });
    }

    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ message: "Internal Server Error in Auth Middleware" });
  }
};

module.exports = authMiddleware;
