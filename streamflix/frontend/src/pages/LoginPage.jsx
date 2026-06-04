import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-red-600 text-5xl font-bold tracking-widest text-center mb-12">
          STREAMFLIX
        </h1>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10">
          <h2 className="text-white text-3xl font-semibold mb-8">Sign In</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-5 py-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-lg transition-colors mt-4"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-gray-500 text-center mt-8 text-base">
            Don't have an account?{' '}
            <Link to="/signup" className="text-red-500 hover:text-red-400 font-semibold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;