# Finance Data Processing and Access Control Backend
 
A RESTful backend for a finance dashboard with role-based access control, built with Node.js, Express, and MongoDB.
 
## Tech Stack
 
- **Runtime**: Node.js (v20+)
- **Framework**: Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Validation**: express-validator
- **API Docs**: Swagger (swagger-jsdoc + swagger-ui-express)
- **Testing**: Jest + Supertest
 
## Setup (Local)
 
If you prefer running without Docker:
 
```bash
# 1. Clone and install
npm install
 
# 2. Create your env file
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, and optionally PORT (default: 5000)
 
# 3. Run in development
npm run dev
 
# 4. Open Swagger docs
http://localhost:5000/docs
```
 
## Running with Docker (Recommended)
 
The easiest way to get the project running — no local MongoDB installation needed.
 
```bash
# 1. Clone and create your env file
cp .env.example .env
# You can leave MONGO_URI as-is; Docker Compose sets it automatically
 
# 2. Start everything (API + MongoDB)
docker compose up --build
 
# 3. Open Swagger docs
http://localhost:5000/docs
```
 
To stop and remove containers:
```bash
docker compose down
```
 
To also delete the persisted MongoDB data:
```bash
docker compose down -v
```
 
> **Note:** The `docker compose` command spins up two services — `api` (your Express app) and `mongo` (MongoDB 7). The API waits for MongoDB to pass a healthcheck before starting, so you won't hit connection errors on cold starts.
 
## Environment Variables
 
| Variable         | Required | Default                                | Description                  |
|------------------|----------|----------------------------------------|------------------------------|
| `MONGO_URI`      | Yes      | `mongodb://localhost:27017/finance-db` | MongoDB connection string    |
| `JWT_SECRET`     | Yes      | —                                      | Secret key for signing JWTs  |
| `JWT_EXPIRES_IN` | No       | `7d`                                   | JWT token expiry duration    |
| `PORT`           | No       | `5000`                                 | Port the server listens on   |
 
## Running Tests
 
```bash
npm test
```
 
Tests use a separate `finance_test` database (auto-derived from your `MONGO_URI`) and clean up after themselves. Make sure MongoDB is running before running tests.
 
There are 30 test cases across 4 files:
 
| File | What it covers |
|------|----------------|
| `tests/auth.test.js` | Register, login, duplicate email, role lockdown |
| `tests/records.test.js` | Full CRUD, role enforcement, soft delete, pagination |
| `tests/dashboard.test.js` | Summary, category breakdown, monthly trend, access control |
| `tests/users.test.js` | List users, update role, activate/deactivate, access control |
 
## Roles and Permissions
 
| Action                           | viewer | analyst | admin |
|----------------------------------|--------|---------|-------|
| View records (basic list)        | ✅     | ✅      | ✅    |
| Filter records                   | ❌     | ✅      | ✅    |
| Dashboard summary                | ✅     | ✅      | ✅    |
| Category breakdown and trends    | ❌     | ✅      | ✅    |
| Create / update / delete records | ❌     | ❌      | ✅    |
| Manage users                     | ❌     | ❌      | ✅    |
 
## API Overview
 
### Auth
| Method | Endpoint           | Auth | Description        |
|--------|--------------------|------|--------------------|
| POST   | /api/auth/register | No   | Register new user  |
| POST   | /api/auth/login    | No   | Login, receive JWT |
 
### Users (admin only)
| Method | Endpoint               | Description           |
|--------|------------------------|-----------------------|
| GET    | /api/users             | List all users        |
| GET    | /api/users/:id         | Get user by ID        |
| PATCH  | /api/users/:id/role    | Update user role      |
| PATCH  | /api/users/:id/status  | Activate / deactivate |
 
### Records
| Method | Endpoint          | Access     | Description              |
|--------|-------------------|------------|--------------------------|
| GET    | /api/records      | All roles  | List records (paginated) |
| GET    | /api/records/:id  | All roles  | Get single record        |
| POST   | /api/records      | Admin only | Create record            |
| PUT    | /api/records/:id  | Admin only | Update record            |
| DELETE | /api/records/:id  | Admin only | Soft delete record       |
 
### Dashboard
| Method | Endpoint                          | Access          | Description                                    |
|--------|-----------------------------------|-----------------|------------------------------------------------|
| GET    | /api/dashboard/summary            | All roles       | Income, expenses, net balance, recent activity |
| GET    | /api/dashboard/category-breakdown | Analyst + Admin | Per-category totals                            |
| GET    | /api/dashboard/monthly-trend      | Analyst + Admin | Monthly income vs expense                      |
 
