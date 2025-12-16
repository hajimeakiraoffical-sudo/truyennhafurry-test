
import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Home from './pages/Home';
import StoryDetails from './pages/StoryDetails';
import Reader from './pages/Reader';
import Genres from './pages/Genres';
import Rankings from './pages/Rankings';
import Profile from './pages/Profile';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { StoryProvider } from './context/StoryContext';
import { AuthProvider } from './context/AuthContext';

// Wrapper to conditionally render Navbar
const AppContent: React.FC = () => {
  const location = useLocation();
  const isReaderPage = location.pathname.startsWith('/read/');
  const { bgClass } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500 ${bgClass}`}>
      {!isReaderPage && <Navbar />}
      
      {/* Add padding bottom for Mobile Nav space */}
      <div className={`flex-grow ${!isReaderPage ? 'pb-20 md:pb-0' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/story/:id" element={<StoryDetails />} />
          <Route path="/read/:storyId/:chapterId" element={<Reader />} />
          <Route path="/genres" element={<Genres />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>

       {!isReaderPage && (
        <>
          <footer className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 py-8 transition-colors duration-300 mb-16 md:mb-0">
            <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 dark:text-slate-400 text-sm">
              <p>&copy; 2025 Truyện Nhà Furry. Nền tảng truyện tranh số 2 sau truyentranhgay.</p>
            </div>
          </footer>
          <MobileNav />
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
        <AuthProvider>
          <StoryProvider>
            <Router>
              <AppContent />
            </Router>
          </StoryProvider>
        </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
