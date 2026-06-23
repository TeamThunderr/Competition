const jwt = require("jsonwebtoken");
const supabase = require("../config/supabaseClient");

// ─────────────────────────────────────────────────────────────────────────────
// DEVELOPMENT MODE AUTH
// Uses the original x-user-id header flow — no changes from the demo version.
// NOT safe for production: any caller can spoof any user ID.
// ─────────────────────────────────────────────────────────────────────────────
const devAuth = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res
        .status(400)
        .json({ message: "Public Mode: Please provide 'x-user-id' header" });
    }

    // Verify this user actually exists in the DB to avoid foreign key errors
    const { data: user, error } = await supabase
      .from("users")
      .select("id, role, department_id, assigned_sections")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res
        .status(404)
        .json({ message: "User ID provided in header not found in database" });
    }

    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error("Auth Middleware [DEV] Error:", error);
    res.status(500).json({ message: "Internal Server Error in Auth Middleware" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION MODE AUTH
// Verifies the Supabase-signed JWT from the Authorization: Bearer <token> header.
// Requires SUPABASE_JWT_SECRET in the environment (Project Settings → API → JWT Secret).
// ─────────────────────────────────────────────────────────────────────────────
const prodAuth = async (req, res, next) => {
  try {
    // ── 1. Extract the token ─────────────────────────────────────────────────
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // ── 2. Verify the JWT signature & expiry ─────────────────────────────────
    let payload;
    try {
      payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
        algorithms: ["HS256"],
      });
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Token expired",
        });
      }
      if (
        jwtError.name === "JsonWebTokenError" ||
        jwtError.name === "NotBeforeError"
      ) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid token signature",
        });
      }
      // Catch-all for any other jwt.verify failure
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token verification failed",
      });
    }

    // ── 3. Extract user email from the 'email' claim ─────────────────────────
    const userEmail = payload.email;

    if (!userEmail) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token: missing email claim",
      });
    }

    // ── 4. Confirm the user exists in our database ───────────────────────────
    const { data: user, error: dbError } = await supabase
      .from("users")
      .select("id, role, department_id, assigned_sections")
      .eq("email", userEmail)
      .single();

    if (dbError || !user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not found",
      });
    }

    // ── 5. Attach user context to the request ────────────────────────────────
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error("Auth Middleware [PROD] Error:", error);
    res.status(500).json({ message: "Internal Server Error in Auth Middleware" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Export the correct handler based on NODE_ENV.
// Defaults to dev mode when NODE_ENV is unset so local development is unaffected.
// ─────────────────────────────────────────────────────────────────────────────
const authMiddleware =
  process.env.NODE_ENV === "production" ? prodAuth : devAuth;

module.exports = authMiddleware;
