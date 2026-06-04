import { Link } from 'react-router-dom';

function MovieCard({ movie, userData, onToggleLike, onToggleWatchlist, onMarkWatched }) {
  const defaultPoster = 'https://via.placeholder.com/400x600/1a1a1a/666?text=No+Poster';

  return (
    <div className="group relative bg-gradient-to-b from-gray-900/80 to-gray-900/40 rounded-xl overflow-hidden border border-gray-800/80 hover:border-red-600/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-900/30 flex flex-col w-full">
      <Link to={`/movie/${movie._id}`}>
        <div className="relative overflow-hidden">
          <img
            src={movie.poster || defaultPoster}
            alt={movie.title}
            className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src = defaultPoster;
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80"></div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="bg-red-600/90 backdrop-blur-sm text-white text-sm font-semibold px-5 py-2.5 rounded-lg border border-red-500/50 shadow-lg shadow-red-900/40">
              View Details
            </span>
          </div>

          {movie.rating > 0 && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-red-700 to-red-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-md shadow-red-900/50 border border-red-500/40">
              ★ {movie.rating}/10
            </div>
          )}

          {userData?.watch_count > 0 && (
            <div className="absolute top-4 left-4 bg-green-600/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-500/50 backdrop-blur-sm">
              {userData.watch_count > 1 ? `✓ Watched ${userData.watch_count}x` : '✓ Watched'}
            </div>
          )}
        </div>
      </Link>

      <div className="p-6 flex flex-col flex-1">
        <Link to={`/movie/${movie._id}`}>
          <h3 className="text-xl font-bold text-white text-center mb-2 hover:text-red-500 transition-colors line-clamp-1">
            {movie.title}
          </h3>
        </Link>

        <p className="text-gray-400 text-sm text-center mb-2">
          {movie.year || ''}
        </p>

        <div className="flex justify-center gap-3 flex-wrap">
          {movie.genre &&
            movie.genre.split(', ').slice(0, 3).map((g) => (
              <span
                key={g}
                className="bg-gray-800/70 text-gray-100 text-sm leading-none px-4 py-2 rounded-md border border-gray-700/70"
              >
                {g}
              </span>
            ))}
        </div>

        {userData?.user_rating != null && (
          <div className="mt-3 mb-4 text-center">
            <span className="inline-block bg-gradient-to-r from-blue-700/40 to-blue-600/40 text-blue-300 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-blue-500/30">
              Your Rating: {userData.user_rating}/10
            </span>
          </div>
        )}

        <div className="flex-1 min-h-[42px] mt-3 mb-4">
          {movie.description ? (
            <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed">
              {movie.description}
            </p>
          ) : (
            <div className="h-full"></div>
          )}
        </div>

        <div className="mt-auto border-t border-gray-800/80 bg-gray-900/70">
          <div className="grid grid-cols-3 divide-x divide-black/60">
            <button
              onClick={() => onToggleLike(movie._id)}
              className={`py-3 text-xs font-semibold transition-all duration-200 ${
                userData?.liked
                  ? 'bg-red-700/35 text-red-300'
                  : 'bg-transparent text-gray-400 hover:text-red-400 hover:bg-gray-800/70'
              }`}
            >
              {userData?.liked ? '♥ Like' : '♡ Like'}
            </button>

            <button
              onClick={() => onToggleWatchlist(movie._id)}
              className={`py-3 text-xs font-semibold transition-all duration-200 ${
                userData?.in_watchlist
                  ? 'bg-yellow-700/30 text-yellow-300'
                  : 'bg-transparent text-gray-400 hover:text-yellow-400 hover:bg-gray-800/70'
              }`}
            >
              {userData?.in_watchlist ? '★ Save' : '☆ Save'}
            </button>

            <button
              onClick={() => onMarkWatched(movie._id)}
              className="py-3 text-xs font-semibold bg-transparent text-gray-400 hover:text-green-400 hover:bg-gray-800/70 transition-all duration-200"
            >
              Watch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;