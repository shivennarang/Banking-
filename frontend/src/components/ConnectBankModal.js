import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ConnectBankModal() {
  const [formData, setFormData] = useState({
    routingNumber: '',
    bankBranch: '',
    accountHolderName: '',
    accountNumber: '',
    accountType: '',
    userContact: '',
    otp: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOTP = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/send-otp', {
        email: formData.userContact,
      });

      if (response.status === 200) {
        toast.success('OTP sent successfully! It is valid for one time only.', { position: "top-right" });
      }
    } catch (error) {
      console.error('Error sending OTP:', error.response ? error.response.data : error);
      toast.error('Error sending OTP', { position: "top-right" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token'); // Assuming the token is stored in localStorage

    if (formData.accountNumber.length !== 12) {
      toast.error('Account number must be 12 digits long.', { position: "top-right" });
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/bank-details', {
        ...formData,
        token,
      });

      if (response.status === 201) {
        toast.success('Bank details saved successfully!', { position: "top-right" });

        // Store a notification message
        await axios.post('http://localhost:5000/api/notifications', {
          token,
          message: `Connected to bank`
        });

        setTimeout(() => {
          window.location.href = '/dashboard'; // Redirect to dashboard page
        }, 2000); // Wait for 2 seconds before redirecting
      }
    } catch (error) {
      console.error('Error saving bank details:', error.response ? error.response.data : error);
      if (error.response && error.response.status === 401 && error.response.data === 'Token expired') {
        toast.error('Session expired. Please log in again.', { position: "top-right" });
        setTimeout(() => {
          window.location.href = '/login'; // Redirect to login page
        }, 2000); // Wait for 2 seconds before redirecting
      } else if (error.response && error.response.status === 400 && error.response.data === 'Account number already exists') {
        toast.error('Account number already exists. Please use a different account number.', { position: "top-right" });
      } else {
        toast.error('Error saving bank details', { position: "top-right" });
      }
    }
  };

  return (
    <div className="flex flex-col items-start p-8 gap-y-4">
      <h1 className="text-4xl font-bold mb-2">Connect Account</h1>
      <p className="text-lg text-gray-600 mb-6">Experience seamless banking</p>
      <form className="w-full max-w-lg flex flex-col gap-y-3" onSubmit={handleSubmit}>
        <div className="mb-4 flex items-center">
          <label className="block text-lg text-gray-700 w-1/3 mr-4">Routing Number / IFSC Code:</label>
          <input type="text" name="routingNumber" placeholder="Enter routing number / IFSC code" className="w-2/3 px-3 py-2 border border-gray-500 rounded" value={formData.routingNumber} onChange={handleChange} required />
        </div>
        <div className="mb-4 flex items-center">
          <label className="block text-lg text-gray-700 w-1/3 mr-4">Bank Branch (Optional):</label>
          <input type="text" name="bankBranch" placeholder="Enter bank branch (optional)" className="w-2/3 px-3 py-2 border border-gray-500 rounded" value={formData.bankBranch} onChange={handleChange} />
        </div>
        <div className="mb-4 flex items-center">
          <label className="block text-lg text-gray-700 w-1/3 mr-4">Account Holder Name:</label>
          <input type="text" name="accountHolderName" placeholder="Enter account holder name" className="w-2/3 px-3 py-2 border border-gray-500 rounded" value={formData.accountHolderName} onChange={handleChange} required />
        </div>
        <div className="mb-4 flex items-center">
          <label className="block text-lg text-gray-700 w-1/3 mr-4">Account Number:</label>
          <input type="text" name="accountNumber" placeholder="Enter account number" className="w-2/3 px-3 py-2 border border-gray-500 rounded" value={formData.accountNumber} onChange={handleChange} required />
        </div>
        <div className="mb-4 flex items-center">
          <label className="block text-lg text-gray-700 w-1/3 mr-4">Account Type:</label>
          <input type="text" name="accountType" placeholder="Enter account type" className="w-2/3 px-3 py-2 border border-gray-500 rounded" value={formData.accountType} onChange={handleChange} required />
        </div>
        <div className="mb-4 flex items-center">
          <label className="block text-lg text-gray-700 w-1/3 mr-4">User Email (for Verification):</label>
          <input type="text" name="userContact" placeholder="Enter email for verification" className="w-1/2 px-3 py-2 border border-gray-500 rounded" value={formData.userContact} onChange={handleChange} required />
          <button type="button" onClick={handleSendOTP} className="ml-4 w-1/3 bg-blue-500 text-white py-2 px-4 rounded">Send OTP</button>
        </div>
        <div className="mb-4 flex items-center">
          <label className="block text-lg text-gray-500 w-1/3 mr-4">Enter the OTP sent:</label>
          <input type="text" name="otp" placeholder="Enter the OTP sent" className="w-2/3 px-3 py-2 border border-gray-500 rounded" value={formData.otp} onChange={handleChange} required />
        </div>
        <div className="mb-4 flex items-center">
          <input type="checkbox" name="consent" required className="mr-2" />
          <label className="block text-lg text-gray-700">
            I authorize the app to connect to my bank account and access necessary information as per the terms.
          </label>
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded text-lg">
          Submit
        </button>
      </form>
    </div>
  );
}

export default ConnectBankModal;