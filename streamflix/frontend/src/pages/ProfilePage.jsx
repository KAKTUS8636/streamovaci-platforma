import { useState, useEffect } from 'react';
import api from '../api';

function ProfilePage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({
    watchlist: 0, likes: 0, history: 0, ratings: 0, avgRating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [wl, lk, hs, rt] = await Promise.all([
          api.get('/watchlist'),
          api.get('/likes'),
          api.get('/history'),
          api.get('/ratings'),
        ]);
        const ratings = rt.data;
        const avg = ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
          : 0;
        setStats({
          watchlist: wl.data.length,
          likes: lk.data.length,
          history: hs.data.length,
          ratings: ratings.length,
          avgRating: avg,
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Watchlist', value: stats.watchlist, color: 'yellow' },
    { label: 'Liked', value: stats.likes, color: 'red' },
    { label: 'Watched', value: stats.history, color: 'green' },
    { label: 'Rated', value: stats.ratings, color: 'blue' },
  ];

  const colorMap = {
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    red:    { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400' },
    green:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400' },
    blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400' },
  };

  return (
    <div>
      {/* Profile Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-14 mb-14">
        <div className="flex flex-col sm:flex-row items-center gap-10 text-center sm:text-left">
          <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center text-white text-5xl font-bold shrink-0">
            {user.username ? user.username.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-3">{user.username}</h1>
            <p className="text-gray-500 text-xl">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <h2 className="text-3xl font-semibold text-white mb-10">Your Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14">
            {statCards.map((stat) => (
              <div key={stat.label}
                className={`${colorMap[stat.color].bg} border ${colorMap[stat.color].border} rounded-2xl p-10 text-center`}>
                <p className={`text-5xl font-bold ${colorMap[stat.color].text} mb-4`}>{stat.value}</p>
                <p className="text-gray-500 text-base">{stat.label}</p>
              </div>
            ))}
          </div>

          {stats.ratings > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12">
              <h3 className="text-white text-2xl font-semibold mb-8">Average Rating</h3>
              <div className="flex items-center gap-8">
                <span className="text-6xl font-bold text-blue-400">{stats.avgRating}</span>
                <span className="text-gray-500 text-2xl">/ 10</span>
                <div className="flex-1 bg-gray-800 rounded-full h-5 ml-8">
                  <div
                    className="bg-blue-500 h-5 rounded-full transition-all"
                    style={{ width: `${(stats.avgRating / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProfilePage;