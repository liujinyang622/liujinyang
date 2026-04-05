const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/files'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/history/user/:userId', auth, async (req, res) => {
  const other = req.params.userId;
  const msgs = await Message.find({
    $or: [
      { from: req.user._id, toUser: other },
      { from: other, toUser: req.user._id }
    ]
  }).sort('createdAt');
  res.json(msgs);
});

router.get('/history/group/:groupId', auth, async (req, res) => {
  const msgs = await Message.find({ toGroup: req.params.groupId }).sort('createdAt');
  res.json(msgs);
});

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  res.json({ url: `${process.env.BASE_URL}/uploads/files/${req.file.filename}`, fileName: req.file.originalname });
});

module.exports = router;

