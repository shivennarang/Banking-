
const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SignUp',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  goal: {
    type: Number,
    required: true,
  },
  spent: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('Budget', BudgetSchema);