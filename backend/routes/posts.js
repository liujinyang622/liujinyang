const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/posts'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.post('/', auth, upload.array('media', 6), async (req, res) => {
  const mediaUrls = (req.files || []).map(f => `${process.env.BASE_URL}/uploads/posts/${f.filename}`);
  const post = new Post({ author: req.user._id, text: req.body.text, mediaUrls });
  await post.save();
  res.json(post);
});

router.get('/', auth, async (req, res) => {
  const posts = await Post.find().populate('author', 'username displayName avatarUrl').sort('-createdAt').limit(50);
  res.json(posts);
});

router.post('/:id/like', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  const idx = post.likes.indexOf(req.user._id);
  if (idx === -1) post.likes.push(req.user._id); else post.likes.splice(idx, 1);
  await post.save();
  res.json(post);
});

router.post('/:id/comment', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.comments.push({ author: req.user._id, text: req.body.text });
  await post.save();
  res.json(post);
});

module.exports = router;

