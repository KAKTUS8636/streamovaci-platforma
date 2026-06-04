import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const defaultPoster = 'https://via.placeholder.com/400x600/1a1a1a/666?text=No+Poster';

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/history');
      setItems(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const clearAll = async () => {
    if (!window.confirm('Clear all watch history?')) return;
    try { await api.delete('/history'); fetchData(); }
    catch (err) { console.error(err); }
  };

  const removeOne = async (movieId) => {
    try { await api.delete(`/history/${movieId}`); fetchData(); }
    catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-14">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Watch History</h1>
          <p className="text-gray-500 text-lg">{items.length} entries</p>
        </div>
        {items.length > 0 && (
          <button onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-sm font-medium transition-colors">
            Clear All
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-28">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-28">
          <p className="text-gray-600 text-2xl mb-5">No watch history</p>
          <Link to="/" className="text-red-500 hover:text-red-400 text-lg">Browse movies</Link>
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {items.map((entry) => (
            <div key={entry._id} className="bg-gray-900 border border-gray-800 rounded-xl p-7 flex items-center gap-7 hover:border-gray-600 transition-all">
              <Link to={`/movie/${entry.movie_id}`}>
                <img src={entry.movie.poster || defaultPoster} alt={entry.movie.title}
                  className="w-24 h-32 object-cover rounded-lg shrink-0"
                  onError={(e) => { e.target.src = defaultPoster; }} />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/movie/${entry.movie_id}`}>
                  <h3 className="text-white text-lg font-semibold hover:text-red-500 transition-colors truncate mb-2">{entry.movie.title}</h3>
                </Link>
                <div className="flex gap-3 mt-3">
                  {entry.movie.genre && <span className="text-gray-500 text-sm">{entry.movie.genre}</span>}
                  {entry.movie.year && <span className="text-gray-500 text-sm">({entry.movie.year})</span>}
                </div>
                <p className="text-gray-600 text-sm mt-3">
                  Watched: {new Date(entry.watched_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => removeOne(entry.movie_id)}
                className="text-gray-600 hover:text-red-500 text-sm transition-colors shrink-0 px-6 py-3 rounded-lg hover:bg-gray-800">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;