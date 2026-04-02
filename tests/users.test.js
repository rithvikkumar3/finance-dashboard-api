const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
 
let adminToken, viewerToken, targetUserId;
 
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/finance_test");
 
  await User.deleteMany({ email: /testusers/ });
 
  await Promise.all([
    User.create({ name: "Admin", email: "testusers_admin@example.com", password: "secret123", role: "admin" }),
    User.create({ name: "Viewer", email: "testusers_viewer@example.com", password: "secret123", role: "viewer" }),
  ]);
 
  const target = await User.create({
    name: "Target User",
    email: "testusers_target@example.com",
    password: "secret123",
    role: "viewer",
  });
  targetUserId = target._id.toString();
 
  const [a, b] = await Promise.all([
    request(app).post("/api/auth/login").send({ email: "testusers_admin@example.com", password: "secret123" }),
    request(app).post("/api/auth/login").send({ email: "testusers_viewer@example.com", password: "secret123" }),
  ]);
 
  adminToken = a.body.token;
  viewerToken = b.body.token;
});
 
afterAll(async () => {
  await User.deleteMany({ email: /testusers/ });
  await mongoose.connection.close();
});
 
describe("GET /api/users", () => {
  it("admin can list all users", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("users");
    expect(res.body).toHaveProperty("count");
  });
 
  it("viewer cannot list users", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(403);
  });
 
  it("unauthenticated request is rejected", async () => {
    const res = await request(app).get("/api/users");
    expect(res.statusCode).toBe(401);
  });
});
 
describe("GET /api/users/:id", () => {
  it("admin can get a user by ID", async () => {
    const res = await request(app)
      .get(`/api/users/${targetUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(targetUserId);
  });
 
  it("returns 404 for non-existent user", async () => {
    const res = await request(app)
      .get("/api/users/000000000000000000000000")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });
});
 
describe("PATCH /api/users/:id/role", () => {
  it("admin can update a user role", async () => {
    const res = await request(app)
      .patch(`/api/users/${targetUserId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "analyst" });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe("analyst");
  });
 
  it("should reject invalid role value", async () => {
    const res = await request(app)
      .patch(`/api/users/${targetUserId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "superuser" });
    expect(res.statusCode).toBe(400);
  });
 
  it("viewer cannot update roles", async () => {
    const res = await request(app)
      .patch(`/api/users/${targetUserId}/role`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ role: "admin" });
    expect(res.statusCode).toBe(403);
  });
});
 
describe("PATCH /api/users/:id/status", () => {
  it("admin can deactivate a user", async () => {
    const res = await request(app)
      .patch(`/api/users/${targetUserId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.isActive).toBe(false);
  });
 
  it("admin can reactivate a user", async () => {
    const res = await request(app)
      .patch(`/api/users/${targetUserId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.isActive).toBe(true);
  });
 
  it("should reject non-boolean value", async () => {
    const res = await request(app)
      .patch(`/api/users/${targetUserId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: "yes" });
    expect(res.statusCode).toBe(400);
  });
 
  it("deactivated user cannot login", async () => {
    // deactivate first
    await request(app)
      .patch(`/api/users/${targetUserId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false });
 
    const res = await request(app).post("/api/auth/login").send({
      email: "testusers_target@example.com",
      password: "secret123",
    });
    expect(res.statusCode).toBe(403);
  });
});