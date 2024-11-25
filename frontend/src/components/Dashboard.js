import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useState, useEffect } from 'react';
import ReactTable from 'react-table-6';
import 'react-table-6/react-table.css';
import axios from 'axios';
import './Dashboard.css'; // Import the CSS file for custom scrollbar styles
import { Modal, Button } from 'react-bootstrap'; // Import Modal and Button from react-bootstrap
import Slider from 'rc-slider'; // Import Slider from rc-slider
import 'rc-slider/assets/index.css'; // Import Slider CSS

// Register the required elements and controllers
ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [totalBalance, setTotalBalance] = useState('$0'); // Define totalBalance
  const [selectedBank, setSelectedBank] = useState('Select The Bank');
  const [selectedBankBalance, setSelectedBankBalance] = useState(0); // Add state for selected bank balance
  const [selectedAccountNumber, setSelectedAccountNumber] = useState(''); // Add state for selected account number
  const [pieData, setPieData] = useState({
    labels: [],
    datasets: [
      {
        data: [], // Initialize with empty array
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
      }
    ]
  });
  const [transactions, setTransactions] = useState([]); // Initialize with empty array
  const [budgets, setBudgets] = useState([
    { category: 'Groceries', icon: 'fas fa-shopping-cart', total: 0, spent: 0 },
    { category: 'Utilities', icon: 'fas fa-bolt', total: 0, spent: 0 },
    { category: 'Entertainment', icon: 'fas fa-film', total: 0, spent: 0 },
  ]);
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    status: 'Success',
    date: '',
    category: '',
    description: ''
  });
  const [bankDetails, setBankDetails] = useState([]); // Add state to store bank details
  const [transactionType, setTransactionType] = useState('added'); // Add state for transaction type
  const [showBudgetModal, setShowBudgetModal] = useState(false); // State to control budget modal visibility
  const [newBudget, setNewBudget] = useState({
    description: '',
    goal: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchBankDetails = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get('http://localhost:5000/api/bank-details', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bankDetails = response.data.bankDetails || [];
        const accountNumbers = bankDetails.map(bank => `****${bank.accountNumber.slice(-4)}`);
        const bankBalances = bankDetails.map(bank => bank.currentBalance);
        const totalBalance = bankBalances.reduce((acc, balance) => acc + balance, 0);

        setTotalBalance(`$${totalBalance.toFixed(2)}`);
        setPieData({
          labels: accountNumbers,
          datasets: [
            {
              data: bankBalances,
              backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
              hoverBackgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
            }
          ]
        });
        setBankDetails(bankDetails); // Store bank details, ensure it's an array
      } catch (error) {
        console.error('Error fetching bank details:', error);
      }
    }
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction({ ...newTransaction, [name]: value });
  };

  const handleTransactionTypeChange = (e) => {
    setTransactionType(e.target.value);
  };

  const fetchTransactions = async (accountNumber) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`http://localhost:5000/api/transactions?accountNumber=${accountNumber}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const transactions = response.data.slice(0, 5); // Limit to 5 recent transactions
        setTransactions(transactions);

        // Update the bank balance based on the transactions
        const bankDetail = bankDetails.find(bank => bank.accountNumber === accountNumber);
        if (bankDetail) {
          let updatedBalance = bankDetail.currentBalance;
          transactions.forEach(transaction => {
            if (transaction.amount < 0) {
              updatedBalance += transaction.amount; // Deduct amount
            } else {
              updatedBalance += transaction.amount; // Add amount
            }
          });
          setSelectedBankBalance(updatedBalance);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    }
  };

  const handleAddTransaction = async () => {
    if (!selectedAccountNumber) {
      console.error('Account number is not set');
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const amount = transactionType === 'deducted' ? -Math.abs(Number(newTransaction.amount)) : Math.abs(Number(newTransaction.amount));
        await axios.post('http://localhost:5000/api/transactions', {
          token,
          ...newTransaction,
          amount,
          accountNumber: selectedAccountNumber // Use selected account number
        });

        // Store notification
        await axios.post('http://localhost:5000/api/notifications', {
          token,
          message: `Transaction added: ${newTransaction.description}`
        });

        setShowModal(false);
        fetchTransactions(selectedAccountNumber); // Fetch transactions again to update the list
        fetchBankDetails(); // Fetch bank details again to update the balance
        fetchNotifications(); // Fetch notifications again to update the unread count

        // Reload the page to show notifications
        window.location.reload();
      } catch (error) {
        console.error('Error adding transaction:', error.response ? error.response.data : error);
      }
    }
  };

  const handleBudgetModalChange = (e) => {
    const { name, value } = e.target;
    setNewBudget({ ...newBudget, [name]: value });
  };

  const handleAddBudget = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.post('http://localhost:5000/api/budgets', {
          token,
          ...newBudget,
        });
        setShowBudgetModal(false);
        fetchBudgets(); // Fetch budgets again to update the list
      } catch (error) {
        console.error('Error adding budget:', error);
      }
    }
  };

  const handleSpentChange = async (budgetId, newSpent) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const budget = budgets.find(b => b._id === budgetId);
        const difference = newSpent - budget.spent;
        const updatedBalance = parseFloat(totalBalance.replace('$', '')) - difference;

        await axios.put(`http://localhost:5000/api/budgets/${budgetId}`, {
          token,
          spent: newSpent,
        });

        setTotalBalance(`$${updatedBalance.toFixed(2)}`);
        fetchBudgets(); // Fetch budgets again to update the list
        fetchBankDetails(); // Fetch bank details again to update the balance
      } catch (error) {
        console.error('Error updating spent amount:', error);
      }
    }
  };

  const fetchBudgets = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get('http://localhost:5000/api/budgets', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBudgets(response.data);
      } catch (error) {
        console.error('Error fetching budgets:', error);
      }
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data);
        setUnreadCount(response.data.filter(notification => !notification.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('http://localhost:5000/api/user', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserName(response.data.firstName + ' ' + response.data.lastName);
          setUserEmail(response.data.email);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
    fetchBankDetails();
    fetchBudgets();
  }, []);

  const handleBankSelection = async (accountNumber, index) => {
    setSelectedBank(accountNumber);
    setSelectedBankBalance(pieData.datasets && pieData.datasets[0] && pieData.datasets[0].data ? pieData.datasets[0].data[index] || 0 : 0); // Update selected bank balance

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`http://localhost:5000/api/bank-details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bankDetails = response.data.bankDetails;
        const selectedBankDetail = bankDetails.find(bank => bank.accountNumber.endsWith(accountNumber.replace('****', '')));
        if (selectedBankDetail) {
          setSelectedAccountNumber(selectedBankDetail.accountNumber); // Set selected account number
          console.log(`Selected account number: ${selectedBankDetail.accountNumber}`); // Debugging
          fetchTransactions(selectedBankDetail.accountNumber); // Fetch transactions for the selected account
        } else {
          console.error(`No account number found for account: ${accountNumber}`);
        }
      } catch (error) {
        console.error('Error fetching account number:', error);
      }
    }
  };

  const columns = [
    { 
      Header: 'Amount', 
      accessor: 'amount', 
      headerClassName: 'text-2xl text-gray-700', 
      className: 'text-center',
      Cell: ({ value }) => (
        <span className={value < 0 ? 'text-red-500' : 'text-green-500'}>
          {value < 0 ? `-$${Math.abs(value).toFixed(2)}` : `+$${value.toFixed(2)}`}
        </span>
      )
    },
    { Header: 'Status', accessor: 'status', headerClassName: 'text-2xl text-gray-700', className: 'bg-green-100 text-green-700 rounded text-center' },
    { Header: 'Date', accessor: 'date', headerClassName: 'text-2xl text-gray-700', className: 'text-gray-500 text-center' },
    { Header: 'Category', accessor: 'category', headerClassName: 'text-2xl text-gray-700', className: 'bg-green-100 text-green-700 rounded text-center' },
    { Header: 'Description', accessor: 'description', headerClassName: 'text-2xl text-gray-700', className: 'text-center' },
  ];

  return (
    <div className="flex justify-between h-screen font-roboto p-6 gap-6 w-full">
      {/* Adjusted position */}
      <div className="w-2/3 overflow-auto custom-scrollbar">
        {/* Info */}
        <h1 className="text-4xl font-semibold">Welcome, <span className="text-blue-600">{userName}</span></h1>
        <p className="text-lg mt-2 text-gray-600">Access and manage your account and transactions efficiently.</p>
        <div className="mt-6 p-6 border rounded-lg shadow-lg bg-white relative">
          <h2 className="text-2xl font-bold mb-4">Account Overview</h2>
          <div className="flex flex-row justify-between items-center">
            <div className="w-1/4">
              {pieData.datasets && pieData.datasets[0] && pieData.datasets[0].data && pieData.datasets[0].data.length > 0 ? (
                <Pie data={pieData} />
              ) : (
                <p>No data available</p>
              )}
            </div>
            <div className="w-3/4 pl-6">
              <p className="text-xl">{pieData.labels ? pieData.labels.length : 0} Bank Accounts</p>
              <p className="text-xl mt-4 text-gray-600">Total Current Balance</p>
              <p className="text-2xl font-bold mt-2">{totalBalance}</p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          {/* Recent Transactions */}
          <h2 className="text-3xl font-bold mb-4">Recent Transactions</h2>
          <div className="flex flex-row space-x-8 mb-4 items-center">
            {pieData.labels && pieData.labels.map((accountNumber, index) => (
              <span
                key={accountNumber}
                className={`cursor-pointer text-xl ${selectedBank === accountNumber ? 'text-blue-600 font-bold  border-b-2 border-blue-600 pb-1 transition duration-300 ease-in-out transform hover:scale-105' : 'text-gray-500'}`}
                onClick={() => handleBankSelection(accountNumber, index)}
              >
                {accountNumber}
              </span>
            ))}
            <Button variant="primary" className="ml-auto" onClick={() => setShowModal(true)}>
              <i className="fas fa-plus"></i> Add Transaction
            </Button>
          </div>
          {selectedBank && (
            <div className="p-4 border rounded-lg shadow-lg bg-blue-100 mb-4 relative">
              <div className="absolute top-2 right-2 bg-green-100 text-green-700 font-bold rounded px-2 py-1">
                Savings
              </div>
              <div className="flex items-center">
                <i className="fas fa-university text-3xl text-blue-800 mr-4"></i>
                <div>
                  <h3 className="text-xl font-bold">{selectedBank}</h3>
                  <p className="text-lg font-bold">${selectedBankBalance.toFixed(2)}</p> {/* Show selected bank balance */}
                </div>
              </div>
            </div>
          )}
          <ReactTable
            data={transactions} // Display transactions
            columns={columns}
            defaultPageSize={5}
            className="-striped -highlight"
            showPagination={false}
            getTheadThProps={() => ({
              style: {
                backgroundColor: '#ffffff',
                color: '#4a4a4a',
                fontSize: '1.25rem',
              },
            })}
          />
        </div>
      </div>
      <div className="w-1/3 justify-center overflow-auto custom-scrollbar ">
        {/* Cart */}
        <div className="p-6 border rounded-lg shadow-lg bg-white mx-auto">
          <div className="h-32 rounded-t-lg bg-cover" style={{ backgroundImage: "url('/grad.png')" }}></div>
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-2">{userName}</h2>
            <p className="text-lg text-gray-600 mb-4">{userEmail}</p>
            <h3 className="text-xl font-bold mb-2">Budgets</h3>
            <Button variant="primary" className="mb-4" onClick={() => setShowBudgetModal(true)}>
              <i className="fas fa-plus"></i> Add Budget
            </Button>
            <ul className="space-y-4">
              {budgets.map((budget) => (
                <li key={budget._id} className="p-4 border rounded-lg shadow-sm bg-gray-100">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-wallet text-2xl text-blue-800 mr-4"></i>
                    <h4 className="text-xl font-bold">{budget.description}</h4>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2.5 mb-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(budget.spent / budget.goal) * 100}%` }}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Spent: ${budget.spent}</span>
                    <span>Goal: ${budget.goal}</span>
                  </div>
                  <Slider
                    min={0}
                    max={budget.goal}
                    value={budget.spent}
                    onChange={(value) => handleSpentChange(budget._id, value)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Add Transaction</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-gray-900">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form>
              <div className="form-group mb-4">
                <label className="block text-lg text-gray-700">Amount</label>
                <input type="number" className="w-full px-3 py-2 border rounded" name="amount" value={newTransaction.amount} onChange={handleModalChange} />
              </div>
              <div className="form-group mb-4">
                <label className="block text-lg text-gray-700">Status</label>
                <select className="w-full px-3 py-2 border rounded" name="status" value={newTransaction.status} onChange={handleModalChange}>
                  <option value="Success">Success</option>
                  <option value="Failed">Failed</option>
                  <option value="Processing">Processing</option>
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="block text-lg text-gray-700">Date</label>
                <input type="date" className="w-full px-3 py-2 border rounded" name="date" value={newTransaction.date} onChange={handleModalChange} />
              </div>
              <div className="form-group mb-4">
                <label className="block text-lg text-gray-700">Category</label>
                <input type="text" className="w-full px-3 py-2 border rounded" name="category" value={newTransaction.category} onChange={handleModalChange} />
              </div>
              <div className="form-group mb-4">
                <label className="block text-lg text-gray-700">Description</label>
                <input type="text" className="w-full px-3 py-2 border rounded" name="description" value={newTransaction.description} onChange={handleModalChange} />
              </div>
              <div className="form-group mb-4">
                <label className="block text-lg text-gray-700">Transaction Type</label>
                <div className="flex items-center">
                  <input type="radio" name="transactionType" value="added" checked={transactionType === 'added'} onChange={handleTransactionTypeChange} />
                  <label className="ml-2 text-gray-700">Added</label>
                  <input type="radio" name="transactionType" value="deducted" checked={transactionType === 'deducted'} onChange={handleTransactionTypeChange} className="ml-4" />
                  <label className="ml-2 text-gray-700">Deducted</label>
                </div>
              </div>
            </form>
            <div className="flex justify-between mt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)} className="w-full mr-2">Close</Button>
              <Button variant="primary" onClick={handleAddTransaction} className="w-full ml-2">Add Transaction</Button>
            </div>
          </div>
        </div>
      )}
      {showBudgetModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Add Budget</h2>
              <button onClick={() => setShowBudgetModal(false)} className="text-gray-600 hover:text-gray-900">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form>
              <div className="form-group mb-4">
                <label className="block text-lg text-gray-700">Description</label>
                <input type="text" className="w-full px-3 py-2 border rounded" name="description" value={newBudget.description} onChange={handleBudgetModalChange} />
              </div>
              <div className="form-group mb-4">
                <label className="block text-lg text-gray-700">Goal</label>
                <input type="number" className="w-full px-3 py-2 border rounded" name="goal" value={newBudget.goal} onChange={handleBudgetModalChange} />
              </div>
            </form>
            <div className="flex justify-between mt-4">
              <Button variant="secondary" onClick={() => setShowBudgetModal(false)} className="w-full mr-2">Close</Button>
              <Button variant="primary" onClick={handleAddBudget} className="w-full ml-2">Add Budget</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
