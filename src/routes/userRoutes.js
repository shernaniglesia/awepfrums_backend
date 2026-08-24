const express = require('express');
const protectRoute = require('../middleware/authMiddleware');
const {
  listUsers,
  createUser,
  updateUser,
  getInstructors,
  resetPassword
} = require('../controllers/userController');

const router = express.Router();

// 1. Admin Only Endpoints
// Protects the route, then checks if the verified user has the 'admin' role
router.get('/', protectRoute, (req, res, next) => {
    if (req.user.user_role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
}, listUsers);

router.post('/', protectRoute, (req, res, next) => {
    if (req.user.user_role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
}, createUser);


// 2. Protected/Owner-Based Endpoints
// Protects the route, then lets users update data or reset password
router.put('/:role/:id', protectRoute, (req, res, next) => {
    // Optional Security Check: Users can only update themselves unless they are an admin
    const isOwner = req.user.user_id === parseInt(req.params.id) && req.user.user_role === req.params.role;
    const isAdmin = req.user.user_role === 'admin';
    
    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Unauthorized to update this profile." });
    }
    next();
}, updateUser);

router.put('/reset-password/:role/:id', protectRoute, (req, res, next) => {
    const isOwner = req.user.user_id === parseInt(req.params.id) && req.user.user_role === req.params.role;
    const isAdmin = req.user.user_role === 'admin';
    
    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Unauthorized to reset this password." });
    }
    next();
}, resetPassword);


// 3. Authenticated Public/Shared Endpoints
// Any authenticated user (Student, Instructor, Admin) can view instructors
router.get("/instructors", protectRoute, getInstructors);

module.exports = router;

// backend/src/routes/user.routes.js
// const express = require("express");
// const router = express.Router();
// const protectRoute = require("../middleware/auth.middleware");
// const userController = require("../controllers/user.controller");

// // Base operational profile and management routes
// router.get("/list", protectRoute, userController.listUsers);
// router.get("/instructors", protectRoute, userController.getInstructors);
// router.post("/create", protectRoute, userController.createUser);
// router.put("/update/:role/:id", protectRoute, userController.updateUser);
// router.put("/reset-password/:role/:id", protectRoute, userController.resetPassword);

// module.exports = router;