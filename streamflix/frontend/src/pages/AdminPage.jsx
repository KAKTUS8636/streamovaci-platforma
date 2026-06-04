import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function AdminPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect non-admins
  useEffect(() => {
    if (user.role !== 'admin') {
      navigate('/');
    }
  }, []);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchUsers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Toggle user role
  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change role to ${newRole}?`)) return;
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  // Delete user
  const deleteUser = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}" and all their data?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-28">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-14">
        <h1 className="text-4xl font-bold text-white mb-4">Admin Dashboard</h1>
        <p className="text-gray-500 text-lg">Manage your Streamflix platform</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-12">
        {['overview', 'users'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-4 rounded-xl text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div>
          <h2 className="text-2xl font-semibold text-white mb-8">Platform Statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { label: 'Total Users', value: stats.total_users, color: 'purple' },
              { label: 'Total Movies', value: stats.total_movies, color: 'red' },
              { label: 'Total Likes', value: stats.total_likes, color: 'pink' },
              { label: 'Total Ratings', value: stats.total_ratings, color: 'blue' },
              { label: 'Watchlist Entries', value: stats.total_watchlist, color: 'yellow' },
              { label: 'History Entries', value: stats.total_history, color: 'green' },
            ].map((stat) => {
              const colors = {
                purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
                red: 'bg-red-500/10 border-red-500/30 text-red-400',
                pink: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
                blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
                yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
                green: 'bg-green-500/10 border-green-500/30 text-green-400',
              };
              return (
                <div key={stat.label} className={`${colors[stat.color]} border rounded-2xl p-10 text-center`}>
                  <p className="text-5xl font-bold mb-4">{stat.value}</p>
                  <p className="text-gray-500 text-base">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-2xl font-semibold text-white mb-8">
            All Users ({users.length})
          </h2>
          <div className="space-y-5">
            {users.map((u) => (
              <div key={u._id} className="bg-gray-900 border border-gray-800 rounded-xl p-7 flex items-center gap-7 hover:border-gray-600 transition-all">
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 ${
                  u.role === 'admin' ? 'bg-purple-600' : 'bg-gray-700'
                }`}>
                  {u.username.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white text-lg font-semibold">{u.username}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      u.role === 'admin'
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                        : 'bg-gray-800 text-gray-400'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">{u.email}</p>
                  <p className="text-gray-700 text-xs mt-1">
                    Joined: {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 shrink-0">
                  <button
                    onClick={() => toggleRole(u._id, u.role)}
                    className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                      u.role === 'admin'
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-600/30'
                    }`}
                  >
                    {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  {u._id !== user._id && (
                    <button
                      onClick={() => deleteUser(u._id, u.username)}
                      className="px-6 py-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 rounded-xl text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;