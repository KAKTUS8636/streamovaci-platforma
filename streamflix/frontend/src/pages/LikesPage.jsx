import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function LikesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const defaultPoster = 'https://via.placeholder.com/400x600/1a1a1a/666?text=No+Poster';

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/likes');
      setItems(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const unlike = async (movieId) => {
    try { await api.post(`/likes/${movieId}`); fetchData(); }
    catch (err) { console.error(err); }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-3">Liked Movies</h1>
      <p className="text-gray-500 text-lg mb-12">{items.length} movies you loved</p>

      {loading && (
        <div className="flex justify-center py-24">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-24">
          <p className="text-gray-600 text-2xl mb-4">No liked movies yet</p>
          <Link to="/" className="text-red-500 hover:text-red-400 text-lg">Browse movies</Link>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((entry) => (
            <div key={entry._id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all">
              <Link to={`/movie/${entry.movie_id}`}>
                <img src={entry.movie.poster || defaultPoster} alt={entry.movie.title}
                  className="w-full h-56 object-cover hover:opacity-80 transition-opacity"
                  onError={(e) => { e.target.src = defaultPoster; }} />
              </Link>
              <div className="p-6">
                <Link to={`/movie/${entry.movie_id}`}>
                  <h3 className="text-white text-lg font-semibold hover:text-red-500 transition-colors truncate mb-3">{entry.movie.title}</h3>
                </Link>
                <div className="flex gap-2 mb-5">
                  {entry.movie.genre && <span className="bg-gray-800 text-gray-400 text-sm px-5 py-2.5 rounded-full">{entry.movie.genre}</span>}
                  {entry.movie.rating && <span className="bg-red-600 text-white text-sm px-5 py-2.5 rounded-full">{entry.movie.rating}/10</span>}
                </div>
                <button onClick={() => unlike(entry.movie_id)}
                  className="w-full py-3.5 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-sm font-medium transition-colors border border-red-600/30">
                  Unlike
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LikesPage;