Query params for `/api/records`:
- `type` — `income` or `expense` (analyst/admin only)
- `category` — e.g. `salary`, `rent`, `food` (analyst/admin only)
- `startDate` / `endDate` — ISO date format (analyst/admin only)
- `page` — default `1`
- `limit` — default `10`
 
Query params for `/api/dashboard/monthly-trend`:
- `year` — e.g. `2025` (defaults to current year)
 
## Manual Endpoint Testing (Sample Data)
 
### Step 1 — Register a user
```json
POST /api/auth/register
{
  "name": "Rithvik Kumar",
  "email": "rithvik@example.com",
  "password": "secret123"
}
```
> Registration always assigns the `viewer` role.
 
### Step 2 — Promote to admin via MongoDB
```js
db.users.updateOne(
  { email: "rithvik@example.com" },
  { $set: { role: "admin" } }
)
```
 
### Step 3 — Login and copy the token
```json
POST /api/auth/login
{
  "email": "rithvik@example.com",
  "password": "secret123"
}
```
> Use the returned token as `Bearer <token>` in the Authorization header for all further requests.
 
### Step 4 — Create financial records (admin token)
```json
{ "amount": 85000, "type": "income",  "category": "salary",    "date": "2025-01-15", "notes": "January salary" }
{ "amount": 12000, "type": "expense", "category": "rent",       "date": "2025-01-20", "notes": "January rent" }
{ "amount": 3500,  "type": "expense", "category": "food",       "date": "2025-02-05", "notes": "Groceries" }
{ "amount": 25000, "type": "income",  "category": "freelance",  "date": "2025-02-10", "notes": "Client project" }
{ "amount": 5000,  "type": "expense", "category": "utilities",  "date": "2025-03-01", "notes": "Electricity bill" }
{ "amount": 90000, "type": "income",  "category": "salary",     "date": "2025-03-15", "notes": "March salary" }
{ "amount": 8000,  "type": "expense", "category": "transport",  "date": "2025-03-20", "notes": "Flight tickets" }
{ "amount": 15000, "type": "income",  "category": "investment", "date": "2025-04-01", "notes": "Dividend payout" }
```
 
### Step 5 — Create analyst and viewer accounts
```json
POST /api/auth/register
{ "name": "Analyst One", "email": "analyst@example.com", "password": "secret123" }
 
POST /api/auth/register
{ "name": "Viewer One", "email": "viewer@example.com", "password": "secret123" }
```
Then promote the analyst (admin token):
```json
PATCH /api/users/<analyst_id>/role
{ "role": "analyst" }
```
 
### Step 6 — Test dashboard (analyst token)
```
GET /api/dashboard/summary
GET /api/dashboard/category-breakdown
GET /api/dashboard/monthly-trend?year=2025
```
 
### Step 7 — Test access control
Try these with the **viewer token** — all should return `403`:
```
POST /api/records                      → 403
PUT  /api/records/:id                  → 403
DELETE /api/records/:id                → 403
GET  /api/dashboard/category-breakdown → 403
GET  /api/users                        → 403
```
 
## Design Decisions and Assumptions
 
- **Soft deletes**: Records are never physically removed. `isDeleted: true` hides them from all queries automatically via a Mongoose pre-hook on all `find` operations.
- **Role on registration**: Public registration always assigns `viewer`. Admins promote users via `PATCH /api/users/:id/role`. This prevents privilege escalation at signup.
- **Viewer vs Analyst**: Both can read records. Only analysts can filter by date/category/type and access detailed analytics (category breakdown, monthly trend).
- **Password security**: Passwords are hashed with bcrypt (10 salt rounds) and have `select: false` on the schema — never returned in any query response.
- **Admin self-protection**: An admin cannot change their own role or deactivate their own account.
- **Pagination**: Default page size is 10. Pass `?page=2&limit=20` to customize.
- **JWT**: Token expires in 7 days by default, configurable via `JWT_EXPIRES_IN` in `.env`.
- **Invalid IDs**: Passing a malformed MongoDB ObjectId returns a clean `400 Invalid ID format` instead of a raw Mongoose crash.
- **Monthly trend**: All 12 months are always returned. Months with no data show `income: 0, expense: 0, net: 0` so frontend charts never have gaps.
 
## Project Structure
 
```
finance-dashboard-api-master/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   └── FinancialRecord.js
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── roleGuard.js          # roleGuard() and minRole() helpers
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── records.js
│   │   └── dashboard.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── recordController.js
│   │   └── dashboardController.js
│   └── app.js
├── tests/
│   ├── auth.test.js
│   ├── records.test.js
│   ├── dashboard.test.js
│   └── users.test.js
├── swagger.js
├── server.js
├── .env.example
└── README.md
```
 