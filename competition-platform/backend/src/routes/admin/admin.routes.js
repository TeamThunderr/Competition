const express = require("express");
const router = express.Router();

//const authMiddleware = require("../middleware/authMiddleware");
//const roleMiddleware = require("../middleware/roleMiddleware");

const adminController = require('../../controllers/admin/competition.controller');
const checkRole = require('../../middleware/role.middleware');
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// 🔐 All admin routes are protected
//router.use(authMiddleware, roleMiddleware("admin"));

// ➕ Manual entry
router.post("/competition", adminController.addCompetition);

// 📂 Excel / CSV upload
router.post(
    "/competition/upload",
    upload.single("file"),
    adminController.uploadCompetitions
);

// 📊 Dashboard Stats
const statsController = require('../../controllers/admin/stats.controller');
router.get("/stats", statsController.getDepartmentStats);

module.exports = router;
