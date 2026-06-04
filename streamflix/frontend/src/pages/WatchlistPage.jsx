import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function WatchlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const defaultPoster = 'https://via.placeholder.com/400x600/1a1a1a/666?text=No+Poster';

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/watchlist');
      setItems(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const remove = async (movieId) => {
    try { await api.delete(`/watchlist/${movieId}`); fetchData(); }
    catch (err) { console.error(err); }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-4">My Watchlist</h1>
      <p className="text-gray-500 text-lg mb-14">{items.length} movies saved to watch later</p>

      {loading && (
        <div className="flex justify-center py-28">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-28">
          <p className="text-gray-600 text-2xl mb-5">Your watchlist is empty</p>
          <Link to="/" className="text-red-500 hover:text-red-400 text-lg">Browse movies</Link>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {items.map((entry) => (
            <div key={entry._id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all">
              <Link to={`/movie/${entry.movie_id}`}>
                <img src={entry.movie.poster || defaultPoster} alt={entry.movie.title}
                  className="w-full h-56 object-cover hover:opacity-80 transition-opacity"
                  onError={(e) => { e.target.src = defaultPoster; }} />
              </Link>
              <div className="p-7">
                <Link to={`/movie/${entry.movie_id}`}>
                  <h3 className="text-white text-lg font-semibold hover:text-red-500 transition-colors truncate mb-4">{entry.movie.title}</h3>
                </Link>
                <div className="flex gap-3 mb-6">
                  {entry.movie.genre && <span className="bg-gray-800 text-gray-400 text-xs px-4 py-2 rounded-full">{entry.movie.genre}</span>}
                  {entry.movie.year && <span className="bg-gray-800 text-gray-400 text-xs px-4 py-2 rounded-full">{entry.movie.year}</span>}
                </div>
                <button onClick={() => remove(entry.movie_id)}
                  className="w-full py-4 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white rounded-xl text-sm font-medium transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WatchlistPage;