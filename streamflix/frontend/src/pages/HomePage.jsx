import { useState, useEffect } from 'react';
import api from '../api';
import MovieCard from '../components/MovieCard';
import MovieForm from '../components/MovieForm';
function HomePage() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [userDataMap, setUserDataMap] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  // FILTRY
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchQuery,
        genre: selectedGenres.join(','),
        year_from: yearFrom,
        year_to: yearTo,
        min_rating: minRating,
        sort: sortBy,
        order: order
      };
      const res = await api.get('/movies', { params });
      setMovies(res.data);
      const dataMap = {};
      for (const movie of res.data) {
        try {
          const udRes = await api.get(`/movies/${movie._id}/userdata`);
          dataMap[movie._id] = udRes.data;
        } catch {
          dataMap[movie._id] = {};
        }
      }
      setUserDataMap(dataMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchGenres = async () => {
    try {
      const res = await api.get('/genres');
      setGenres(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchMovies();
  }, [searchQuery, selectedGenres, yearFrom, yearTo, minRating, sortBy, order]);
  useEffect(() => {
    fetchGenres();
  }, []);
  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };
  const clearFilters = () => {
    setSelectedGenres([]);
    setYearFrom('');
    setYearTo('');
    setMinRating('');
    setSortBy('created_at');
    setOrder('desc');
  };
  return (
    <div className="relative">
      <section className="mb-10 -mx-5 border-y border-white/10 bg-gradient-to-r from-[#070d19] via-[#0b1220] to-[#070d19] px-5 py-10 shadow-[0_24px_90px_rgba(0,0,0,0.42)] lg:-mx-8 lg:px-8 lg:py-14 xl:-mx-12 xl:px-12 xl:py-16">
        {/* Dekorativní světla */}
        <div className="pointer-events-none absolute left-[10%] top-8 h-40 w-40 rounded-full bg-red-600/10 blur-3xl"></div>
        <div className="pointer-events-none absolute right-[10%] top-16 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl"></div>
        {/* SEARCH + FILTER ROW */}
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          
          {/* SEARCH */}
          <div className="flex w-full items-center rounded-lg border border-white/10 bg-[#070d19]/90 lg:w-[320px]">
            <div className="pl-4 text-red-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies..."
              className="w-full bg-transparent py-3.5 px-4 text-white placeholder:text-gray-600 outline-none"
            />
          </div>
          {/* FILTER DROPDOWN */}
          <div className="relative w-full lg:w-auto">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#070d19]/90 px-6 py-3.5 text-white lg:w-48 hover:border-red-500/50 transition-all"
            >
              <span className="font-semibold tracking-wide">Filter</span>
              <span className={showFilterDropdown ? "rotate-180 transition-transform" : "transition-transform"}>▾</span>
            </button>
            {showFilterDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)}></div>
                <div className="absolute right-0 top-full z-50 mt-3 w-full min-w-[320px] rounded-xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl shadow-black">
                  
                  {/* GENRES */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {genres.map(g => (
                        <button
                          key={g}
                          onClick={() => toggleGenre(g)}
                          className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                            selectedGenres.includes(g) ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* YEAR RANGE */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Year Release</h4>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" placeholder="From" value={yearFrom} onChange={e => setYearFrom(e.target.value)}
                        className="w-full rounded-md bg-gray-900 border border-white/5 p-2 text-xs text-white outline-none focus:border-red-500"
                      />
                      <span className="text-gray-700">—</span>
                      <input 
                        type="number" placeholder="To" value={yearTo} onChange={e => setYearTo(e.target.value)}
                        className="w-full rounded-md bg-gray-900 border border-white/5 p-2 text-xs text-white outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                  {/* RATING */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Min Rating (0-10)</h4>
                    <input 
                      type="number" step="0.5" placeholder="e.g. 8.5" value={minRating} onChange={e => setMinRating(e.target.value)}
                      className="w-full rounded-md bg-gray-900 border border-white/5 p-2 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>
                  {/* SORTING */}
                  <div className="mb-8">
                    <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Sort By</h4>
                    <select 
                      value={sortBy} onChange={e => setSortBy(e.target.value)}
                      className="w-full rounded-md bg-gray-900 border border-white/5 p-2 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="created_at">Date Added</option>
                      <option value="title">Title (A-Z)</option>
                      <option value="year">Release Year</option>
                      <option value="rating">Rating</option>
                    </select>
                  </div>
                  <button 
                    onClick={clearFilters}
                    className="w-full py-2.5 text-xs font-bold text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                  >
                    Reset All Filters
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {/* HERO CONTENT */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-red-500/80">Streamflix Library</p>
          <h1 className="text-7xl font-black tracking-tighter text-white">Movies</h1>
          <p className="mt-4 text-gray-400">{movies.length} titles found in your collection</p>
          
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="mt-8 rounded-full bg-red-600 px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-105 transition-all"
            >
              + Add Movie
            </button>
          )}
        </div>
      </section>
      {/* ADMIN FORMS */}
      {isAdmin && (showForm || editingMovie) && (
        <div className="mb-12 rounded-2xl border border-white/5 bg-[#0b1220]/80 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="mb-8 text-2xl font-bold text-white">{editingMovie ? 'Edit Movie' : 'New Content'}</h2>
          <MovieForm 
            initial={editingMovie} 
            onSubmit={async (f) => {
              editingMovie ? await api.put(`/movies/${editingMovie._id}`, f) : await api.post('/movies', f);
              setShowForm(false); setEditingMovie(null); fetchMovies(); fetchGenres();
            }} 
            onCancel={() => { setShowForm(false); setEditingMovie(null); }} 
          />
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-red-600"></div></div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {movies.map(movie => (
            <MovieCard 
              key={movie._id} 
              movie={movie} 
              userData={userDataMap[movie._id]}
              onToggleLike={async (id) => { await api.post(`/likes/${id}`); fetchMovies(); }}
              onToggleWatchlist={async (id) => { 
                userDataMap[id]?.in_watchlist ? await api.delete(`/watchlist/${id}`) : await api.post(`/watchlist/${id}`);
                fetchMovies(); 
              }}
              onMarkWatched={async (id) => { await api.post(`/history/${id}`); fetchMovies(); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export default HomePage;