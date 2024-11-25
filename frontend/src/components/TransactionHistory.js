import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaHistory } from 'react-icons/fa';
import ReactTable from 'react-table-6';
import 'react-table-6/react-table.css';
import axios from 'axios'; // Import axios for API calls

function TransactionHistory() {
    const [selectedBank, setSelectedBank] = useState('');
    const [banks, setBanks] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedBankDetails, setSelectedBankDetails] = useState(null);

    useEffect(() => {
        // Fetch bank details from the backend
        const fetchBanks = async () => {
            try {
                const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
                const bankResponse = await axios.get('http://localhost:5000/api/bank-details', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const bankDetails = bankResponse.data.bankDetails || []; // Ensure bankDetails is set correctly
                setBanks(bankDetails);
            } catch (error) {
                console.error('Error fetching bank details:', error);
            }
        };

        fetchBanks();
    }, []);

    useEffect(() => {
        // Fetch selected bank details and transactions
        const fetchSelectedBankDetailsAndTransactions = async () => {
            try {
                const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
                let bankDetailsResponse;
                if (selectedBank) {
                    bankDetailsResponse = await axios.get(`http://localhost:5000/api/bank-details/${selectedBank}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSelectedBankDetails(bankDetailsResponse.data);
                }

                const accountNumber = bankDetailsResponse ? bankDetailsResponse.data.accountNumber : '';
                const transactionResponse = await axios.get(`http://localhost:5000/api/transactions${selectedBank ? `?accountNumber=${accountNumber}` : ''}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTransactions(transactionResponse.data);
            } catch (error) {
                console.error('Error fetching bank details or transactions:', error);
            }
        };

        fetchSelectedBankDetailsAndTransactions();
    }, [selectedBank]);

    const handleBankChange = (event) => {
        setSelectedBank(event.target.value);
    };

    const columns = [
        { 
            Header: 'Amount', 
            accessor: 'amount',
            Cell: ({ value }) => (
                <span className={value < 0 ? 'text-red-500' : 'text-green-500'}>
                    {value < 0 ? `-$${Math.abs(value).toFixed(2)}` : `+$${value.toFixed(2)}`}
                </span>
            )
        },
        { Header: 'Status', accessor: 'status' },
        { Header: 'Date', accessor: 'date' },
        { Header: 'Category', accessor: 'category' },
        { Header: 'Description', accessor: 'description' }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold">Transaction History</h1>
                <div className="relative">
                    <select 
                        onChange={handleBankChange} 
                        value={selectedBank} 
                        className="p-3 border border-gray-300 rounded text-lg appearance-none w-64 shadow-md"
                    >
                        <option value="">All Transactions</option>
                        {banks.map(bank => (
                            <option key={bank.accountNumber} value={bank.accountNumber}>{`****${bank.accountNumber.slice(-4)}`}</option> // Show last 4 digits of account number
                        ))}
                    </select>
                    <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
            </div>
            <p className="mb-4 text-lg">Gain insights and track your transactions over time</p>
            {selectedBankDetails && (
                <div className="bank-card p-6 bg-[#0670ff] text-white rounded-lg shadow-md flex justify-between items-start mb-6">
                    <div className="flex flex-col justify-around gap-y-3">
                        <h2 className="text-2xl font-bold mb-4">{`****${selectedBankDetails.accountNumber.slice(-4)}`}</h2>
                        <p className="text-2xl font-bold">{selectedBankDetails.accountType} Account</p>
                        <p className="text-2xl font-bold">•••• •••• •••• {selectedBankDetails.accountNumber.slice(-4)}</p>
                    </div>
                    <div className="glass-card p-4 bg-white bg-opacity-20 rounded-lg w-48 h-36 flex flex-col justify-around">
                        <h3 className="text-xl font-bold">Current Balance</h3>
                        <p className="text-4xl font-bold">${selectedBankDetails.currentBalance}</p>
                    </div>
                </div>
            )}
            <div className="history-section">
                <div className="flex items-center mb-4">
                    <FaHistory className="text-2xl mr-2" />
                    <h2 className="text-2xl font-bold">History</h2>
                </div>
                <ReactTable
                    data={transactions}
                    columns={columns}
                    defaultPageSize={6}
                    showPageSizeOptions={false}
                    className="-striped -highlight"
                    getTdProps={() => ({
                        style: {
                            textAlign: 'center',
                            padding: '16px',
                            fontSize: '16px'
                        }
                    })}
                />
            </div>
        </div>
    );
}

export default TransactionHistory;