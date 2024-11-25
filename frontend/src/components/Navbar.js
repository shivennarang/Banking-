import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedAccountNumber, setSelectedAccountNumber] = useState('');
  const [transactionType, setTransactionType] = useState('added');
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    status: 'Success',
    date: '',
    category: '',
    description: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [totalBalance, setTotalBalance] = useState('$0');
  const [pieData, setPieData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
      }
    ]
  });
  const [bankDetails, setBankDetails] = useState([]);

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
  }, []);

  useEffect(() => {
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
    fetchNotifications();
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleBellClick = async () => {
    setShowNotifications(!showNotifications);
    if (unreadCount > 0) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.put('http://localhost:5000/api/notifications/read', {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUnreadCount(0);
        } catch (error) {
          console.error('Error marking notifications as read:', error);
        }
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
        const amount = transactionType === 'deducted' ? -Math.abs(newTransaction.amount) : Math.abs(newTransaction.amount);
        await axios.post('http://localhost:5000/api/transactions', {
          token,
          ...newTransaction,
          amount,
          bankName: selectedBank,
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
        console.error('Error adding transaction:', error);
      }
    }
  };

  const fetchTransactions = async (accountNumber) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`http://localhost:5000/api/transactions?accountNumber=${accountNumber}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransactions(response.data.slice(0, 5)); // Limit to 5 recent transactions
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    }
  };

  const fetchBankDetails = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get('http://localhost:5000/api/bank-details', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bankDetails = response.data.bankDetails || [];
        const bankNames = bankDetails.map(bank => bank.bankName);
        const bankBalances = bankDetails.map(bank => bank.currentBalance);
        const totalBalance = bankBalances.reduce((acc, balance) => acc + balance, 0);
  
        setTotalBalance(`$${totalBalance.toFixed(2)}`);
        setPieData({
          labels: bankNames,
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

  const handleDeleteNotifications = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.delete('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications([]);
        setUnreadCount(0);
      } catch (error) {
        console.error('Error deleting notifications:', error);
      }
    }
  };

  const filteredNavItems = [
    { path: '/dashboard', icon: 'fas fa-home', label: 'Home' },
    { path: '/mybanks', icon: 'fas fa-university', label: 'Cards' },
    { path: '/transactionhistory', icon: 'fas fa-history', label: 'Transaction History' },
    { path: '/paymenttransfer', icon: 'fas fa-exchange-alt', label: 'Payment Transfer' },
    { path: '/connectbank', icon: 'fas fa-link', label: 'Connect Account' },
    { path: '/loans', icon: 'fas fa-money-check-alt', label: 'Loans' }, // New Loans option
  ].filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="w-1/6 border-r border-gray-300 shadow-lg rounded-r-lg p-4 h-screen sticky top-0">
      {/* Navbar */}
      <div className="flex flex-col gap-y-3 mt-5 h-full w-full">
        <div className="mb-4">
          {/* Logo */}
          <img src="/logo.png" alt="Logo" className="h-8 w-auto mb-4" />
        </div>
        <div className="mb-4">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search"
            className="w-full p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="space-y-4 flex-grow">
          {/* Options */}
          {filteredNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 text-lg p-2 rounded cursor-pointer transition duration-300 ease-in-out transform hover:scale-105 ${isActive(item.path) ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-600 hover:text-white hover:font-bold'}`}
            >
              <i className={`${item.icon} text-xl text-blue-800`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="relative">
          <div className="bg-gray-200 rounded-full p-2 inline-block">
            <i className="fas fa-bell text-2xl text-blue-800 cursor-pointer" onClick={handleBellClick}></i>
            {unreadCount > 0 && (
            <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white rounded-full text-xs px-2 py-1">
              {unreadCount}
            </span>
          )}
          </div>
         
        </div>
        {showNotifications && (
          <div className="absolute top-12 right-0 bg-white border rounded-lg shadow-lg p-4 w-64 h-96 overflow-y-scroll">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-gray-600 hover:text-gray-900">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <ul>
              {notifications.map(notification => (
                <li key={notification._id} className="mb-2">
                  <p className="text-base">{notification.message}</p>
                  <p className="text-xs text-gray-500">{new Date(notification.time).toLocaleString()}</p>
                </li>
              ))}
            </ul>
            {notifications.length > 0 && (
              <button onClick={handleDeleteNotifications} className="mt-4 bg-red-600 text-white rounded px-4 py-2">
                Delete All Notifications
              </button>
            )}
          </div>
        )}
        <div className="mt-auto flex pb-9 justify-around">
          {/* User Info */}
          <div className="flex flex-col">
            <span className="font-bold text-lg">{userName}</span>
            <span className="text-sm text-gray-500">{userEmail}</span>
          </div>
          <i className="fas fa-sign-out-alt text-2xl text-blue-800 cursor-pointer hover:text-blue-600 transition duration-300" onClick={handleLogout}></i>
        </div>
      </div>
    </div>
  );
}

export default Navbar;