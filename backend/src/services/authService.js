const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { BadCredentialsException, BadRequestException } = require('../middleware/errorHandler');

const register = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new BadRequestException('Email already registered');
  }

  const user = new User({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  });
  await user.save();

  const token = generateToken(user.email);
  return {
    token,
    email: user.email,
    name: user.name,
    userId: user._id.toString(),
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new BadCredentialsException('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new BadCredentialsException('Invalid email or password');
  }

  const token = generateToken(user.email);
  return {
    token,
    email: user.email,
    name: user.name,
    userId: user._id.toString(),
  };
};

const getCurrentUser = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new BadRequestException('User not found');
  }
  return user;
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
