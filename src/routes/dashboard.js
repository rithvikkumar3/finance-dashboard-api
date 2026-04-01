const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { minRole } = require("../middleware/roleGuard");
const dashboardController = require("../controllers/dashboardController");
 
/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Aggregated financial summaries
 */
 
/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get total income, expenses, and net balance — all roles
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIncome:
 *                   type: number
 *                 totalExpenses:
 *                   type: number
 *                 netBalance:
 *                   type: number
 *                 recentActivity:
 *                   type: array
 */
router.get(
  "/summary",
  authenticate,
  minRole("viewer"),
  dashboardController.getSummary
);
 
/**
 * @swagger
 * /api/dashboard/category-breakdown:
 *   get:
 *     summary: Category-wise totals — analyst and admin only
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown
 */
router.get(
  "/category-breakdown",
  authenticate,
  minRole("analyst"),
  dashboardController.getCategoryBreakdown
);
 
/**
 * @swagger
 * /api/dashboard/monthly-trend:
 *   get:
 *     summary: Monthly income vs expense trend — analyst and admin only
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2025
 *     responses:
 *       200:
 *         description: Monthly trend data
 */
router.get(
  "/monthly-trend",
  authenticate,
  minRole("analyst"),
  dashboardController.getMonthlyTrend
);
 
module.exports = router;