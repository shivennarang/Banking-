import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function LoanForm() {
  const [loanType, setLoanType] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTenure, setLoanTenure] = useState('');
  const [startDate, setStartDate] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [businessDetails, setBusinessDetails] = useState('');
  const [studentDetails, setStudentDetails] = useState('');
  const [proofOfIdentity, setProofOfIdentity] = useState(null);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setProofOfIdentity(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate phone number length
    if (phoneNumber.length !== 10) {
      toast.error('Phone number must be 10 digits long.');
      return;
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
      toast.error('You must be at least 18 years old.');
      return;
    }

    // Validate loan amount against monthly income
    if (parseFloat(loanAmount) > parseFloat(monthlyIncome)) {
      toast.error('Loan amount cannot be greater than monthly income.');
      return;
    }

    const formData = new FormData();
    formData.append('loanType', loanType);
    formData.append('loanAmount', loanAmount);
    formData.append('loanTenure', loanTenure);
    formData.append('startDate', startDate);
    formData.append('fullName', fullName);
    formData.append('accountNumber', accountNumber);
    formData.append('email', email);
    formData.append('phoneNumber', phoneNumber);
    formData.append('address', address);
    formData.append('dob', dob);
    formData.append('employmentStatus', employmentStatus);
    formData.append('monthlyIncome', monthlyIncome);
    formData.append('employerName', employerName);
    formData.append('businessDetails', businessDetails);
    formData.append('studentDetails', studentDetails);
    formData.append('proofOfIdentity', proofOfIdentity);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/loans', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Loan application submitted successfully!');
      
      // Redirect to My Banks page and reload the window
      navigate('/mybanks');
      window.location.reload();
    } catch (error) {
      console.error('Error submitting loan application:', error);
      toast.error('Failed to submit loan application.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
      <h2 className="font-bold text-2xl">Loan Information</h2>
      <div className="flex flex-col gap-y-2">
        <label>Loan Type</label>
        <select value={loanType} onChange={(e) => setLoanType(e.target.value)} className="border p-2 rounded">
          <option value="">Select Loan Type</option>
          <option value="Personal Loan">Personal Loan</option>
          <option value="Home Loan">Home Loan</option>
          <option value="Car Loan">Car Loan</option>
          <option value="Education Loan">Education Loan</option>
          <option value="Business Loan">Business Loan</option>
        </select>
      </div>
      <div className="flex flex-col gap-y-2">
        <label>Loan Amount</label>
        <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="border p-2 rounded" />
      </div>
      <div className="flex flex-col gap-y-2">
        <label>Loan Tenure (in months)</label>
        <input type="number" value={loanTenure} onChange={(e) => setLoanTenure(e.target.value)} className="border p-2 rounded" />
      </div>
      <div className="flex flex-col gap-y-2">
        <label>Preferred Start Date</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded" />
      </div>
      <h2 className="font-bold text-2xl">Customer Details</h2>
      <div className="flex flex-col gap-y-2">
        <label>Full Name</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="border p-2 rounded" />
      </div>
      <div className="flex flex-col gap-y-2">
        <label>Account Number</label>
        <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="border p-2 rounded" />
      </div>
      <div className="flex flex-col gap-y-2">
        <label>Email Address</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 rounded" />
      </div>
      <div className="flex flex-col gap-y-2">
        <label>Phone Number</label>
        <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="border p-2 rounded" />
      </div>
      <div className="flex flex-col gap-y-2">
        <label>Address</label>
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="border p-2 rounded"></textarea>
      </div>
      <div className="flex flex-col gap-y-2">
        <label>Date of Birth</label>
        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="border p-2 rounded" />
      </div>
      <div className="flex flex-col gap-y-2">
        <label>Employment Status</label>
        <select value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)} className="border p-2 rounded">
          <option value="">Select Employment Status</option>
          <option value="Employed">Employed</option>
          <option value="Self-employed">Self-employed</option>
          <option value="Student">Student</option>
          <option value="Retired">Retired</option>
        </select>
      </div>
      <h2 className="font-bold text-2xl">Income Details</h2>
      <div className="flex flex-col gap-y-2">
        <label>Monthly Income</label>
        <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className="border p-2 rounded" />
      </div>
      {employmentStatus === 'Employed' && (
        <div className="flex flex-col gap-y-2">
          <label>Employer Name</label>
          <input type="text" value={employerName} onChange={(e) => setEmployerName(e.target.value)} className="border p-2 rounded" />
        </div>
      )}
      {employmentStatus === 'Self-employed' && (
        <div className="flex flex-col gap-y-2">
          <label>Business Details</label>
          <textarea value={businessDetails} onChange={(e) => setBusinessDetails(e.target.value)} className="border p-2 rounded"></textarea>
        </div>
      )}
      {loanType === 'Education Loan' && (
        <div className="flex flex-col gap-y-2">
          <label>Student Details</label>
          <textarea value={studentDetails} onChange={(e) => setStudentDetails(e.target.value)} className="border p-2 rounded"></textarea>
        </div>
      )}
      <h2 className="font-bold text-2xl">Supporting Documents Upload</h2>
      <div className="flex flex-col gap-y-2">
        <label>Proof of Identity</label>
        <input type="file" onChange={handleFileChange} className="border p-2 rounded" />
      </div>
      <button type="submit" className="bg-blue-500 text-white p-3 rounded mt-4">Submit Loan Application</button>
    </form>
  );
}

export default LoanForm;