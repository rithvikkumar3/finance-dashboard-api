const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const FinancialRecord = require("../src/models/FinancialRecord");
 
let adminToken, analystToken, viewerToken, recordId;
 
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/finance_test");
 
  // Clean up test users
  await User.deleteMany({ email: /testrec/ });
 
  // Create admin directly in DB (bypass register which forces viewer)
  const admin = await User.create({
    name: "Admin User",
    email: "testrec_admin@example.com",
    password: "secret123",
    role: "admin",
  });
  const analystUser = await User.create({
    name: "Analyst User",
    email: "testrec_analyst@example.com",
    password: "secret123",
    role: "analyst",
  });
  const viewerUser = await User.create({
    name: "Viewer User",
    email: "testrec_viewer@example.com",
    password: "secret123",
    role: "viewer",
  });
 
  // Login all three
  const [a, b, c] = await Promise.all([
    request(app).post("/api/auth/login").send({ email: "testrec_admin@example.com", password: "secret123" }),
    request(app).post("/api/auth/login").send({ email: "testrec_analyst@example.com", password: "secret123" }),
    request(app).post("/api/auth/login").send({ email: "testrec_viewer@example.com", password: "secret123" }),
  ]);
 
  adminToken = a.body.token;
  analystToken = b.body.token;
  viewerToken = c.body.token;
});
 
afterAll(async () => {
  await User.deleteMany({ email: /testrec/ });
  await FinancialRecord.deleteMany({ notes: /jest-test/ });
  await mongoose.connection.close();
});
 
describe("POST /api/records — create record", () => {
  it("admin can create a record", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 5000,
        type: "income",
        category: "salary",
        date: "2025-03-01",
        notes: "jest-test salary",
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.record).toHaveProperty("_id");
    recordId = res.body.record._id; // save for later tests
  });
 
  it("analyst cannot create a record", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${analystToken}`)
      .send({ amount: 1000, type: "income", category: "freelance", date: "2025-03-01", notes: "jest-test" });
    expect(res.statusCode).toBe(403);
  });
 
  it("viewer cannot create a record", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ amount: 1000, type: "income", category: "freelance", date: "2025-03-01", notes: "jest-test" });
    expect(res.statusCode).toBe(403);
  });
 
  it("should reject negative amount", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: -100, type: "income", category: "salary", date: "2025-03-01", notes: "jest-test" });
    expect(res.statusCode).toBe(400);
  });
 
  it("should reject invalid category", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: 100, type: "income", category: "invalid_cat", date: "2025-03-01", notes: "jest-test" });
    expect(res.statusCode).toBe(400);
  });
 
  it("should reject missing required fields", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: 100 });
    expect(res.statusCode).toBe(400);
  });
 
  it("unauthenticated request should be rejected", async () => {
    const res = await request(app)
      .post("/api/records")
      .send({ amount: 100, type: "income", category: "salary", date: "2025-03-01" });
    expect(res.statusCode).toBe(401);
  });
});
 
describe("GET /api/records — list records", () => {
  it("viewer can get records (no filters)", async () => {
    const res = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("records");
    expect(res.body).toHaveProperty("total");
  });
 
  it("analyst can filter by type", async () => {
    const res = await request(app)
      .get("/api/records?type=income")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
    res.body.records.forEach((r) => expect(r.type).toBe("income"));
  });
 
  it("analyst can filter by date range", async () => {
    const res = await request(app)
      .get("/api/records?startDate=2025-01-01&endDate=2025-12-31")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
  });
 
  it("pagination works", async () => {
    const res = await request(app)
      .get("/api/records?page=1&limit=2")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.records.length).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty("totalPages");
  });
});
 
describe("GET /api/records/:id — single record", () => {
  it("can fetch a record by ID", async () => {
    const res = await request(app)
      .get(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(recordId);
  });
 
  it("returns 400 for invalid ID format", async () => {
    const res = await request(app)
      .get("/api/records/notanid")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(400);
  });
 
  it("returns 404 for non-existent ID", async () => {
    const res = await request(app)
      .get("/api/records/000000000000000000000000")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(404);
  });
});
 
describe("PUT /api/records/:id — update record", () => {
  it("admin can update a record", async () => {
    const res = await request(app)
      .put(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: 7500, notes: "jest-test updated" });
    expect(res.statusCode).toBe(200);
    expect(res.body.record.amount).toBe(7500);
  });
 
  it("analyst cannot update a record", async () => {
    const res = await request(app)
      .put(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${analystToken}`)
      .send({ amount: 999 });
    expect(res.statusCode).toBe(403);
  });
});
 
describe("DELETE /api/records/:id — soft delete", () => {
  it("analyst cannot delete a record", async () => {
    const res = await request(app)
      .delete(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(403);
  });
 
  it("admin can soft delete a record", async () => {
    const res = await request(app)
      .delete(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/soft-deleted/i);
  });
 
  it("deleted record should not appear in list", async () => {
    const res = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${adminToken}`);
    const ids = res.body.records.map((r) => r._id);
    expect(ids).not.toContain(recordId);
  });
});