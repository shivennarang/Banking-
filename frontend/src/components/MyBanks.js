import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function MyBanks() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRequestCardModalOpen, setIsRequestCardModalOpen] = useState(false);
    const [accountDetails, setAccountDetails] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [cardType, setCardType] = useState('');
    const [cardBrand, setCardBrand] = useState('');
    const [debitCards, setDebitCards] = useState([]);
    const [creditCards, setCreditCards] = useState([]);
    const [isCreditCardModalOpen, setIsCreditCardModalOpen] = useState(false);
    const [modalCardType, setModalCardType] = useState('debit'); // New state to track modal card type

    useEffect(() => {
        const fetchAccountDetails = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await axios.get('http://localhost:5000/api/bank-details', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setAccountDetails(response.data.bankDetails);
                    setSelectedAccount(response.data.bankDetails[0]); // Set the first account as the default selected account
                } catch (error) {
                    console.error('Error fetching account details:', error);
                }
            }
        };
        fetchAccountDetails();
    }, []);

    useEffect(() => {
        const fetchDebitCards = async () => {
            if (selectedAccount) {
                const token = localStorage.getItem('token');
                try {
                    const response = await axios.get(`http://localhost:5000/api/cards?accountNumber=${selectedAccount.accountNumber}&cardType=debit`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setDebitCards(response.data);
                } catch (error) {
                    console.error('Error fetching debit cards:', error);
                }
            }
        };
        fetchDebitCards();
    }, [selectedAccount]);

    useEffect(() => {
        const fetchCreditCards = async () => {
            if (selectedAccount) {
                const token = localStorage.getItem('token');
                try {
                    const response = await axios.get(`http://localhost:5000/api/cards?accountNumber=${selectedAccount.accountNumber}&cardType=credit`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setCreditCards(response.data);
                } catch (error) {
                    console.error('Error fetching credit cards:', error);
                }
            }
        };
        fetchCreditCards();
    }, [selectedAccount]);

    const formatAccountNumber = (accountNumber) => {
        return `xxxxx${accountNumber.slice(-4)}`;
    };

    const formatCardNumber = (cardNumber) => {
        return cardNumber ? `**** **** **** ${cardNumber.slice(-4)}` : '**** **** **** ****';
    };

    const handleAccountChange = (e) => {
        const account = accountDetails.find(acc => acc.accountNumber === e.target.value);
        setSelectedAccount(account);
    };

    const handleCardTypeChange = (e) => {
        setCardType(e.target.value);
    };

    const handleCardBrandChange = (e) => {
        setCardBrand(e.target.value);
    };

    const handleRequestCardSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:5000/api/request-card', {
                token,
                accountNumber: selectedAccount.accountNumber,
                cardType,
                cardBrand
            });
            toast.success('Card requested successfully!');
            setIsRequestCardModalOpen(false);
            window.location.reload();
        } catch (error) {
            toast.error(error.response.data || 'Failed to request card.');
        }
    };

    const handleModalOpen = (type) => {
        setModalCardType(type);
        setIsModalOpen(true);
    };

    return ( 
        <div className="p-6 flex flex-col gap-y-5">
            <h1 className="text-4xl font-bold">My Cards</h1>
            <p className="text-lg mb-4">Card with exciting reward points for all your payment needs</p>
            <h2 className="text-3xl font-bold">Debit Card</h2>
            <div className="flex items-center gap-x-8">
                <div className="bg-gradient-to-r from-[#d22684] to-[#d22684] text-white p-6 rounded-lg w-72 h-48 flex items-center justify-center">
                    <img src="card.png" alt="Card" className="w-full h-full object-cover" />
                </div>
                <button onClick={() => handleModalOpen('debit')} className="bg-[#60204e] text-white p-3 rounded">My Debit Card</button>
            </div>
            <h2 className="text-3xl font-bold mt-8">Credit Card</h2>
            <div className="flex items-center gap-x-8">
                <div className="bg-gradient-to-r from-[#d22684] to-[#d22684] text-white p-6 rounded-lg w-72 h-48 flex items-center justify-center">
                    <img src="card2.png" alt="Card" className="w-full h-full object-cover" />
                </div>
                <button onClick={() => handleModalOpen('credit')} className="bg-[#60204e] text-white p-3 rounded">My Credit Card</button>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-2/3 h-auto overflow-auto">
                        <button onClick={() => setIsModalOpen(false)} className="text-red-500 hover:underline mb-4">Close</button>
                        <div className="mb-4">
                            <label className="block text-lg font-bold mb-2">Select Account</label>
                            <select onChange={handleAccountChange} className="border p-2 rounded w-full">
                                {accountDetails.map((account, index) => (
                                    <option key={index} value={account.accountNumber}>
                                        {formatAccountNumber(account.accountNumber)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedAccount ? (
                            <>
                                <div className="bg-gradient-to-r from-[#d22684] to-[#d22684] text-white p-4 rounded-lg w-full h-24 flex justify-between items-center mb-4">
                                    <p className="text-lg">Account Number: {formatAccountNumber(selectedAccount.accountNumber)}</p>
                                    <p className="text-lg font-bold">Account Balance: ${selectedAccount.currentBalance.toFixed(2)}</p>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {(modalCardType === 'debit' ? debitCards : creditCards).filter(card => card.cardType === modalCardType).map((card, index) => (
                                        <div key={index} className="bg-gradient-to-r from-[#d22684] to-[#d22684] text-white p-6 rounded-lg w-72 h-48 flex flex-col justify-between mb-4">
                                            <div>
                                                <p className="text-lg">Card Number: {formatCardNumber(card.cardNumber)}</p>
                                                <p className="text-lg">{card.cardBrand}</p> {/* Display card brand without label */}
                                                <p className="text-lg">CVV: ***</p> {/* Display CVV as *** */}
                                                <p className="text-lg">{modalCardType.charAt(0).toUpperCase() + modalCardType.slice(1)}</p> {/* Display Debit or Credit */}
                                            </div>
                                            <p className="text-lg font-bold">{selectedAccount.accountHolderName}</p> {/* Display name without label */}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-gradient-to-r from-[#d22684] to-[#d22684] text-white p-4 rounded-lg w-full h-24 flex justify-between items-center mb-4">
                                    <p className="text-lg">Account Number: xxxxx1234</p>
                                    <p className="text-lg font-bold">Account Balance: $0.00</p>
                                </div>
                                <div className="bg-gray-200 p-4 rounded-lg mb-4 flex flex-col items-center">
                                    <img src="no-card.png" alt="No Card" className="w-32 h-32 mb-4" />
                                    <p className="text-lg font-bold">No {modalCardType.charAt(0).toUpperCase() + modalCardType.slice(1)} Card</p>
                                </div>
                            </>
                        )}
                        <a onClick={() => setIsRequestCardModalOpen(true)} className="text-blue-500 hover:underline cursor-pointer">Request a New Card</a>
                    </div>
                </div>
            )}
            {isRequestCardModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-2/3 h-auto overflow-auto">
                        <button onClick={() => setIsRequestCardModalOpen(false)} className="text-red-500 hover:underline mb-4">Close</button>
                        <form onSubmit={handleRequestCardSubmit}>
                            <div className="mb-4">
                                <label className="block text-lg font-bold mb-2">Select Account</label>
                                <select onChange={handleAccountChange} className="border p-2 rounded w-full">
                                    {accountDetails.map((account, index) => (
                                        <option key={index} value={account.accountNumber}>
                                            {formatAccountNumber(account.accountNumber)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-lg font-bold mb-2">Select Card Brand</label>
                                <select value={cardBrand} onChange={handleCardBrandChange} className="border p-2 rounded w-full">
                                    <option value="">Select Card Brand</option>
                                    <option value="Rupay Global">Rupay Global</option>
                                    <option value="Visa Global">Visa Global</option>
                                    <option value="Mastercard">Mastercard</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-lg font-bold mb-2">Card Type</label>
                                <div className="flex gap-x-4">
                                    <label>
                                        <input type="radio" value="debit" checked={cardType === 'debit'} onChange={handleCardTypeChange} />
                                        Debit Card
                                    </label>
                                    <label>
                                        <input type="radio" value="credit" checked={cardType === 'credit'} onChange={handleCardTypeChange} />
                                        Credit Card
                                    </label>
                                </div>
                            </div>
                            <button type="submit" className="bg-blue-500 text-white p-3 rounded">Request Card</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyBanks;