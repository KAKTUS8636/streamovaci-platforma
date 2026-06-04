import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function RatingsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const defaultPoster = 'https://via.placeholder.com/400x600/1a1a1a/666?text=No+Poster';

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ratings');
      setItems(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const removeRating = async (movieId) => {
    try { await api.delete(`/ratings/${movieId}`); fetchData(); }
    catch (err) { console.error(err); }
  };

  const avgRating = items.length > 0
    ? (items.reduce((sum, i) => sum + i.score, 0) / items.length).toFixed(1)
    : 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-white mb-3">My Ratings</h1>
          <p className="text-gray-500 text-lg">{items.length} movies rated</p>
        </div>
        {items.length > 0 && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl px-10 py-6 text-center">
            <p className="text-blue-400 text-sm mb-1">Average Rating</p>
            <p className="text-blue-400 text-3xl font-bold">{avgRating}/10</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-24">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-24">
          <p className="text-gray-600 text-2xl mb-4">No ratings yet</p>
          <Link to="/" className="text-red-500 hover:text-red-400 text-lg">Browse movies to rate</Link>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((entry) => (
            <div key={entry._id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all">
              <Link to={`/movie/${entry.movie_id}`} className="relative block">
                <img src={entry.movie.poster || defaultPoster} alt={entry.movie.title}
                  className="w-full h-56 object-cover hover:opacity-80 transition-opacity"
                  onError={(e) => { e.target.src = defaultPoster; }} />
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg">
                  {entry.score}/10
                </div>
              </Link>
              <div className="p-6">
                <Link to={`/movie/${entry.movie_id}`}>
                  <h3 className="text-white text-lg font-semibold hover:text-red-500 transition-colors truncate mb-2">{entry.movie.title}</h3>
                </Link>
                <p className="text-gray-600 text-sm mb-5">
                  Rated: {new Date(entry.rated_at).toLocaleDateString()}
                </p>
                <button onClick={() => removeRating(entry.movie_id)}
                  className="w-full py-3.5 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white rounded-xl text-sm font-medium transition-colors">
                  Remove Rating
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RatingsPage;