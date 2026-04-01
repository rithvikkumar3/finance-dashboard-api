
const express = require("express");
const { body, query } = require("express-validator");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { minRole } = require("../middleware/roleGuard");
const recordController = require("../controllers/recordController");
const { CATEGORIES } = require("../models/FinancialRecord");
 
/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial record management
 */
 
/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: Get financial records (all roles). Analysts and admins can filter.
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of records
 */
router.get("/", authenticate, minRole("viewer"), recordController.getRecords);
 
/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get a single record by ID
 *     tags: [Records]
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
 *         description: Record found
 *       404:
 *         description: Record not found
 */
router.get("/:id", authenticate, minRole("viewer"), recordController.getRecordById);
 
/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a new financial record — admin only
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *                 enum: [salary, freelance, investment, rent, food, utilities, transport, healthcare, entertainment, other]
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created
 *       403:
 *         description: Access denied
 */
router.post(
  "/",
  authenticate,
  minRole("admin"),
  [
    body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be positive"),
    body("type").isIn(["income", "expense"]).withMessage("Type must be income or expense"),
    body("category").isIn(CATEGORIES).withMessage("Invalid category"),
    body("date").isISO8601().withMessage("Valid date is required"),
    body("notes").optional().isLength({ max: 500 }),
  ],
  recordController.createRecord
);
 
/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     summary: Update a record — admin only
 *     tags: [Records]
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
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated
 *       403:
 *         description: Access denied
 */
router.put(
  "/:id",
  authenticate,
  minRole("admin"),
  [
    body("amount").optional().isFloat({ min: 0.01 }),
    body("type").optional().isIn(["income", "expense"]),
    body("category").optional().isIn(CATEGORIES),
    body("date").optional().isISO8601(),
    body("notes").optional().isLength({ max: 500 }),
  ],
  recordController.updateRecord
);
 
/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Soft delete a record — admin only
 *     tags: [Records]
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
 *         description: Record deleted
 *       403:
 *         description: Access denied
 */
router.delete("/:id", authenticate, minRole("admin"), recordController.deleteRecord);
 
module.exports = router;
 