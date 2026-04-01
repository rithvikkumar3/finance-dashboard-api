/**
 * Role hierarchy: admin > analyst > viewer
 *
 * Usage:
 *   router.post("/", authenticate, roleGuard("admin"), controller)
 *   router.get("/", authenticate, roleGuard("viewer", "analyst", "admin"), controller)
 *
 * Pass the minimum required roles. Any role in the list is allowed.
 */
 
const ROLE_RANK = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};
 
/**
 * allowRoles — pass one or more roles that are permitted.
 * A user passes if their role is in the allowed list.
 */
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
 
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }
 
    next();
  };
};
 
/**
 * minRole — pass the minimum role rank required.
 * Useful for "analyst and above" patterns.
 *
 * Example: minRole("analyst") allows analyst + admin
 */
const minRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
 
    const userRank = ROLE_RANK[req.user.role] || 0;
    const requiredRank = ROLE_RANK[minimumRole] || 0;
 
    if (userRank < requiredRank) {
      return res.status(403).json({
        message: `Access denied. Minimum role required: ${minimumRole}`,
      });
    }
 
    next();
  };
};
 
module.exports = { roleGuard, minRole };