import { useState, useEffect } from 'react';
import axios from 'axios';

const TMDB_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [importing, setImporting] = useState({});
  const [error, setError] = useState(null);

  // Filters
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const isAdmin = user.role === 'admin';

  const API_BASE_URL = 'http://localhost:5000/api';
  const defaultPoster = 'https://via.placeholder.com/400x600/1a1a1a/666?text=No+Poster';

  // Load trending
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setTrendingLoading(true);
        setError(null);
        const res = await axios.get(`${API_BASE_URL}/tmdb/trending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const movies = Array.isArray(res.data) ? res.data : [];
        setTrending(movies);
        if (movies.length === 0) setError('No trending movies returned.');
      } catch (err) {
        setError(`Failed to load trending: ${err.response?.data?.error || err.message}`);
      } finally {
        setTrendingLoading(false);
      }
    };
    if (token) fetchTrending();
    else { setError('You are not logged in.'); setTrendingLoading(false); }
  }, [token]);

  // Search
  const searchTMDB = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/tmdb/search`, {
        params: { query: searchQuery },
        headers: { Authorization: `Bearer ${token}` },
      });
      const movies = Array.isArray(res.data) ? res.data : [];
      setResults(movies);
      if (movies.length === 0) setError(`No results found for "${searchQuery}"`);
    } catch (err) {
      setError(`Search failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Import
  const handleImport = async (movie) => {
    try {
      setImporting((p) => ({ ...p, [movie.tmdb_id]: 'loading' }));
      await axios.post(`${API_BASE_URL}/tmdb/import/${movie.tmdb_id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImporting((p) => ({ ...p, [movie.tmdb_id]: 'done' }));
    } catch (err) {
      setImporting((p) => ({ ...p, [movie.tmdb_id]: false }));
      alert(`Import failed: ${err.response?.data?.error || err.message}`);
    }
  };

  // Filter + sort
  const rawMovies = results.length > 0 ? results : trending;
  const displayMovies = rawMovies
    .filter((movie) => {
      // Genre filter (TMDB uses genre_ids)
      if (selectedGenres.length > 0) {
        const movieGenreIds = movie.genre_ids || [];
        if (!selectedGenres.every((id) => movieGenreIds.includes(id))) return false;
      }

      // Year range
      const movieYear = parseInt(movie.year) || 0;
      if (yearFrom && movieYear < parseInt(yearFrom)) return false;
      if (yearTo && movieYear > parseInt(yearTo)) return false;

      // Min rating
      if (minRating && (movie.rating || 0) < parseFloat(minRating)) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'year':
          return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
        default:
          return 0;
      }
    });

  const toggleGenre = (genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setYearFrom('');
    setYearTo('');
    setMinRating('');
    setSortBy('default');
  };

  const hasActiveFilters =
    selectedGenres.length > 0 || yearFrom || yearTo || minRating || sortBy !== 'default';

  const getGenreNames = (genreIds) =>
    (genreIds || []).map((id) => TMDB_GENRES.find((g) => g.id === id)?.name).filter(Boolean);

  const isShowingResults = results.length > 0;
  const isLoading = trendingLoading || loading;

  return (
    <div className="relative">
      {/* ====== HERO SECTION ====== */}
      <section className="mb-10 -mx-5 border-y border-white/10 bg-gradient-to-r from-[#070d19] via-[#0b1220] to-[#070d19] px-5 py-10 shadow-[0_24px_90px_rgba(0,0,0,0.42)] lg:-mx-8 lg:px-8 lg:py-14 xl:-mx-12 xl:px-12 xl:py-16">
        <div className="pointer-events-none absolute left-[10%] top-8 h-40 w-40 rounded-full bg-red-600/10 blur-3xl"></div>
        <div className="pointer-events-none absolute right-[10%] top-16 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl"></div>

        {/* SEARCH + FILTER ROW */}
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* SEARCH */}
          <form onSubmit={searchTMDB} className="flex w-full items-center rounded-lg border border-white/10 bg-[#070d19]/90 lg:w-[320px]">
            <div className="pl-4 text-red-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) { setResults([]); setError(null); }
              }}
              placeholder="Search movies..."
              className="w-full bg-transparent py-3.5 px-4 text-white placeholder:text-gray-600 outline-none"
            />
            <button type="submit" disabled={loading}
              className="mr-2 rounded-md bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50">
              {loading ? '...' : 'Go'}
            </button>
          </form>

          {/* FILTER DROPDOWN */}
          <div className="relative w-full lg:w-auto">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg border bg-[#070d19]/90 px-6 py-3.5 text-white lg:w-48 transition-all ${
                hasActiveFilters
                  ? 'border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
                  : 'border-white/10 hover:border-red-500/50'
              }`}
            >
              <span className="font-semibold tracking-wide">
                Filter
                {hasActiveFilters && (
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black">✓</span>
                )}
              </span>
              <span className={showFilterDropdown ? 'rotate-180 transition-transform' : 'transition-transform'}>▾</span>
            </button>

            {showFilterDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)}></div>
                <div className="absolute right-0 top-full z-50 mt-3 w-full min-w-[320px] rounded-xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl shadow-black">
                  {/* GENRES */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Genres</h4>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {TMDB_GENRES.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => toggleGenre(g.id)}
                          className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                            selectedGenres.includes(g.id)
                              ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* YEAR RANGE */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Year Release</h4>
                    <div className="flex items-center gap-3">
                      <input type="number" placeholder="From" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)}
                        className="w-full rounded-md bg-gray-900 border border-white/5 p-2 text-xs text-white outline-none focus:border-red-500" />
                      <span className="text-gray-700">—</span>
                      <input type="number" placeholder="To" value={yearTo} onChange={(e) => setYearTo(e.target.value)}
                        className="w-full rounded-md bg-gray-900 border border-white/5 p-2 text-xs text-white outline-none focus:border-red-500" />
                    </div>
                  </div>

                  {/* RATING */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Min Rating (0-10)</h4>
                    <input type="number" step="0.5" placeholder="e.g. 8.5" value={minRating} onChange={(e) => setMinRating(e.target.value)}
                      className="w-full rounded-md bg-gray-900 border border-white/5 p-2 text-xs text-white outline-none focus:border-red-500" />
                  </div>

                  {/* SORTING */}
                  <div className="mb-8">
                    <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Sort By</h4>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                      className="w-full rounded-md bg-gray-900 border border-white/5 p-2 text-xs text-white outline-none cursor-pointer">
                      <option value="default">Default (Trending)</option>
                      <option value="title">Title (A-Z)</option>
                      <option value="year">Release Year</option>
                      <option value="rating">Rating</option>
                    </select>
                  </div>

                  <button onClick={clearFilters}
                    className="w-full py-2.5 text-xs font-bold text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                    Reset All Filters
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* HERO CONTENT */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-red-500/80">TMDB Database</p>
          <h1 className="text-7xl font-black tracking-tighter text-white">Discover</h1>
          <p className="mt-4 text-gray-400">
            {isShowingResults
              ? `${displayMovies.length} result${displayMovies.length !== 1 ? 's' : ''} for "${searchQuery}"`
              : `${displayMovies.length} trending movie${displayMovies.length !== 1 ? 's' : ''} this week`}
          </p>

          {isShowingResults && (
            <button
              onClick={() => { setResults([]); setSearchQuery(''); setError(null); }}
              className="mt-6 rounded-full border border-white/10 bg-gray-800/60 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white hover:border-red-500/30 transition-all"
            >
              ✕ Clear &amp; Show Trending
            </button>
          )}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="mb-8 rounded-xl border border-red-500/20 bg-red-950/30 px-6 py-5 text-center">
          <p className="text-sm text-red-400">⚠️ {error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-red-600"></div>
        </div>
      )}

      {/* Grid */}
      {!isLoading && displayMovies.length > 0 && (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {displayMovies.map((movie) => {
            const genreNames = getGenreNames(movie.genre_ids);
            return (
              <div
                key={movie.tmdb_id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-gray-900/80 to-gray-950/90 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-red-500/30 hover:shadow-[0_16px_48px_rgba(220,38,38,0.15)]"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
                  <img
                    src={movie.poster || defaultPoster}
                    alt={movie.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.src = defaultPoster; }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {movie.rating > 0 && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-white/10 bg-black/70 px-2 py-1 text-[10px] font-bold text-amber-400 shadow-lg backdrop-blur-sm">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {Number(movie.rating).toFixed(1)}
                    </div>
                  )}

                  {movie.year && (
                    <div className="absolute left-3 top-3 rounded-md border border-white/10 bg-black/70 px-2 py-1 text-[10px] font-semibold text-gray-300 backdrop-blur-sm">
                      {movie.year}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="absolute inset-0 flex items-end justify-center p-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <button
                        onClick={() => handleImport(movie)}
                        disabled={importing[movie.tmdb_id] === 'loading' || importing[movie.tmdb_id] === 'done'}
                        className={`w-full rounded-lg py-3 text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm transition-all duration-200 ${
                          importing[movie.tmdb_id] === 'done'
                            ? 'cursor-default border border-green-500/30 bg-green-600/20 text-green-400'
                            : importing[movie.tmdb_id] === 'loading'
                            ? 'cursor-wait border border-gray-500/30 bg-gray-700/50 text-gray-400'
                            : 'border border-red-500/30 bg-red-600/90 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:bg-red-500'
                        }`}
                      >
                        {importing[movie.tmdb_id] === 'done' ? '✓ Imported' : importing[movie.tmdb_id] === 'loading' ? 'Importing...' : '+ Import'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col px-4 py-4">
                  <h3 className="truncate text-sm font-bold text-white transition-colors group-hover:text-red-400" title={movie.title}>
                    {movie.title}
                  </h3>

                  {genreNames.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {genreNames.slice(0, 3).map((name) => (
                        <span key={name} className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-gray-400">{name}</span>
                      ))}
                      {genreNames.length > 3 && (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-medium text-gray-500">+{genreNames.length - 3}</span>
                      )}
                    </div>
                  )}

                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
                    {movie.description || 'No description available.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {!isLoading && displayMovies.length === 0 && !error && (
        <div className="rounded-xl border border-white/10 bg-[#0b1220]/60 px-8 py-24 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <p className="mb-4 text-3xl font-bold text-white">No movies found</p>
          <p className="mx-auto max-w-xl text-gray-500">
            {hasActiveFilters ? 'Try adjusting your filters.' : 'Try a different search term.'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="mt-8 rounded-full bg-red-600 px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-105 transition-all">
              Reset All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default DiscoverPage;