const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Group = require('../models/Group');

router.post('/', auth, async (req, res) => {
  const { name, memberIds } = req.body;
  const group = new Group({ name, members: [req.user._id, ...(memberIds || [])], admins: [req.user._id] });
  await group.save();
  res.json(group);
});

router.get('/:id', auth, async (req, res) => {
  const group = await Group.findById(req.params.id).populate('members', 'username displayName avatarUrl');
  res.json(group);
});

router.post('/:id/join', auth, async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: 'Not found' });
  if (!group.members.includes(req.user._id)) group.members.push(req.user._id);
  await group.save();
  res.json(group);
});

module.exports = router;

