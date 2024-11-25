import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignUp = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [stateError, setStateError] = useState('');
  const [postalCodeError, setPostalCodeError] = useState('');
  const [dobError, setDobError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset error messages
    setFirstNameError('');
    setLastNameError('');
    setAddressError('');
    setStateError('');
    setPostalCodeError('');
    setDobError('');
    setEmailError('');
    setPasswordError('');

    // Client-side validation
    let hasError = false;

    if (!firstName) {
      setFirstNameError('First Name is required.');
      hasError = true;
    }
    if (!lastName) {
      setLastNameError('Last Name is required.');
      hasError = true;
    }
    if (!address) {
      setAddressError('Address is required.');
      hasError = true;
    }
    if (!state) {
      setStateError('State is required.');
      hasError = true;
    }
    if (!postalCode) {
      setPostalCodeError('Postal Code is required.');
      hasError = true;
    }
    if (!dob) {
      setDobError('Date of Birth is required.');
      hasError = true;
    } else {
      const today = new Date();
      const birthDate = new Date(dob);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        setDobError('You must be at least 18 years old.');
        hasError = true;
      }
    }
    if (!email) {
      setEmailError('Email is required.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.post('http://localhost:5000/api/signup', {
        firstName,
        lastName,
        address,
        state,
        postalCode,
        dob,
        email,
        password,
      });
      if (response.status === 201) {
        toast.success('Signup successful!', { position: "top-right" });
        setTimeout(() => {
          // Redirect to login page
          window.location.href = '/';
        }, 2000); // Wait for 2 seconds before redirecting
      }
    } catch (error) {
      console.error('There was an error signing up!', error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row font-roboto">
      <div className="md:w-1/2 flex flex-col justify-center items-center p-8 text-left">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <img src="/logo.png" alt="Logo" className="mb-4" />
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-lg text-gray-600">Please enter your details</p>
          </div>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-4">
              <label className="block text-lg text-gray-700">First Name:</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded"
              />
              {firstNameError && <p className="text-red-500 text-sm">{firstNameError}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-lg text-gray-700">Last Name:</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded"
              />
              {lastNameError && <p className="text-red-500 text-sm">{lastNameError}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-lg text-gray-700">Address:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded"
              />
              {addressError && <p className="text-red-500 text-sm">{addressError}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-lg text-gray-700">State:</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded"
              />
              {stateError && <p className="text-red-500 text-sm">{stateError}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-lg text-gray-700">Postal Code:</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded"
              />
              {postalCodeError && <p className="text-red-500 text-sm">{postalCodeError}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-lg text-gray-700">Date of Birth:</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded"
              />
              {dobError && <p className="text-red-500 text-sm">{dobError}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-lg text-gray-700">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded"
              />
              {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-lg text-gray-700">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded"
              />
              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded text-lg">
              Sign Up
            </button>
          </form>
          <div className="mt-4 text-lg text-center">
            Already have an account? <Link to="/" className="text-blue-500">Log in</Link>
          </div>
        </div>
      </div>
      <div className="md:w-1/2 flex justify-center items-center p-8 overflow-hidden relative">
        <img src="/dashboard.png" alt="Side Image" className="max-w-full h-auto transform translate-x-10" />
      </div>
    </div>
  );
};

export default SignUp;