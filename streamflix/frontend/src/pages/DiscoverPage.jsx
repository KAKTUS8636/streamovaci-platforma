import { useState, useEffect } from 'react';
import api from '../api';

function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState({});
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const defaultPoster = 'https://via.placeholder.com/400x600/1a1a1a/666?text=No+Poster';

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await api.get('/tmdb/trending');
        setTrending(res.data);
      } catch (err) { console.error(err); }
    };
    fetchTrending();
  }, []);

  const searchTMDB = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const res = await api.get('/tmdb/search', { params: { query: searchQuery } });
      setResults(res.data.results);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const MovieResult = ({ movie }) => (
    <div className="group bg-gray-900/60 rounded-xl overflow-hidden border border-gray-800 hover:border-red-500/50 transition-all flex flex-col h-full shadow-lg">
      <div className="relative aspect-[2/3]">
        <img src={movie.poster || defaultPoster} alt={movie.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = defaultPoster; }} />
        {movie.rating > 0 && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">★ {movie.rating}</div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-white font-bold text-sm mb-1 truncate text-center">{movie.title}</h3>
        <p className="text-gray-500 text-[10px] text-center mb-3">{movie.year}</p>
        <p className="text-gray-400 text-[10px] line-clamp-2 mb-4 flex-1 text-center">{movie.description}</p>
        
        {isAdmin && (
          <button 
            onClick={async () => {
              setImporting(p => ({...p, [movie.tmdb_id]: 'loading'}));
              await api.post(`/movies`, { ...movie, type: 'movie' });
              setImporting(p => ({...p, [movie.tmdb_id]: 'done'}));
            }}
            disabled={importing[movie.tmdb_id] === 'done'}
            className={`w-full py-2 rounded text-[10px] font-bold transition-all ${importing[movie.tmdb_id] === 'done' ? 'bg-green-600/20 text-green-500' : 'bg-red-600 hover:bg-red-500 text-white'}`}
          >
            {importing[movie.tmdb_id] === 'done' ? 'IMPORTED' : 'IMPORT'}
          </button>
        )}
      </div>
    </div>
  );

  const displayMovies = results.length > 0 ? results : trending;

  return (
    <div className="relative">
      <section className="mb-10 -mx-5 lg:-mx-8 xl:-mx-12 border-y border-white/10 bg-gradient-to-r from-[#070d19] via-[#0b1220] to-[#070d19] px-5 py-10 text-center">
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">Discover</h1>
        <p className="text-gray-400 text-sm mb-8 tracking-widest uppercase opacity-60">Find your next favorite story</p>
        
        <form onSubmit={searchTMDB} className="max-w-2xl mx-auto flex items-center bg-[#070d19]/90 rounded-lg border border-white/10 overflow-hidden focus-within:border-red-500/50 transition-all">
          <input 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search millions of movies..." 
            className="flex-1 bg-transparent py-4 px-6 text-white outline-none"
          />
          <button type="submit" className="bg-red-600 px-8 py-4 text-white font-bold hover:bg-red-500 transition-colors">SEARCH</button>
        </form>
      </section>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
          {displayMovies.map(m => <MovieResult key={m.tmdb_id} movie={m} />)}
        </div>
      )}
    </div>
  );
}

export default DiscoverPage;