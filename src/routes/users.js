const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const userController = require("../controllers/userController");
 
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management — admin only
 */
 
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Access denied
 */
router.get("/", authenticate, roleGuard("admin"), userController.getAllUsers);
 
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get(
  "/:id",
  authenticate,
  roleGuard("admin"),
  userController.getUserById
);
 
/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update a user's role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [viewer, analyst, admin]
 *     responses:
 *       200:
 *         description: Role updated
 *       403:
 *         description: Access denied
 */
router.patch(
  "/:id/role",
  authenticate,
  roleGuard("admin"),
  [body("role").isIn(["viewer", "analyst", "admin"]).withMessage("Invalid role")],
  userController.updateRole
);
 
/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  "/:id/status",
  authenticate,
  roleGuard("admin"),
  [body("isActive").isBoolean().withMessage("isActive must be a boolean")],
  userController.updateStatus
);
 
module.exports = router;