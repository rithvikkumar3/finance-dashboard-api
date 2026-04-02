const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
 
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/finance_test");
});
 
afterAll(async () => {
  await User.deleteMany({ email: /testauth/ });
  await mongoose.connection.close();
});
 
describe("POST /api/auth/register", () => {
  it("should register a new user and return a token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "testauth1@example.com",
      password: "secret123",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.role).toBe("viewer"); // always defaults to viewer
  });
 
  it("should reject duplicate email", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "testauth2@example.com",
      password: "secret123",
    });
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "testauth2@example.com",
      password: "secret123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });
 
  it("should reject missing fields", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "testauth3@example.com",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });
 
  it("should reject short password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "testauth4@example.com",
      password: "123",
    });
    expect(res.statusCode).toBe(400);
  });
 
  it("should ignore role field and always assign viewer", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Hacker",
      email: "testauth5@example.com",
      password: "secret123",
      role: "admin", // should be ignored
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe("viewer");
  });
});
 
describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Login Test",
      email: "testauth_login@example.com",
      password: "secret123",
    });
  });
 
  it("should login with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "testauth_login@example.com",
      password: "secret123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
 
  it("should reject wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "testauth_login@example.com",
      password: "wrongpassword",
    });
    expect(res.statusCode).toBe(401);
  });
 
  it("should reject non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "secret123",
    });
    expect(res.statusCode).toBe(401);
  });
 
  it("should reject invalid email format", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "notanemail",
      password: "secret123",
    });
    expect(res.statusCode).toBe(400);
  });
});