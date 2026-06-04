import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import MovieForm from '../components/MovieForm';

// YouTube helper – definován JEDNOU na začátku
const getYouTubeId = (url) => {
  if (!url) return null;
  if (/^[\w-]{11}$/.test(url)) return url; // v DB je přímo ID
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [userData, setUserData] = useState({});
  const [editing, setEditing] = useState(false);
  const [ratingInput, setRatingInput] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trailerAvailable, setTrailerAvailable] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const defaultPoster = 'https://via.placeholder.com/400x600/1a1a1a/666?text=No+Poster';

  // Trailer ID – počítá se AŽ POTÉ co je movie načten
  const trailerId = movie ? getYouTubeId(movie.trailer) : null;

  // ==================== OVERENÍ zda trailer skutečně existuje ====================
  useEffect(() => {
    let cancelled = false;

    const checkTrailer = async () => {
      if (!trailerId) {
        setTrailerAvailable(false);
        return;
      }
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${trailerId}&format=json`
        );
        if (!cancelled) setTrailerAvailable(res.ok);
      } catch {
        if (!cancelled) setTrailerAvailable(false);
      }
    };

    checkTrailer();
    return () => { cancelled = true; };
  }, [trailerId]);

  const fetchMovie = async () => {
    try {
      setLoading(true);
      const [movieRes, udRes] = await Promise.all([
        api.get(`/movies/${id}`),
        api.get(`/movies/${id}/userdata`)
      ]);
      setMovie(movieRes.data);
      setUserData(udRes.data);
      if (udRes.data.user_rating != null) {
        setRatingInput(udRes.data.user_rating);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMovie(); }, [id]);

  const toggleLike = async () => {
    try { await api.post(`/likes/${id}`); fetchMovie(); }
    catch (err) { console.error(err); }
  };

  const toggleWatchlist = async () => {
    try {
      if (userData.in_watchlist) await api.delete(`/watchlist/${id}`);
      else await api.post(`/watchlist/${id}`);
      fetchMovie();
    } catch (err) { console.error(err); }
  };

  const markWatched = async () => {
    try { await api.post(`/history/${id}`); fetchMovie(); }
    catch (err) { console.error(err); }
  };

  const rateMovie = async () => {
    if (ratingInput == null) return;
    try {
      await api.post(`/ratings/${id}`, { score: parseFloat(ratingInput) });
      fetchMovie();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const updateMovie = async (form) => {
    try {
      await api.put(`/movies/${id}`, form);
      setEditing(false);
      fetchMovie();
    } catch (err) { alert(err.response?.data?.errors?.join('\n') || 'Failed'); }
  };

  const deleteMovie = async () => {
    if (!window.confirm('Delete this movie?')) return;
    try { await api.delete(`/movies/${id}`); navigate('/'); }
    catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-28">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-28">
        <p className="text-gray-500 text-2xl mb-5">Movie not found</p>
        <button onClick={() => navigate('/')} className="text-red-500 hover:text-red-400 text-lg">Go Back Home</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate('/')}
        className="text-gray-400 hover:text-white mb-12 flex items-center gap-3 transition-colors text-lg">
        &larr; Back to Movies
      </button>

      {editing && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 mb-12">
          <h2 className="text-2xl font-semibold text-red-500 mb-8">Edit Movie</h2>
          <MovieForm initial={movie} onSubmit={updateMovie} onCancel={() => setEditing(false)} />
        </div>
      )}

      {!editing && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {/* Backdrop */}
          {movie.backdrop && (
            <div className="relative h-80 overflow-hidden">
              <img src={movie.backdrop} alt="" className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
            </div>
          )}

          {/* Poster */}
          {!movie.backdrop && (
            <div className="w-full flex justify-center bg-black/50 p-12">
              <img src={movie.poster || defaultPoster} alt={movie.title}
                className="max-h-[500px] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                onError={(e) => { e.target.src = defaultPoster; }} />
            </div>
          )}

          <div className="p-12 lg:p-16">
            {/* Title */}
            <h1 className="text-4xl font-bold text-white mb-6 text-center">{movie.title}</h1>

            {/* Director & Runtime */}
            {(movie.director || movie.runtime) && (
              <p className="text-gray-500 text-center mb-8 text-lg">
                {movie.director && <span>Directed by <span className="text-gray-300">{movie.director}</span></span>}
                {movie.director && movie.runtime ? ' \u2022 ' : ''}
                {movie.runtime > 0 && <span>{movie.runtime} min</span>}
              </p>
            )}

            {/* Tags */}
            <div className="flex gap-4 flex-wrap justify-center mb-12">
              {movie.genre && movie.genre.split(', ').map((g) => (
                <span key={g} className="bg-gray-800 text-gray-300 px-7 py-3 rounded-full text-sm">{g}</span>
              ))}
              {movie.year && <span className="bg-gray-800 text-gray-300 px-7 py-3 rounded-full text-sm">{movie.year}</span>}
              {movie.rating > 0 && (
                <span className="bg-red-600 text-white px-7 py-3 rounded-full text-sm font-bold">{movie.rating}/10</span>
              )}
            </div>

            {/* Description */}
            {movie.description && (
              <p className="text-center text-gray-400 leading-loose text-center">
                {movie.description}
              </p>
            )}

            {/* ========== TRAILER – VYCENTROVAN ========== */}
            <div className="mb-14">
              <h3 className="text-white text-xl font-semibold mb-6 text-center">Trailer</h3>

              <div className="flex justify-center">
                <div className="w-full max-w-3xl rounded-2xl overflow-hidden bg-black border border-gray-800">
                  {trailerId && trailerAvailable ? (
                    <div className="relative bg-black" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${trailerId}`}
                        className="absolute inset-0 w-full h-full"
                        title={`${movie.title} Trailer`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center bg-black min-h-[360px] text-gray-500 px-6">
                      <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-base">Trailer not available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cast */}
            {movie.cast && movie.cast.length > 0 && (
              <div className="mb-14">
                <h3 className="text-white text-xl font-semibold mb-6 text-center">Cast</h3>
                <div className="flex gap-6 overflow-x-auto pb-4 justify-start">
                  {movie.cast.map((person, i) => (
                    <div key={i} className="flex flex-col items-center min-w-[100px] text-center">
                      {person.profile ? (
                        <img src={person.profile} alt={person.name}
                          className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-gray-700" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-3 text-gray-500 text-2xl border-2 border-gray-700">
                          ?
                        </div>
                      )}
                      <p className="text-white text-xs font-medium">{person.name}</p>
                      <p className="text-gray-600 text-xs">{person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Data Badges */}
            {(userData.user_rating != null || userData.watch_count > 0 || userData.liked || userData.in_watchlist) && (
              <div className="flex gap-4 flex-wrap justify-center mb-12">
                {userData.user_rating != null && (
                  <span className="w-50 bg-blue-500/20 text-blue-400 px-7 py-3 rounded-full text-sm border border-blue-500/30">
                    Your Rating: {userData.user_rating}/10
                  </span>
                )}
                {userData.watch_count > 0 && (
                  <span className="w-50 text-center bg-green-500/20 text-green-400 px-7 py-3 rounded-full text-sm border border-green-500/30">
                    Watched {userData.watch_count} time{userData.watch_count > 1 ? 's' : ''}
                  </span>
                )}
                {userData.liked && (
                  <span className="bg-red-500/20 text-red-400 px-7 py-3 rounded-full text-sm border border-red-500/30">Liked</span>
                )}
                {userData.in_watchlist && (
                  <span className="w-50 text-center bg-yellow-500/20 text-yellow-400 px-7 py-3 rounded-full text-sm border border-yellow-500/30">In Watchlist</span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-5 justify-center mb-14">
              <button onClick={toggleLike}
                className={`w-50 px-12 py-4 rounded-xl font-medium text-base transition-colors ${
                  userData.liked ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}>
                {userData.liked ? '\u2665 Liked' : '\u2661 Like'}
              </button>
              <button onClick={toggleWatchlist}
                className={`w-50 px-12 py-4 rounded-xl font-medium text-base transition-colors ${
                  userData.in_watchlist ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}>
                {userData.in_watchlist ? '\u2605 In Watchlist' : '\u2606 Add to Watchlist'}
              </button>
              <button onClick={markWatched}
                className="w-50 px-12 py-4 rounded-xl font-medium text-base bg-green-700 text-white hover:bg-green-600 transition-colors">
                Mark Watched
              </button>
            </div>

            {/* ========== RATE – Siroky slider, minimal + aesthetic, cerny -> cerveny ========== */}
            <div className="bg-gray-800/40 rounded-2xl py-8 px-10">
              <h3 className="text-white font-semibold mb-4 text-base text-center tracking-wide">Rate this movie</h3>

              {/* Velká hodnota nahoře */}
              <div className="flex items-end justify-center gap-2 mb-5">
                <span className="text-white text-5xl font-bold tabular-nums">
                  {ratingInput.toFixed(1)}
                </span>
                <span className="text-gray-500 text-xl mb-2">/ 10</span>
              </div>

              {/* Slider + progress lista (sjednocene) */}
              <div className="w-full flex justify-center">
                <div className="w-full max-w-xl">

                  {/* Track s gradientem – od cerne do cervene */}
                  <div className="relative w-full h-1.5 bg-gray-900 rounded-full">
                    {/* Progress – gradient od tmaveho cerneho pres cerveno-cerneho k normalnimu cervenemu */}
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
                      style={{
                        width: `${ratingInput * 10}%`,
                        background: 'linear-gradient(to right, #1a0505 0%, #4a0d0d 40%, #991b1b 75%, #dc2626 100%)'
                      }}
                    ></div>

                    {/* Skryty range input pres cele */}
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={ratingInput}
                      onChange={(e) => setRatingInput(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {/* Custom thumb (cervena tecka) */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full shadow-lg pointer-events-none transition-all duration-150 border-2 border-white/20"
                      style={{ left: `calc(${ratingInput * 10}% - 8px)` }}
                    ></div>
                  </div>

                  {/* Label 0 / 10 pod sliderem */}
                  <div className="flex justify-between mt-3 px-1 text-gray-600 text-xs select-none">
                    <span>0</span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              {/* Tlačítko Rate - minimal cervene */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={rateMovie}
                  className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-12 py-3 rounded-xl text-sm transition-colors tracking-wider"
                >
                  RATE
                </button>
              </div>
            </div>

            {/* Edit / Delete (Admin only) */}
            {isAdmin && (
              <div className="flex gap-6 justify-center pt-12 border-t border-gray-800">
                <button onClick={() => setEditing(true)}
                  className="px-12 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-base transition-colors">
                  Edit Movie
                </button>
                <button onClick={deleteMovie}
                  className="px-12 py-4 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 rounded-xl text-base transition-colors">
                  Delete Movie
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetailPage;