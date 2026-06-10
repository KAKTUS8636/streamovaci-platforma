import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function WatchlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('added_at');
  const [order, setOrder] = useState('desc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const defaultPoster = 'https://via.placeholder.com/400x600/1a1a1a/666?text=No+Poster';

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/watchlist');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const remove = async (movieId) => {
    try {
      await api.delete(`/watchlist/${movieId}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Extract all unique genres
  const genres = [
    ...new Set(
      items
        .flatMap((entry) =>
          entry.movie.genre
            ? entry.movie.genre.split(',').map((g) => g.trim())
            : []
        )
        .filter(Boolean)
    ),
  ].sort();

  // Filter + sort
  const filteredItems = items
    .filter((entry) => {
      const movie = entry.movie;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !movie.title?.toLowerCase().includes(q) &&
          !movie.genre?.toLowerCase().includes(q) &&
          !movie.year?.toString().includes(q)
        )
          return false;
      }

      // Genre
      if (selectedGenres.length > 0) {
        const movieGenres = movie.genre
          ? movie.genre.split(',').map((g) => g.trim())
          : [];
        if (!selectedGenres.every((g) => movieGenres.includes(g))) return false;
      }

      // Year range
      if (yearFrom && movie.year && movie.year < parseInt(yearFrom)) return false;
      if (yearTo && movie.year && movie.year > parseInt(yearTo)) return false;

      // Min rating
      if (minRating && (movie.rating || 0) < parseFloat(minRating)) return false;

      return true;
    })
    .sort((a, b) => {
      const dir = order === 'desc' ? -1 : 1;
      switch (sortBy) {
        case 'added_at':
          return dir * (new Date(b.added_at || 0) - new Date(a.added_at || 0));
        case 'title':
          return dir * (a.movie.title || '').localeCompare(b.movie.title || '');
        case 'year':
          return dir * ((a.movie.year || 0) - (b.movie.year || 0));
        case 'rating':
          return dir * ((a.movie.rating || 0) - (b.movie.rating || 0));
        default:
          return 0;
      }
    });

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
    setSortBy('added_at');
    setOrder('desc');
  };

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    yearFrom ||
    yearTo ||
    minRating ||
    sortBy !== 'added_at' ||
    order !== 'desc';

  return (
    <div className="relative">
      {/* ====== HERO SECTION ====== */}
      <section className="mb-10 -mx-5 border-y border-white/10 bg-gradient-to-r from-[#070d19] via-[#0b1220] to-[#070d19] px-5 py-10 shadow-[0_24px_90px_rgba(0,0,0,0.42)] lg:-mx-8 lg:px-8 lg:py-14 xl:-mx-12 xl:px-12 xl:py-16">
        <div className="pointer-events-none absolute left-[10%] top-8 h-40 w-40 rounded-full bg-red-600/10 blur-3xl"></div>
        <div className="pointer-events-none absolute right-[10%] top-16 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl"></div>

        {/* SEARCH + FILTER ROW */}
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* SEARCH */}
          <div className="flex w-full items-center rounded-lg border border-white/10 bg-[#070d19]/90 lg:w-[320px]">
            <div className="pl-4 text-red-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search watchlist..."
              className="w-full bg-transparent py-3.5 px-4 text-white placeholder:text-gray-600 outline-none"
            />
          </div>

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
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black">
                    ✓
                  </span>
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
                    <div className="flex flex-wrap gap-2">
                      {genres.map((g) => (
                        <button
                          key={g}
                          onClick={() => toggleGenre(g)}
                          className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                            selectedGenres.includes(g)
                              ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                      {genres.length === 0 && (
                        <p className="text-xs text-gray-600">No genres available</p>
                      )}
                    </div>
                  </div>

                  {/* YEAR RANGE */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Year Release</h4>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        placeholder="From"
                        value={yearFrom}
                        onChange={(e) => setYearFrom(e.target.value)}
                        className="w-full rounded-md bg-gray-900 border border-white/5 p-2 text-xs text-white outline-none focus:border-red-500"
                      />
                      <span className="text-gray-700">—</span>
                      <input
                        type="number"
                        placeholder="To"
                        value={yearTo}
                        onChange={(e) => setYearTo(e.target.value)}
                        className="w-full rounded-md bg-gray-900 border border-white/5 p-2 text-xs text-white outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* RATING */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Min Rating (0-10)</h4>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 8.5"
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                      className="w-full rounded-md bg-gray-900 border border-white/5 p-2 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>

                  {/* SORTING */}
                  <div className="mb-8">
                    <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Sort By</h4>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full rounded-md bg-gray-900 border border-white/5 p-2 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="added_at">Date Added</option>
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
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-red-500/80">Your Collection</p>
          <h1 className="text-7xl font-black tracking-tighter text-white">Watchlist</h1>
          <p className="mt-4 text-gray-400">
            {filteredItems.length} {filteredItems.length === 1 ? 'movie' : 'movies'} saved to watch later
          </p>
        </div>
      </section>

      {/* ====== LOADING ====== */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-red-600"></div>
        </div>
      )}

      {/* ====== MOVIE GRID ====== */}
      {!loading && filteredItems.length > 0 && (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filteredItems.map((entry) => (
            <div
              key={entry._id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-gray-900/80 to-gray-950/90 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-red-500/30 hover:shadow-[0_16px_48px_rgba(220,38,38,0.15)]"
            >
              <Link
                to={`/movie/${entry.movie_id}`}
                className="relative aspect-[2/3] w-full overflow-hidden bg-black"
              >
                <img
                  src={entry.movie.poster || defaultPoster}
                  alt={entry.movie.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { e.target.src = defaultPoster; }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {entry.movie.rating > 0 && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-white/10 bg-black/70 px-2 py-1 text-[10px] font-bold text-amber-400 shadow-lg backdrop-blur-sm">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {Number(entry.movie.rating).toFixed(1)}
                  </div>
                )}

                {entry.movie.year && (
                  <div className="absolute left-3 top-3 rounded-md border border-white/10 bg-black/70 px-2 py-1 text-[10px] font-semibold text-gray-300 backdrop-blur-sm">
                    {entry.movie.year}
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col px-4 py-4">
                <Link to={`/movie/${entry.movie_id}`}>
                  <h3 className="truncate text-sm font-bold text-white transition-colors group-hover:text-red-400" title={entry.movie.title}>
                    {entry.movie.title}
                  </h3>
                </Link>

                {entry.movie.genre && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.movie.genre.split(',').map((g) => g.trim()).filter(Boolean).slice(0, 3).map((g) => (
                      <span key={g} className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-gray-400">
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {entry.added_at && (
                  <p className="mt-2 text-[10px] text-gray-600">
                    Added {new Date(entry.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}

                <button
                  onClick={() => remove(entry.movie_id)}
                  className="mt-3 w-full rounded-lg border border-white/5 bg-white/5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 transition-all duration-200 hover:border-red-500/30 hover:bg-red-600/20 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== EMPTY STATE ====== */}
      {!loading && filteredItems.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-[#0b1220]/60 px-8 py-24 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <p className="mb-4 text-3xl font-bold text-white">
            {items.length === 0 ? 'Your watchlist is empty' : 'No matches found'}
          </p>
          <p className="mx-auto max-w-xl text-gray-500">
            {items.length === 0
              ? 'Start adding movies you want to watch later.'
              : 'Try adjusting your filters.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {items.length === 0 ? (
              <Link to="/" className="rounded-full bg-red-600 px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-105 transition-all">
                Browse Movies
              </Link>
            ) : (
              <button onClick={clearFilters} className="rounded-full bg-red-600 px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-105 transition-all">
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WatchlistPage;