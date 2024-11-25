import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify'; // Assuming react-toastify is used for toasts

function PaymentTransfer() {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [transferNote, setTransferNote] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientAccountNumber, setRecipientAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
        const response = await axios.get('http://localhost:5000/api/bank-details', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const bankDetails = response.data.bankDetails || [];
        setBankAccounts(bankDetails.map((bank, index) => ({ id: `bank${index + 1}`, accountNumber: bank.accountNumber })));
      } catch (error) {
        console.error('Error fetching bank accounts:', error);
      }
    };

    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/bank-details', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.bankDetails.length > 0) {
          setBalance(response.data.bankDetails[0].currentBalance);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBankAccounts();
    fetchBalance();
  }, []);

  const handleTransfer = async () => {
    if (parseFloat(amount) > balance) {
      toast.error('Transfer amount exceeds current balance!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/transfer', {
        token,
        recipientEmail,
        recipientAccountNumber,
        amount: -Math.abs(parseFloat(amount)), // Ensure the amount is a negative number for deduction
        transferNote
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Transfer successful and email sent!');
      
      // Reload the page to show updated notifications
      window.location.reload();
    } catch (error) {
      console.error('Error during transfer:', error);
      toast.error('Transfer failed!');
    }
  };

  return (
    <div className="p-6 flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-3">
        <h1 className="font-bold text-4xl">Payment Transfer</h1>
        <p className="text-gray-500 text-lg">
          Please provide any specific details or notes related to the payment
          transfer.
        </p>
      </div>
      <div className="flex flex-col gap-y-3 mt-6">
        <h2 className="font-bold text-2xl">Transfer Details</h2>
        <p className="text-gray-500 text-lg">
          Enter the details of the recipient.
        </p>
      </div>
      <div className="flex mt-6 justify-between">
        <div className="flex flex-col justify-around">
          <h2 className="text-gray-600 text-2xl">Select Source Bank</h2>
          <p className="text-gray-500 text-lg">
            Select the bank account you want to transfer funds from.
          </p>
        </div>
        <select className="border border-gray-300 p-3 rounded w-64 text-lg">
          {bankAccounts.map(account => (
            <option key={account.id} value={account.id}>{account.accountNumber ? `****${account.accountNumber.slice(-4)}` : 'N/A'}</option>
          ))}
        </select>
      </div>
      <div className="flex mt-6">
        <div className="flex flex-col justify-between">
          <h2 className="text-gray-600 text-2xl">Transfer Note (optional)</h2>
          <p className="text-gray-500 text-lg">
            Please provide any additional information or instructions related to the transfer.
          </p>
        </div>
        <textarea
          className="border border-gray-300 p-3 rounded w-1/2 text-lg"
          rows="3"
          value={transferNote}
          onChange={(e) => setTransferNote(e.target.value)}
        ></textarea>
      </div>
      <div className="flex flex-col gap-y-3 mt-10">
        <h2 className="font-bold text-2xl">Bank Account Details</h2>
        <p className="text-gray-500 text-lg">
          Enter the bank account details of the recipient.
        </p>
        <div className="flex items-center gap-x-4">
          <label className="text-gray-600 text-lg w-1/3">Recipient's Email Address</label>
          <input
            type="email"
            placeholder="Recipient's Email Address"
            className="border border-gray-300 p-3 rounded w-2/3 text-lg"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-x-4 mt-3">
          <label className="text-gray-600 text-lg w-1/3">Recipient's Bank Account Number</label>
          <input
            type="text"
            placeholder="Recipient's Bank Account Number"
            className="border border-gray-300 p-3 rounded w-2/3 text-lg"
            value={recipientAccountNumber}
            onChange={(e) => setRecipientAccountNumber(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-x-4 mt-3">
          <label className="text-gray-600 text-lg w-1/3">Amount</label>
          <input
            type="number"
            placeholder="Amount"
            className="border border-gray-300 p-3 rounded w-2/3 text-lg"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button
          className="bg-blue-500 text-white p-3 rounded mt-6 w-1/3 mx-auto"
          onClick={handleTransfer}
        >
          Transfer Funds
        </button>
      </div>
    </div>
  );
}

export default PaymentTransfer;
