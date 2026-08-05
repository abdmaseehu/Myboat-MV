const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // A suspended account must lose access everywhere, not just on the screen
    // that suspended it. Without this, `active` was stored but never enforced.
    if (user.active === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended. Please contact Myboat support.',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

// Populates req.user when a valid token is present, but never rejects the
// request. Used on public endpoints that still need to scope results per role
// (e.g. GET /routes is public for the website, but a VENDOR should only see
// their own routes).
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Invalid/expired token on a public endpoint - continue anonymously
  }

  return next();
};

module.exports = {
  isAuthenticated,
  optionalAuth,
};
