const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import the fs module
const SignUp = require('./models/SignUp');
const BankDetails = require('./models/BankDetails'); // Import the BankDetails model
const sgMail = require('@sendgrid/mail'); // For sending OTP emails
const Transaction = require('./models/Transaction'); // Import the Transaction model
const Budget = require('./models/Budget'); // Import the Budget model
const TransferNote = require('./models/TransferNote'); // Import the TransferNote model
const Notification = require('./models/Notification'); // Import the Notification model
const Loan = require('./models/Loan'); // Import the Loan model
const Card = require('./models/Card'); // Import the Card model

const app = express();
const PORT = 5000;
const SECRET_KEY = "sec123";

sgMail.setApiKey('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');

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files from the uploads folder

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

mongoose.connect('mongodb://localhost:27017/bank', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware to check token expiration
app.use((req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (token) {
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err && err.name === 'TokenExpiredError') {
        return res.status(401).send('Token expired');
      }
      req.user = decoded;
      next();
    });
  } else {
    next();
  }
});

// In-memory store for OTPs
const otpStore = {};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

app.post('/api/signup', async (req, res) => {
  const { firstName, lastName, address, state, postalCode, dob, email, password } = req.body;

  // Server-side validation
  if (!firstName || !lastName || !address || !state || !postalCode || !dob || !email || !password) {
    return res.status(400).send('All fields are required.');
  }

  if (password.length < 8) {
    return res.status(400).send('Password must be at least 8 characters long.');
  }

  const today = new Date();
  const birthDate = new Date(dob);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age < 18) {
    return res.status(400).send('You must be at least 18 years old.');
  }

  try {
    const newUser = new SignUp({ firstName, lastName, address, state, postalCode, dob, email, password });
    await newUser.save();
    res.status(201).send('User created');
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send('Error creating user');
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await SignUp.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(400).send('Invalid email or password.');
    }
    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Server error');
  }
});

app.get('/api/user', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(401).send('Unauthorized');
  }
});

