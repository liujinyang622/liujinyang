const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  type: { type: String, enum: ['text','emoji','image','video','file'], default: 'text' },
  content: { type: String },
  fileName: { type: String },
  createdAt: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Message', MessageSchema);
