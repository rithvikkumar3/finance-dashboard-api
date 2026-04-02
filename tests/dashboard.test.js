const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
 
let adminToken, analystToken, viewerToken;
 
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/finance_test");
 
  await User.deleteMany({ email: /testdash/ });
 
  await Promise.all([
    User.create({ name: "Admin", email: "testdash_admin@example.com", password: "secret123", role: "admin" }),
    User.create({ name: "Analyst", email: "testdash_analyst@example.com", password: "secret123", role: "analyst" }),
    User.create({ name: "Viewer", email: "testdash_viewer@example.com", password: "secret123", role: "viewer" }),
  ]);
 
  const [a, b, c] = await Promise.all([
    request(app).post("/api/auth/login").send({ email: "testdash_admin@example.com", password: "secret123" }),
    request(app).post("/api/auth/login").send({ email: "testdash_analyst@example.com", password: "secret123" }),
    request(app).post("/api/auth/login").send({ email: "testdash_viewer@example.com", password: "secret123" }),
  ]);
 
  adminToken = a.body.token;
  analystToken = b.body.token;
  viewerToken = c.body.token;
});
 
afterAll(async () => {
  await User.deleteMany({ email: /testdash/ });
  await mongoose.connection.close();
});
 
describe("GET /api/dashboard/summary", () => {
  it("viewer can access summary", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("totalIncome");
    expect(res.body).toHaveProperty("totalExpenses");
    expect(res.body).toHaveProperty("netBalance");
    expect(res.body).toHaveProperty("recentActivity");
  });
 
  it("analyst can access summary", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
  });
 
  it("unauthenticated request is rejected", async () => {
    const res = await request(app).get("/api/dashboard/summary");
    expect(res.statusCode).toBe(401);
  });
 
  it("netBalance equals totalIncome minus totalExpenses", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${adminToken}`);
    const { totalIncome, totalExpenses, netBalance } = res.body;
    expect(netBalance).toBe(totalIncome - totalExpenses);
  });
});
 
describe("GET /api/dashboard/category-breakdown", () => {
  it("analyst can access category breakdown", async () => {
    const res = await request(app)
      .get("/api/dashboard/category-breakdown")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("breakdown");
  });
 
  it("admin can access category breakdown", async () => {
    const res = await request(app)
      .get("/api/dashboard/category-breakdown")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
 
  it("viewer cannot access category breakdown", async () => {
    const res = await request(app)
      .get("/api/dashboard/category-breakdown")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(403);
  });
});
 
describe("GET /api/dashboard/monthly-trend", () => {
  it("analyst can access monthly trend", async () => {
    const res = await request(app)
      .get("/api/dashboard/monthly-trend?year=2025")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("trend");
    expect(res.body.trend).toHaveLength(12); // all 12 months always returned
  });
 
  it("viewer cannot access monthly trend", async () => {
    const res = await request(app)
      .get("/api/dashboard/monthly-trend")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(403);
  });
 
  it("defaults to current year when no year param given", async () => {
    const res = await request(app)
      .get("/api/dashboard/monthly-trend")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.year).toBe(new Date().getFullYear());
  });
 
  it("every month entry has income, expense, net fields", async () => {
    const res = await request(app)
      .get("/api/dashboard/monthly-trend?year=2025")
      .set("Authorization", `Bearer ${adminToken}`);
    res.body.trend.forEach((entry) => {
      expect(entry).toHaveProperty("month");
      expect(entry).toHaveProperty("income");
      expect(entry).toHaveProperty("expense");
      expect(entry).toHaveProperty("net");
    });
  });
});