// OTP generation and email sending function
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp) => {
  const msg = {
    to: `${email}`,
    from: `narangshiven88@gmail.com`, // Use the email address or domain you verified with SendGrid
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It is valid for one time only.`,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending OTP email:', error.response ? error.response.body : error);
    throw new Error('Error sending OTP email');
  }
};

// Route to send OTP
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await SignUp.findOne({ email });

    if (!user) {
      return res.status(400).send('User not found');
    }

    const otp = generateOTP();
    otpStore[email] = otp; // Store OTP in memory
    console.log(`Generated OTP: ${otp} for user: ${user.email}`);

    await sendOTPEmail(email, otp);
    res.status(200).send('OTP sent successfully');
  } catch (error) {
    console.error('Error sending OTP:', error.response ? error.response.body : error);
    res.status(500).send('Error sending OTP');
  }
});

// Route to save bank details
app.post('/api/bank-details', async (req, res) => {
  const { token, routingNumber, bankBranch, accountHolderName, accountNumber, accountType, userContact, otp } = req.body;

  // Server-side validation
  if (!routingNumber || !accountHolderName || !accountNumber || !accountType || !userContact || !otp) {
    return res.status(400).send('All fields are required.');
  }

  if (accountNumber.length !== 12) {
    return res.status(400).send('Account number must be 12 digits long.');
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const storedOtp = otpStore[user.email];
    console.log(`Stored OTP: ${storedOtp}, Received OTP: ${otp}`);

    // Verify OTP
    if (storedOtp !== otp) {
      console.error(`Invalid OTP: expected ${storedOtp}, received ${otp}`);
      return res.status(400).send('Invalid OTP');
    }

    // Clear OTP from memory after verification
    delete otpStore[user.email];

    // Generate random current balance within a specific range (e.g., $100 to $10,000)
    let currentBalance = (Math.random() * (10000 - 100) + 100).toFixed(2);
    currentBalance = parseFloat(currentBalance);

    console.log(`Generated current balance: ${currentBalance}`);

    const newBankDetails = new BankDetails({
      userId: user._id,
      routingNumber,
      bankBranch,
      accountHolderName,
      accountNumber,
      accountType,
      userContact,
      currentBalance,
    });

    await newBankDetails.save();

    // Create a new notification
    const newNotification = new Notification({
      userId: user._id,
      message: `Connected to bank`
    });
    await newNotification.save();

    res.status(201).send('Bank details saved successfully');
  } catch (error) {
    if (error.code === 11000) {
      // Handle unique constraint error
      console.error('Account number already exists:', error);
      res.status(400).send('Account number already exists');
    } else {
      console.error('Error saving bank details:', error);
      res.status(500).send('Error saving bank details');
    }
  }
});

// Route to fetch bank details for the user
app.get('/api/bank-details', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const bankDetails = await BankDetails.find({ userId: user._id });

    res.json({
      bankDetails // Ensure the response contains the bankDetails array
    });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    res.status(500).send('Error fetching bank details');
  }
});

// Route to fetch account number for a specific bank
app.get('/api/bank-details/:bankName', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const { bankName } = req.params;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const bankDetail = await BankDetails.findOne({ userId: user._id, bankName });

    if (!bankDetail) {
      return res.status(404).send('Bank details not found');
    }

    res.json(bankDetail);
  } catch (error) {
    console.error('Error fetching bank details:', error);
    res.status(500).send('Error fetching bank details');
  }
});

// Route to fetch bank names for the user
app.get('/api/bank-names', async (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const bankDetails = await BankDetails.find({ userId: user._id });
    const bankNames = bankDetails.map(bank => bank.bankName);

    res.json({ bankNames });
  } catch (error) {
    console.error('Error fetching bank names:', error);
    res.status(500).send('Error fetching bank names');
  }
});

// Route to add a transaction
app.post('/api/transactions', async (req, res) => {
  const { token, amount, status, date, category, description, accountNumber } = req.body;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const bankDetail = await BankDetails.findOne({ userId: user._id, accountNumber });

    if (!bankDetail) {
      return res.status(404).send('Bank details not found');
    }

    // Update the current balance
    bankDetail.currentBalance += Number(amount);
    await bankDetail.save();

    const newTransaction = new Transaction({
      userId: user._id,
      amount: Number(amount),
      status,
      date,
      category,
      description,
      accountNumber, // Include account number
      bankName: bankDetail.bankBranch // Include bank name
    });

    await newTransaction.save();

    // Create a new notification
    const newNotification = new Notification({
      userId: user._id,
      message: `Transaction added: ${description}`
    });
    await newNotification.save();

    res.status(201).send('Transaction added successfully');
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).send('Error adding transaction');
  }
});

// Route to fetch transactions for the user
app.get('/api/transactions', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const transactions = await Transaction.find({ userId: user._id });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).send('Error fetching transactions');
  }
});

// Route to add a budget
app.post('/api/budgets', async (req, res) => {
  const { token, description, goal } = req.body;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const bankDetail = await BankDetails.findOne({ userId: user._id });

    if (!bankDetail) {
      return res.status(404).send('Bank details not found');
    }

    if (goal > bankDetail.currentBalance) {
      return res.status(400).send('Budget goal exceeds current balance');
    }

    const newBudget = new Budget({
      userId: user._id,
      description,
      goal,
      spent: 0, // Initialize spent amount to 0
    });

    await newBudget.save();
    res.status(201).send('Budget added successfully');
  } catch (error) {
    console.error('Error adding budget:', error);
    res.status(500).send('Error adding budget');
  }
});

// Route to fetch budgets for the user
app.get('/api/budgets', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const budgets = await Budget.find({ userId: user._id });
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).send('Error fetching budgets');
  }
});

// Route to update the spent amount for a budget
app.put('/api/budgets/:id', async (req, res) => {
  const { token, spent } = req.body;
  const { id } = req.params;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const budget = await Budget.findById(id);

    if (!budget) {
      return res.status(404).send('Budget not found');
    }

    const difference = spent - budget.spent;
    const bankDetail = await BankDetails.findOne({ userId: user._id });

    if (!bankDetail) {
      return res.status(404).send('Bank details not found');
    }

    bankDetail.currentBalance -= difference;
    await bankDetail.save();

    budget.spent = spent;
    await budget.save();

    res.status(200).send('Budget updated successfully');
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).send('Error updating budget');
  }
});

const sendTransferEmail = async (senderName, recipientEmail, amount, note) => {
  const msg = {
    to: `${recipientEmail}`,
    from: `narangshiven88@gmail.com`, // Use the email address or domain you verified with SendGrid
    subject: 'Transfer Notification',
    text: `You have received an amount of $${Math.abs(amount)} from ${senderName}. Transfer Note: ${note}`, // Use Math.abs to remove negative sign
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending transfer email:', error.response ? error.response.body : error);
    throw new Error('Error sending transfer email');
  }
};

app.post('/api/transfer', async (req, res) => {
  const { token, recipientEmail, recipientAccountNumber, amount, transferNote } = req.body;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const bankDetail = await BankDetails.findOne({ userId: user._id });

    if (!bankDetail) {
      return res.status(404).send('Bank details not found');
    }

    if (amount > bankDetail.currentBalance) {
      return res.status(400).send('Transfer amount exceeds current balance');
    }

    // Deduct the transfer amount from the balance
    bankDetail.currentBalance -= amount;
    await bankDetail.save();

    const senderName = `${user.firstName} ${user.lastName}`;

    const newTransaction = new Transaction({
      userId: user._id,
      amount,
      status: 'Success', // Use 'Success' as the status value
      date: new Date(),
      category: 'transfer',
      description: transferNote,
      bankName: 'N/A',
      accountNumber: recipientAccountNumber
    });

    await newTransaction.save();

    const newTransferNote = new TransferNote({
      userId: user._id,
      recipientEmail,
      recipientAccountNumber,
      amount,
      transferNote
    });

    await newTransferNote.save();
    await sendTransferEmail(senderName, recipientEmail, amount, transferNote);

    // Create a new notification
    const newNotification = new Notification({
      userId: user._id,
      message: `Transfer made to ${recipientEmail}: ${transferNote}`
    });
    await newNotification.save();

    res.status(201).send('Transfer successful and email sent');
  } catch (error) {
    console.error('Error during transfer:', error);
    res.status(500).send('Error during transfer');
  }
});

// Route to fetch notifications for the user
app.get('/api/notifications', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const notifications = await Notification.find({ userId: user._id }).sort({ time: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).send('Error fetching notifications');
  }
});

// Route to mark notifications as read
app.put('/api/notifications/read', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    await Notification.updateMany({ userId: user._id, read: false }, { read: true });
    res.status(200).send('Notifications marked as read');
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).send('Error marking notifications as read');
  }
});

// Route to store a notification
app.post('/api/notifications', async (req, res) => {
  const { token, message } = req.body;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const newNotification = new Notification({
      userId: user._id,
      message
    });

    await newNotification.save();
    res.status(201).send('Notification saved successfully');
  } catch (error) {
    console.error('Error saving notification:', error);
    res.status(500).send('Error saving notification');
  }
});

// Route to delete all notifications for the user
app.delete('/api/notifications', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    await Notification.deleteMany({ userId: user._id });
    res.status(200).send('All notifications deleted successfully');
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).send('Error deleting notifications');
  }
});

// Route to handle loan applications
app.post('/api/loans', upload.single('proofOfIdentity'), async (req, res) => {
  const {
    loanType, loanAmount, loanTenure, startDate, fullName, accountNumber, email, phoneNumber, address, dob,
    employmentStatus, monthlyIncome, employerName, businessDetails, studentDetails
  } = req.body;

  const proofOfIdentity = req.file ? req.file.path : null;

  if (!proofOfIdentity) {
    return res.status(400).send('Proof of identity is required.');
  }

  // Validate phone number length
  if (phoneNumber.length !== 10) {
    return res.status(400).send('Phone number must be 10 digits long.');
  }

  // Validate age
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age < 18) {
    return res.status(400).send('You must be at least 18 years old.');
  }

  try {
    const decoded = jwt.verify(req.headers.authorization.split(' ')[1], SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const newLoan = new Loan({
      userId: user._id,
      loanType,
      loanAmount,
      loanTenure,
      startDate,
      fullName,
      accountNumber,
      email,
      phoneNumber,
      address,
      dob,
      employmentStatus,
      monthlyIncome,
      employerName,
      businessDetails,
      studentDetails,
      proofOfIdentity
    });

    await newLoan.save();

    // Create a new notification
    const newNotification = new Notification({
      userId: user._id,
      message: `Loan application submitted: ${loanType}`
    });
    await newNotification.save();

    res.status(201).send('Loan application submitted successfully');
  } catch (error) {
    console.error('Error submitting loan application:', error);
    res.status(500).send('Error submitting loan application');
  }
});

// Route to fetch loans for the user
app.get('/api/loans', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const loans = await Loan.find({ userId: user._id });
    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).send('Error fetching loans');
  }
});

// Route to update the paid amount for a loan
app.put('/api/loans/:id', async (req, res) => {
  const { paidAmount } = req.body;
  const { id } = req.params;

  try {
    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).send('Loan not found');
    }

    loan.paidAmount = paidAmount;
    await loan.save();

    res.status(200).send('Loan updated successfully');
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(500).send('Error updating loan');
  }
});

// Function to generate a random 16-digit card number
const generateCardNumber = () => {
  let cardNumber = '';
  for (let i = 0; i < 16; i++) {
    cardNumber += Math.floor(Math.random() * 10).toString();
  }
  return cardNumber;
};

// Function to generate a random 3-digit CVV number
const generateCVV = () => {
  return Math.floor(100 + Math.random() * 900).toString();
};

app.post('/api/request-card', async (req, res) => {
  const { token, accountNumber, cardType, cardBrand } = req.body;

  if (!cardBrand) {
    return res.status(400).send('Card brand is required.');
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    if (cardType === 'debit') {
      const existingDebitCard = await Card.findOne({ userId: user._id, accountNumber, cardType: 'debit' });
      if (existingDebitCard) {
        return res.status(400).send('Only one debit card is allowed per account.');
      }
    }

    const cardNumber = generateCardNumber();
    const cvv = generateCVV(); // Generate CVV number

    const newCard = new Card({
      userId: user._id,
      accountNumber,
      cardType,
      cardBrand,
      cardNumber,
      cvv // Store CVV number
    });

    await newCard.save();

    // Create a new notification
    const newNotification = new Notification({
      userId: user._id,
      message: `New ${cardBrand} ${cardType} card issued for account ${accountNumber}`
    });
    await newNotification.save();

    res.status(201).send('Card issued successfully');
  } catch (error) {
    console.error('Error issuing card:', error);
    res.status(500).send('Error issuing card');
  }
});

// Route to fetch all cards for the user
app.get('/api/cards', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const { accountNumber, cardType } = req.query;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await SignUp.findById(decoded.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const cards = await Card.find({ userId: user._id, accountNumber, cardType });
    res.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).send('Error fetching cards');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
