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
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const filteredMovies = movies.filter((movie) => {
    if (selectedGenres.length === 0) return true;

    const movieGenres = movie.genre
      ? movie.genre.split(',').map((genre) => genre.trim())
      : [];

    return selectedGenres.every((genre) => movieGenres.includes(genre));
  });

  const fetchMovies = async () => {
    try {
      setLoading(true);

      const params = {};
      if (searchQuery) params.search = searchQuery;

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

      const uniqueGenres = [
        ...new Set(
          res.data
            .flatMap((genre) => genre.split(','))
            .map((genre) => genre.trim())
            .filter(Boolean)
        ),
      ].sort();

      setGenres(uniqueGenres);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMovies();
    fetchGenres();
  }, [searchQuery]);

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const clearGenres = () => setSelectedGenres([]);

  const addMovie = async (form) => {
    try {
      await api.post('/movies', form);
      setShowForm(false);
      fetchMovies();
      fetchGenres();
    } catch (err) {
      alert(err.response?.data?.errors?.join('\n') || 'Failed');
    }
  };

  const updateMovie = async (form) => {
    try {
      await api.put(`/movies/${editingMovie._id}`, form);
      setEditingMovie(null);
      fetchMovies();
      fetchGenres();
    } catch (err) {
      alert(err.response?.data?.errors?.join('\n') || 'Failed');
    }
  };

  const toggleLike = async (movieId) => {
    try {
      await api.post(`/likes/${movieId}`);
      fetchMovies();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleWatchlist = async (movieId) => {
    const inWatchlist = userDataMap[movieId]?.in_watchlist;
    try {
      if (inWatchlist) await api.delete(`/watchlist/${movieId}`);
      else await api.post(`/watchlist/${movieId}`);
      fetchMovies();
    } catch (err) {
      console.error(err);
    }
  };

  const markWatched = async (movieId) => {
    try {
      await api.post(`/history/${movieId}`);
      fetchMovies();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <section className="mb-10 -mx-5 border-y border-white/10 bg-gradient-to-r from-[#070d19] via-[#0b1220] to-[#070d19] px-5 py-10 shadow-[0_24px_90px_rgba(0,0,0,0.42)] lg:-mx-8 lg:px-8 lg:py-14 xl:-mx-12 xl:px-12 xl:py-16">
        <div className="pointer-events-none absolute left-[10%] top-8 h-40 w-40 rounded-full bg-red-600/18 blur-3xl"></div>
        <div className="pointer-events-none absolute right-[10%] top-16 h-48 w-48 rounded-full bg-blue-600/14 blur-3xl"></div>

        {/* SEARCH + GENRES NAHORE - OPRAVENA SIRKA */}
        <div className="relative mt-2 flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          
          {/* SEARCH - TED STEJNE SIROKY JAKO GENRES (280px) */}
          <div className="flex w-full items-center rounded-lg border border-white/10 bg-[#070d19]/90 transition-all duration-200 focus-within:border-red-500/60 focus-within:shadow-[0_0_28px_rgba(220,38,38,0.16)] lg:w-[280px]">
            <div className="flex h-full items-center pl-4 pr-3 text-red-400/80">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
            </div>

            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies..."
              className="w-full bg-transparent py-4 pr-5 text-white placeholder:text-gray-600 outline-none"
            />
          </div>

          <div className="relative w-full lg:w-[280px] lg:shrink-0">
            <button
              type="button"
              onClick={() => setShowGenreDropdown((prev) => !prev)}
              className="relative w-full rounded-lg border border-white/10 bg-[#070d19]/90 py-4 pl-5 pr-12 text-left text-white outline-none transition-all duration-200 hover:border-red-500/40"
            >
              <span className="text-gray-300">
                {selectedGenres.length === 0 ? 'All Genres' : `${selectedGenres.length} selected`}
              </span>
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500">
                {showGenreDropdown ? '▴' : '▾'}
              </span>
            </button>

            {showGenreDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowGenreDropdown(false)}
                ></div>

                <div className="absolute right-0 top-full z-50 mt-2 max-h-96 w-full min-w-[280px] overflow-y-auto rounded-xl border border-gray-700 bg-[#070d19] p-4 shadow-2xl shadow-black/60">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <span className="text-xs uppercase tracking-wider text-gray-500">
                      Multiple genres allowed
                    </span>

                    {selectedGenres.length > 0 && (
                      <button
                        type="button"
                        onClick={clearGenres}
                        className="text-xs font-semibold text-red-400 underline hover:text-red-300"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={clearGenres}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                        selectedGenres.length === 0
                          ? 'border border-red-500/40 bg-gradient-to-r from-red-700 to-red-600 text-white shadow-md shadow-red-900/40'
                          : 'border border-gray-700/60 bg-gray-800/60 text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      All
                    </button>

                    {genres.map((genre) => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                          selectedGenres.includes(genre)
                            ? 'border border-red-500/40 bg-gradient-to-r from-red-700 to-red-600 text-white shadow-md shadow-red-900/40'
                            : 'border border-gray-700/60 bg-gray-800/60 text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* TITULEK POD SEARCH/FILTER */}
        <div className="relative mt-8 flex flex-col items-center gap-6 text-center">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.34em] text-red-400/80">
              Streamflix Library
            </p>
            <h1 className="text-6xl font-black tracking-tight text-white">Movies</h1>
            <p className="mt-3 text-base leading-relaxed text-gray-400 sm:text-lg">
              {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'} ready in your cinematic collection.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingMovie(null);
              }}
              className="rounded-lg border border-red-500/30 bg-red-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(220,38,38,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-[0_0_42px_rgba(220,38,38,0.48)]"
            >
              {showForm ? 'Close Form' : '+ Add Movie'}
            </button>
          )}
        </div>

        {selectedGenres.length > 0 && (
          <p className="mt-3 text-center text-xs text-red-400/80">
            Showing: <span className="font-semibold text-red-500">{selectedGenres.join(' + ')}</span>
          </p>
        )}
      </section>

      {isAdmin && showForm && (
        <div className="mb-10 rounded-xl border border-red-500/15 bg-[#0b1220]/80 p-8 shadow-[0_22px_70px_rgba(0,0,0,0.38)] backdrop-blur-xl">
          <h2 className="mb-8 text-2xl font-bold text-red-400">Add New Movie</h2>
          <MovieForm onSubmit={addMovie} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {isAdmin && editingMovie && (
        <div className="mb-10 rounded-xl border border-blue-500/15 bg-[#0b1220]/80 p-8 shadow-[0_22px_70px_rgba(0,0,0,0.38)] backdrop-blur-xl">
          <h2 className="mb-8 text-2xl font-bold text-blue-300">Edit Movie</h2>
          <MovieForm
            initial={editingMovie}
            onSubmit={updateMovie}
            onCancel={() => setEditingMovie(null)}
          />
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-28">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-950 border-t-red-600 shadow-[0_0_30px_rgba(220,38,38,0.25)]"></div>
        </div>
      )}

      {!loading && filteredMovies.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
              userData={userDataMap[movie._id]}
              onToggleLike={toggleLike}
              onToggleWatchlist={toggleWatchlist}
              onMarkWatched={markWatched}
            />
          ))}
        </div>
      )}

      {!loading && filteredMovies.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-[#0b1220]/60 px-8 py-24 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <p className="mb-4 text-3xl font-bold text-white">No movies found</p>
          <p className="mx-auto max-w-xl text-gray-500">
            {isAdmin
              ? 'Try a different search or genre combination, or add a new movie.'
              : 'Try a different search or genre combination.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default HomePage;