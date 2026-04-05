const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatars'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  res.json(user);
});

router.post('/profile', auth, upload.single('avatar'), async (req, res) => {
  const { displayName } = req.body;
  if (displayName) req.user.displayName = displayName;
  if (req.file) req.user.avatarUrl = `${process.env.BASE_URL}/uploads/avatars/${req.file.filename}`;
  await req.user.save();
  res.json({ user: req.user });
});

router.get('/search', auth, async (req, res) => {
  const q = req.query.q || '';
  const users = await User.find({ username: { $regex: q, $options: 'i' } }).limit(20).select('username displayName avatarUrl');
  res.json(users);
});

module.exports = router;

