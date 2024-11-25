const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'SignUp', required: true },
  accountNumber: { type: String, required: true },
  cardType: { type: String, enum: ['debit', 'credit'], required: true },
  cardBrand: { type: String, enum: ['Rupay Global', 'Visa Global', 'Mastercard'], required: true },
  cardNumber: { type: String, required: true },
  cvv: { type: String, required: true } // Add CVV field
});

module.exports = mongoose.model('Card', cardSchema);