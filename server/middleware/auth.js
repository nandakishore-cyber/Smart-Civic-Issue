const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const getToken = (req) => {
  const authorization = req.headers.authorization;
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.slice(7);
  }
  return req.query.token;
};

const protect = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.jti || !decoded.id) {
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }

    const session = await Session.findOne({ jti: decoded.jti, user: decoded.id }).lean();
    if (!session) {
      return res.status(401).json({ message: 'Session expired or revoked.' });
    }

    const user = await User.findById(decoded.id).select('-password').lean();
    if (!user) {
      return res.status(401).json({ message: 'Account no longer exists.' });
    }

    req.user = user;
    req.session = session;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired authentication token.' });
    }
    next(error);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

const govOfficerOnly = (req, res, next) => {
  if (req.user?.role !== 'govOfficer') {
    return res.status(403).json({ message: 'Access denied. Gov. Officer only.' });
  }
  next();
};

module.exports = { protect, adminOnly, govOfficerOnly };
