import { useState, useEffect } from 'react';
import axios from 'axios'; // Importujeme přímo axios

function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState({});
  
  // Získáme token a uživatele přímo z localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const isAdmin = user.role === 'admin';

  // Hardkódovaná URL backendu (abys nemusel mít .env soubor na frontendu)
  const API_BASE_URL = 'http://localhost:5000/api';
  const defaultPoster = 'https://via.placeholder.com/400x600/1a1a1a/666?text=No+Poster';

  // Načtení trendů
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/tmdb/trending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrending(res.data);
      } catch (err) { console.error("Trending fail:", err); }
    };
    fetchTrending();
  }, [token]);

  // Vyhledávání
  const searchTMDB = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/tmdb/search`, {
        params: { query: searchQuery },
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(res.data);
    } catch (err) { console.error("Search fail:", err); }
    finally { setLoading(false); }
  };

  const MovieResult = ({ movie }) => (
    <div className="group bg-gray-900/60 rounded-xl overflow-hidden border border-gray-800 hover:border-red-500/50 transition-all flex flex-col h-full shadow-lg">
      <div className="relative aspect-[2/3] bg-black">
        <img src={movie.poster || defaultPoster} alt={movie.title} className="w-full h-full object-cover" />
        {movie.rating > 0 && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">★ {movie.rating}</div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-white font-bold text-sm mb-1 truncate text-center">{movie.title}</h3>
        <p className="text-gray-500 text-[10px] text-center mb-3">{movie.year}</p>
        
        {isAdmin && (
          <button 
            onClick={async () => {
              try {
                setImporting(p => ({...p, [movie.tmdb_id]: 'loading'}));
                await axios.post(`${API_BASE_URL}/movies`, { 
                  title: movie.title,
                  description: movie.description,
                  year: movie.year,
                  rating: movie.rating,
                  poster: movie.poster,
                  type: 'movie',
                  genre: 'Imported'
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                setImporting(p => ({...p, [movie.tmdb_id]: 'done'}));
              } catch (e) {
                setImporting(p => ({...p, [movie.tmdb_id]: false}));
                alert("Import failed!");
              }
            }}
            disabled={importing[movie.tmdb_id] === 'done'}
            className={`w-full mt-auto py-2 rounded text-[10px] font-bold transition-all ${importing[movie.tmdb_id] === 'done' ? 'bg-green-600/20 text-green-500' : 'bg-red-600 hover:bg-red-500 text-white'}`}
          >
            {importing[movie.tmdb_id] === 'done' ? '✓ IMPORTED' : 'IMPORT'}
          </button>
        )}
      </div>
    </div>
  );

  const displayMovies = results.length > 0 ? results : trending;

  return (
    <div className="relative">
      <section className="mb-10 -mx-5 lg:-mx-8 xl:-mx-12 border-y border-white/10 bg-gradient-to-r from-[#070d19] via-[#0b1220] to-[#070d19] px-5 py-12 text-center shadow-2xl">
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">Discover</h1>
        <p className="text-gray-400 text-xs mb-8 tracking-[0.3em] uppercase opacity-60">Global Movie Database</p>
        
        <form onSubmit={searchTMDB} className="max-w-2xl mx-auto flex items-center bg-[#070d19]/90 rounded-lg border border-white/10 overflow-hidden focus-within:border-red-500/50 transition-all shadow-xl">
          {/* LUPA FIXED BEZ ABSOLUTE */}
          <div className="pl-5 text-red-400/80">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3" strokeLinecap="round"/>
            </svg>
          </div>
          <input 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search millions of movies..." 
            className="flex-1 bg-transparent py-4 px-4 text-white outline-none placeholder:text-gray-600"
          />
          <button type="submit" className="bg-red-600 px-10 py-4 text-white font-bold hover:bg-red-500 transition-colors">SEARCH</button>
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