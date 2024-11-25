import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import LoanForm from './LoanForm'; // Import the LoanForm component

function Loans() {
  const [loans, setLoans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoans = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('http://localhost:5000/api/loans', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setLoans(response.data);
        } catch (error) {
          console.error('Error fetching loans:', error);
        }
      }
    };
    fetchLoans();
  }, []);

  const calculateDaysLeft = (startDate, tenure) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(start.getMonth() + tenure);
    const today = new Date();
    const timeDiff = end - today;
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  const updatePaidAmount = async (loanId, newPaidAmount) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.put(`http://localhost:5000/api/loans/${loanId}`, {
          paidAmount: newPaidAmount,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoans(loans.map(loan => loan._id === loanId ? { ...loan, paidAmount: newPaidAmount } : loan));
      } catch (error) {
        console.error('Error updating paid amount:', error);
      }
    }
  };

  return (
    <div>
      <div className="p-6 flex flex-col gap-y-4">
        <h1 className="font-bold text-4xl text-blue-600">Loan Application</h1>
        <button onClick={() => setIsModalOpen(true)} className="text-blue-500 hover:underline mb-4">Apply for a Loan</button>
        <div className="flex flex-wrap -mx-2">
          {loans.map((loan, index) => (
            <div key={index} className="bg-[#e5318e] text-white p-6 mb-6 rounded-lg w-72 h-60 mx-2 flex-shrink-0 transition-shadow duration-300 hover:shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{loan.loanType}</h3>
                <p className="text-lg">{calculateDaysLeft(loan.startDate, loan.loanTenure)} days left</p>
              </div>
              <div className="flex justify-between mb-4">
                <p className="text-lg">Paid: ${loan.paidAmount}</p>
                <p className="text-lg">Total: ${loan.loanAmount}</p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <img 
                  src={`http://localhost:5000/${loan.proofOfIdentity}`} 
                  alt="Proof" 
                  className="w-16 h-16 rounded-full"
                />
              </div>
              <Slider
                min={0}
                max={loan.loanAmount}
                value={loan.paidAmount}
                onChange={(value) => updatePaidAmount(loan._id, value)}
              />
            </div>
          ))}
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-3/4 h-3/4 overflow-auto">
            <button onClick={() => setIsModalOpen(false)} className="text-red-500 hover:underline mb-4">Close</button>
            <LoanForm />
          </div>
        </div>
      )}
    </div>
  );
}

export default Loans;