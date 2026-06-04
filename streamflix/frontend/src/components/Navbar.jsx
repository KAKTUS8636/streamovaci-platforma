import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/discover', label: 'Discover' },
    { to: '/watchlist', label: 'Watchlist' },
    { to: '/likes', label: 'Liked' },
    { to: '/history', label: 'History' },
    { to: '/ratings', label: 'Ratings' },
    { to: '/profile', label: 'Profile' },
  ];

  if (isAdmin) {
    navLinks.push({ to: '/admin', label: 'Admin' });
  }

  const isActiveLink = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-red-500/20 bg-[#05070d]/95 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-600/70 to-blue-500/50"></div>

      <div className="relative h-20 w-full">
        <Link
          to="/"
          className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-black tracking-[0.24em] text-red-600 drop-shadow-[0_0_18px_rgba(220,38,38,0.38)]"
        >
          STREAMFLIX
        </Link>

        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-3 lg:flex">
          {navLinks.map((link) => {
            const active = isActiveLink(link.to);
            const isAdminLink = link.to === '/admin';

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-full px-2.5 py-1.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? isAdminLink
                      ? 'bg-gradient-to-r from-blue-700 to-red-600 text-white shadow-[0_0_22px_rgba(37,99,235,0.35)]'
                      : 'bg-gradient-to-r from-red-700 to-red-500 text-white shadow-[0_0_22px_rgba(220,38,38,0.42)]'
                    : isAdminLink
                      ? 'text-purple-300 hover:text-white'
                      : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-3">
          <span className="max-w-28 truncate text-sm font-semibold text-gray-300">
            {user.username || user.email || 'Account'}
          </span>

          {isAdmin && (
            <span className="rounded-full border border-purple-500/40 bg-purple-600/20 px-2 py-0.5 text-xs font-semibold text-purple-300 shadow-[0_0_14px_rgba(168,85,247,0.22)]">
              Admin
            </span>
          )}

          <button
            onClick={handleLogout}
            className="rounded-full border border-blue-500/30 bg-blue-950/40 px-3 py-1.5 text-sm font-semibold text-gray-200 transition-all duration-200 hover:border-red-400/70 hover:bg-red-600 hover:text-white hover:shadow-[0_0_24px_rgba(220,38,38,0.32)]"
          >
            Logout
          </button>
        </div>

        <div className="absolute bottom-3 left-5 right-5 flex gap-2 overflow-x-auto lg:hidden">
          {navLinks.map((link) => {
            const active = isActiveLink(link.to);

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-red-600 text-white shadow-[0_0_18px_rgba(220,38,38,0.35)]'
                    : 'border border-white/10 bg-blue-950/40 text-gray-300'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;