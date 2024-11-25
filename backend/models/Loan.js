const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'SignUp', required: true },
  loanType: { type: String, required: true },
  loanAmount: { type: Number, required: true },
  loanTenure: { type: Number, required: true },
  startDate: { type: Date, required: true },
  fullName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  dob: { type: Date, required: true },
  employmentStatus: { type: String, required: true },
  monthlyIncome: { type: Number, required: true },
  employerName: { type: String },
  businessDetails: { type: String },
  studentDetails: { type: String },
  proofOfIdentity: { type: String, required: true },
  paidAmount: { type: Number, default: 0 } // Add paidAmount field
});

module.exports = mongoose.model('Loan', loanSchema);