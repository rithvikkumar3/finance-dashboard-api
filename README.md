# Finance Data Processing and Access Control Backend

A RESTful backend for a finance dashboard with role-based access control, built with Node.js, Express, and MongoDB.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Validation**: express-validator
- **API Docs**: Swagger (swagger-jsdoc + swagger-ui-express)

## Setup

```bash
# 1. Clone and install
npm install

# 2. Create your env file
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET

# 3. Run in development
npm run dev

# 4. Open Swagger docs
http://localhost:5000/docs
```

## Roles and Permissions

| Action                        | viewer | analyst | admin |
|-------------------------------|--------|---------|-------|
| View records (basic list)     | ✅     | ✅      | ✅    |
| Filter records                | ❌     | ✅      | ✅    |
| Dashboard summary             | ✅     | ✅      | ✅    |
| Category breakdown & trends   | ❌     | ✅      | ✅    |
| Create / update / delete records | ❌  | ❌      | ✅    |
| Manage users                  | ❌     | ❌      | ✅    |

## API Overview

### Auth
| Method | Endpoint             | Description        |
|--------|----------------------|--------------------|
| POST   | /api/auth/register   | Register new user  |
| POST   | /api/auth/login      | Login, get JWT     |

### Users (admin only)
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | /api/users                | List all users           |
| GET    | /api/users/:id            | Get user by ID           |
| PATCH  | /api/users/:id/role       | Update user role         |
| PATCH  | /api/users/:id/status     | Activate / deactivate    |

### Records
| Method | Endpoint              | Access         | Description               |
|--------|-----------------------|----------------|---------------------------|
| GET    | /api/records          | All roles      | List records (paginated)  |
| GET    | /api/records/:id      | All roles      | Get single record         |
| POST   | /api/records          | Admin only     | Create record             |
| PUT    | /api/records/:id      | Admin only     | Update record             |
| DELETE | /api/records/:id      | Admin only     | Soft delete record        |

### Dashboard
| Method | Endpoint                          | Access              | Description             |
|--------|-----------------------------------|---------------------|-------------------------|
| GET    | /api/dashboard/summary            | All roles           | Income, expenses, balance, recent activity |
| GET    | /api/dashboard/category-breakdown | Analyst + Admin     | Per-category totals     |
| GET    | /api/dashboard/monthly-trend      | Analyst + Admin     | Monthly income vs expense |

## Design Decisions and Assumptions

- **Soft deletes**: Records are never physically removed. `isDeleted: true` hides them from all queries automatically via a Mongoose middleware hook.
- **Viewer vs Analyst**: Both can read records; only analysts can filter by date/category/type and access detailed analytics endpoints.
- **Password security**: Passwords are hashed with bcrypt (10 salt rounds) and never returned in any query (`select: false`).
- **Admin self-protection**: An admin cannot change their own role or deactivate their own account.
- **Pagination**: Default page size is 10. Pass `?page=2&limit=20` to customize.
- **JWT**: Token expires in 7 days by default, configurable via `JWT_EXPIRES_IN` in `.env`.

## Project Structure

```
finance-backend/
├── src/
│   ├── config/db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   └── FinancialRecord.js
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── roleGuard.js          # Role-based access (roleGuard + minRole)
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
├── swagger.js
├── server.js
├── .env.example
└── README.md
```
