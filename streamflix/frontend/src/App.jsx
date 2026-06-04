import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import WatchlistPage from './pages/WatchlistPage';
import LikesPage from './pages/LikesPage';
import HistoryPage from './pages/HistoryPage';
import RatingsPage from './pages/RatingsPage';
import ProfilePage from './pages/ProfilePage';
import DiscoverPage from './pages/DiscoverPage';
import AdminPage from './pages/AdminPage';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0a0a0a] via-[#0d0d0d] to-[#050505]">
      <Navbar />
      <main className="w-full flex justify-center">
        <div className="w-full max-w-[1920px] px-5 lg:px-8 xl:px-12 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/" element={<ProtectedRoute><AppLayout><HomePage /></AppLayout></ProtectedRoute>} />
        <Route path="/movie/:id" element={<ProtectedRoute><AppLayout><MovieDetailPage /></AppLayout></ProtectedRoute>} />
        <Route path="/discover" element={<ProtectedRoute><AppLayout><DiscoverPage /></AppLayout></ProtectedRoute>} />
        <Route path="/watchlist" element={<ProtectedRoute><AppLayout><WatchlistPage /></AppLayout></ProtectedRoute>} />
        <Route path="/likes" element={<ProtectedRoute><AppLayout><LikesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><AppLayout><HistoryPage /></AppLayout></ProtectedRoute>} />
        <Route path="/ratings" element={<ProtectedRoute><AppLayout><RatingsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AppLayout><AdminPage /></AppLayout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;