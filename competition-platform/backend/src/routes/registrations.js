import express from "express";
import { supabase } from "../utils/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * Student marks competition as registered
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { competition_id } = req.body;
    const { id: student_id, role } = req.user;

    if (role !== "student") {
      return res.status(403).json({ message: "Only students allowed" });
    }

    // check already registered
    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .eq("student_id", student_id)
      .eq("competition_id", competition_id)
      .single();

    if (existing) {
      return res.status(400).json({ message: "Already registered" });
    }

    // insert registration
    await supabase.from("registrations").insert({
      student_id,
      competition_id
    });

    return res.json({ message: "Registered successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
