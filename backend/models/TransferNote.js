
const mongoose = require('mongoose');

const TransferNoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'SignUp', required: true },
  recipientEmail: { type: String, required: true },
  recipientAccountNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  transferNote: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TransferNote', TransferNoteSchema);