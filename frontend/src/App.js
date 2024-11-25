import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import MyBanks from './components/MyBanks';
import TransactionHistory from './components/TransactionHistory';
import PaymentTransfer from './components/PaymentTransfer';
import ConnectBankModal from './components/ConnectBankModal';
import Loans from './components/Loans'; // Import the Loans component

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [navigate, token, location.pathname]);

  return (
    <div className="App">
      {token ? (
        <div className="flex w-full">
          <Navbar />
          <div className="w-[90%]">
            <Routes location={location}>
              <Route exact path="/" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mybanks" element={<MyBanks />} />
              <Route path="/transactionhistory" element={<TransactionHistory />} />
              <Route path="/paymenttransfer" element={<PaymentTransfer />} />
              <Route path="/connectbank" element={<ConnectBankModal />} />
              <Route path="/loans" element={<Loans />} /> {/* Add Loans route */}
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route exact path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mybanks" element={<MyBanks />} />
          <Route path="/transactionhistory" element={<TransactionHistory />} />
          <Route path="/paymenttransfer" element={<PaymentTransfer />} />
          <Route path="/connectbank" element={<ConnectBankModal />} />
          <Route path="/loans" element={<Loans />} /> {/* Add Loans route */}
        </Routes>
      )}
    </div>
  );
}

export default App;