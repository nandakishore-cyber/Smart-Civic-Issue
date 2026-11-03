const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const sessionDays = Number(process.env.SESSION_DAYS) || 7;

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

const createSession = async (user) => {
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);
  await Session.create({ user: user._id, jti, expiresAt });
  const token = jwt.sign({ id: user._id.toString(), role: user.role, jti }, process.env.JWT_SECRET, {
    expiresIn: `${sessionDays}d`,
  });
  return { token, expiresAt };
};

const validateCredentials = ({ email, password }) => {
  if (!email || !password) return 'Email and password are required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please provide a valid email address.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const credentialError = validateCredentials({ email, password });
    if (credentialError || !name?.trim() || !phone?.trim()) {
      return res.status(400).json({ message: credentialError || 'Name and phone are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) return res.status(409).json({ message: 'An account already exists for this email.' });

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone.trim(),
      role: 'user',
    });
    const session = await createSession(user);
    res.status(201).json({ token: session.token, expiresAt: session.expiresAt, user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account already exists for this email.' });
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const credentialError = validateCredentials({ email, password });
    if (credentialError) return res.status(400).json({ message: credentialError });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    if (role && user.role !== role) return res.status(403).json({ message: 'Please use the correct login portal.' });

    const session = await createSession(user);
    res.json({ token: session.token, expiresAt: session.expiresAt, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

const logoutUser = async (req, res, next) => {
  try {
    await Session.deleteOne({ jti: req.session.jti });
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getMe, logoutUser };
