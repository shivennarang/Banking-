const mongoose = require('mongoose');

const BankDetailsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SignUp',
    required: true,
  },
  // Remove bank name field
  routingNumber: {
    type: String,
    required: true,
  },
  bankBranch: {
    type: String,
  },
  accountHolderName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true, // Ensure account number is unique
  },
  accountType: {
    type: String,
    required: true,
  },
  userContact: {
    type: String,
    required: true,
  },
  currentBalance: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('BankDetails', BankDetailsSchema);