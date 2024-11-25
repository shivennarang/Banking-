import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/login', { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      toast.success('Login successful!');
      navigate('/dashboard');
      window.location.reload(); // Reload the page to see the notifications
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setError('Invalid email or password.');
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden font-roboto">
      <div className="md:w-1/2 flex flex-col justify-center items-center p-8 text-left">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <img src="/logo.png" alt="Logo" className="mb-4" />
            <h1 className="text-3xl font-bold">Log in</h1>
            <p className="text-lg text-gray-600">Welcome Back</p>
          </div>
          <form onSubmit={handleSubmit} className="w-full">
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="mb-4">
              <label className="block text-lg text-gray-700">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded"
              />
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
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded text-lg">
              Log In
            </button>
          </form>
          <div className="mt-4 text-lg">
            Don't have an account? <Link to="/signup" className="text-blue-500">Sign up</Link>
          </div>
        </div>
      </div>
      <div className="md:w-1/2 flex justify-center items-center p-8 overflow-hidden relative">
        <img src="/dashboard.png" alt="Side Image" className="max-w-full h-auto transform translate-x-10" />
      </div>
    </div>
  );
};

export default Login;