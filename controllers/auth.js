import jwt from "jsonwebtoken"
import prisma from "../prisma/prismaClient/prismaClient.js"

async function signup(req, res) {
  try {
    const { email, password, name } = req.body;

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Account with this email already exists');
    }

    // Create a new profile and associate with the user
    const newProfile = await prisma.profile.create({
      data: {},
    });

    // Create a new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        profile: { connect: { id: newProfile.id } }, // Connect the user to the profile
      },
    });

    // Generate JWT token
    const token = createJWT(newUser);
    res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }, // Include associated profile
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error('Incorrect password');
    }

    // Generate JWT token
    const token = createJWT(user);
    res.json({ token });
  } catch (err) {
    handleAuthError(err, res);
  }
}

async function changePassword(req, res) {
  try {
    const { userId } = req.user; // Assuming userId is provided in request

    // Find user by userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check password
    const isMatch = await comparePassword(req.body.password, user.password);
    if (!isMatch) {
      throw new Error('Incorrect password');
    }

    // Update user's password
    await prisma.user.update({
      where: { id: userId },
      data: { password: req.body.newPassword },
    });

    // Generate JWT token with updated user
    const updatedUser = { ...user, password: req.body.newPassword };
    const token = createJWT(updatedUser);
    res.json({ token });
  } catch (err) {
    handleAuthError(err, res);
  }
}

/* -- Helper Functions -- */

async function comparePassword(tryPassword, hashedPassword) {
  return bcrypt.compare(tryPassword, hashedPassword);
}

function handleAuthError(err, res) {
  console.error(err);
  const { message } = err;
  const statusCode = message === 'User not found' || message === 'Incorrect password' ? 401 : 500;
  res.status(statusCode).json({ err: message });
}

function createJWT(user) {
  return jwt.sign({ user }, process.env.SECRET, { expiresIn: '24h' });
}

export { signup, login, changePassword };