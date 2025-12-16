import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Settings, Home, List, ArrowUp } from 'lucide-react';
import { useStories } from '../context/StoryContext';
import { Theme } from '../types';

const Reader: React.FC = () => {
  const { storyId, chapterId } = useParams<{ storyId: string; chapterId: string }>();
  const { stories } = useStories();
  
  const story = stories.find(s => s.id === storyId);
  const chapter = story?.chapters.find(c => c.id === chapterId);

  const [theme, setTheme] = useState<Theme>('dark'); // Comics usually look better in dark
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide controls on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowControls(false);
      } else {
        setShowControls(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Scroll to top when chapter changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterId]);

  if (!story || !chapter) {
    return <div className="p-10 text-center text-white">Không tìm thấy nội dung.</div>;
  }

  // Find next/prev chapters
  const currentIndex = story.chapters.findIndex(c => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? story.chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < story.chapters.length - 1 ? story.chapters[currentIndex + 1] : null;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Reader Header */}
      <div className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'} ${theme === 'dark' ? 'bg-slate-900/90' : 'bg-white/90'} backdrop-blur-md shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/story/${story.id}`} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div className="flex flex-col">
              <span className="text-xs font-bold opacity-60 uppercase tracking-wider">{story.title}</span>
              <span className="text-sm font-bold truncate max-w-[200px]">{chapter.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-full transition-colors ${showSettings ? 'text-indigo-500 bg-indigo-500/10' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
              >
                <Settings size={20} />
            </button>
             {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute right-4 top-14 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Giao diện</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 text-sm ${theme === 'light' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 dark:border-slate-600 dark:text-slate-300'}`}
                    >
                      Sáng
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 text-sm ${theme === 'dark' ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300' : 'border-slate-200 dark:border-slate-600 dark:text-slate-300'}`}
                    >
                       Tối
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Comic Content (Images) */}
      <main className="flex-grow w-full max-w-3xl mx-auto pt-14 pb-20">
        <div className="flex flex-col items-center bg-black min-h-screen">
            {chapter.images && chapter.images.length > 0 ? (
                chapter.images.map((img, idx) => (
                    <img 
                        key={idx} 
                        src={img} 
                        alt={`Page ${idx + 1}`} 
                        className="w-full h-auto max-w-full block"
                        loading="lazy"
                    />
                ))
            ) : (
                <div className="py-20 text-center text-slate-500">Chưa có ảnh cho chương này.</div>
            )}
        </div>

        {/* Navigation Footer */}
        <div className="p-6 flex items-center justify-between gap-4 max-w-2xl mx-auto">
           {prevChapter ? (
             <Link 
              to={`/read/${story.id}/${prevChapter.id}`}
              className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-sm"
             >
                <ChevronLeft size={16} />
                Trước
             </Link>
           ) : <div className="flex-1"></div>}

           <Link 
              to={`/story/${story.id}`}
              className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
           >
              <List size={20} />
           </Link>

           {nextChapter ? (
             <Link 
              to={`/read/${story.id}/${nextChapter.id}`}
              className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm"
             >
                Sau
                <ChevronRight size={16} />
             </Link>
           ) : <div className="flex-1 text-center opacity-50 text-sm">Hết</div>}
        </div>
      </main>

      {/* Floating Scroll Top */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 p-3 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 z-30 transition-all transform ${showControls ? 'scale-0' : 'scale-100'}`}
      >
          <ArrowUp size={20} />
      </button>

    </div>
  );
};

export default Reader;