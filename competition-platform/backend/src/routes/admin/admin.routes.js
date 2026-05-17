const express = require("express");
const router = express.Router();

//const authMiddleware = require("../middleware/authMiddleware");
//const roleMiddleware = require('../../middleware/role.middleware');

const adminController = require('../../controllers/admin/competition.controller');
const usersController = require('../../controllers/admin/users.controller');
const checkRole = require('../../middleware/role.middleware');
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// 🔐 All admin routes are protected
//router.use(authMiddleware, roleMiddleware("admin"));

// ➕ Manual entry
router.post("/competition", adminController.addCompetition);
router.put("/competition/:id", adminController.editCompetition);
router.delete("/competition/:id", adminController.deleteCompetition);

router.post(
    "/competition/upload",
    upload.single("file"),
    adminController.uploadCompetitions
);

// 📊 Dashboard Stats
const statsController = require('../../controllers/admin/stats.controller');
router.get("/stats", statsController.getDepartmentStats);
router.get("/competition/:id/stats", statsController.getCompetitionStats);

// 👥 Student & Faculty Data
router.get("/students", usersController.getStudents);
router.get("/student/:id", usersController.getStudentDetails);
router.get("/faculty", usersController.getFaculty);

module.exports = router;
