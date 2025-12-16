
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Disc, Loader2, Search, Megaphone } from 'lucide-react';
import { useStories } from '../context/StoryContext';
import { useTheme } from '../context/ThemeContext';
import { Story } from '../types';

// Helper component for tags
const TagBadge: React.FC<{ tag: string }> = ({ tag }) => {
  let bgClass = "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-white";
  let icon = null;
  const t = tag.toLowerCase().trim();

  if (t.includes('nsfw') || t === '18+') {
    bgClass = "bg-black text-white border border-slate-700";
    icon = <span className="inline-block w-3 h-3 md:w-4 md:h-4 mr-1 bg-red-600 rounded-full text-[8px] md:text-[10px] flex items-center justify-center font-bold">18</span>;
  } else if (t.includes('chubby')) {
    bgClass = "bg-[#8B0000] text-white"; // Deep red/brown
  } else if (t.includes('furry')) {
    bgClass = "bg-[#D97706] text-white"; // Amber/Orange
  } else if (t.includes('bara')) {
    bgClass = "bg-[#A16207] text-white"; // Yellowish brown
  } else if (t.includes('bdsm')) {
    bgClass = "bg-[#4C1D95] text-white"; // Dark Violet
  } else if (t.includes('cute')) {
    bgClass = "bg-[#EC4899] text-white"; // Pink
  } else if (t.includes('sfw')) {
    bgClass = "bg-[#16A34A] text-white"; // Green
  } else if (t.includes('muscle')) {
    bgClass = "bg-[#57534E] text-white"; // Stone/Grey
  } else if (t.includes('yaoi')) {
    bgClass = "bg-[#BE185D] text-white"; // Pink-700
  }

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-[10px] md:text-xs font-medium shadow-sm ${bgClass}`}>
      {icon}
      {tag}
    </span>
  );
};

const StoryCard: React.FC<{ story: Story }> = ({ story }) => {
  const getStatusStyle = (status: string) => {
    if (status === 'Đang tiến hành') return 'bg-green-600 text-white';
    if (status === 'Đã hoàn thành') return 'bg-blue-600 text-white';
    return 'bg-slate-600 text-white';
  };

  const getStatusText = (status: string) => {
    if (status === 'Đang tiến hành') return 'Ongoing';
    if (status === 'Đã hoàn thành') return 'Full';
    return 'Pause';
  };

  // Tính toán thời gian hiển thị
  const getDisplayTime = (dateString: string) => {
      if (!dateString) return 'Mới đăng';
      const date = new Date(dateString);
      const now = new Date();
      // Diff in minutes
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

      if (diffInMinutes < 5) return 'Vừa xong'; // Under 5 mins
      if (diffInMinutes < 60) return 'Mới đăng'; // Under 1 hour
      
      // Default: dd/mm/yyyy
      return date.toLocaleDateString('vi-VN');
  };

  const timeDisplay = getDisplayTime(story.lastUpdated);

  return (
    <div className="bg-white dark:bg-[#2B2D31] rounded-lg p-2 md:p-3 hover:shadow-md dark:hover:bg-[#313338] transition-all duration-200 flex flex-col h-full shadow-sm border border-slate-200 dark:border-transparent">
      {/* Header Info */}
      <div className="flex items-center text-[10px] md:text-xs mb-1.5 md:mb-2 truncate">
        {story.uploaderBadge && (
          <span className="font-bold text-indigo-600 dark:text-[#9B84EE] mr-1 flex-shrink-0">{story.uploaderBadge}</span>
        )}
        <span className="text-slate-400 dark:text-slate-500 mx-1 hidden md:inline">•</span>
        <Link to={`/profile/${story.uploaderId || story.translator}`} className="font-bold text-pink-600 dark:text-[#F47FFF] hover:underline mr-2 truncate">
          {story.translator}
        </Link>
        <span className="text-slate-400 dark:text-slate-500 hidden md:inline ml-auto">{timeDisplay}</span>
      </div>

      {/* Image Container */}
      <Link to={`/story/${story.id}`} className="block relative aspect-[4/5] md:aspect-[4/3] rounded-lg overflow-hidden group mb-2 md:mb-3">
        <img 
          src={story.coverUrl} 
          alt={story.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Status Badge (Top Right) */}
        <div className={`absolute top-1 right-1 md:top-2 md:right-2 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[9px] md:text-[10px] font-bold shadow-sm backdrop-blur-sm ${getStatusStyle(story.status)}`}>
          {getStatusText(story.status)}
        </div>

        {/* Mobile Time Overlay (Moved to Top Left to avoid overlap) */}
        <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-white md:hidden">
          {timeDisplay}
        </div>

        {/* Tags Overlay */}
        <div className="absolute bottom-1 left-1 right-1 md:bottom-2 md:left-2 md:right-2 flex flex-wrap gap-1 pointer-events-none content-end">
          {story.genres.slice(0, 3).map((genre, idx) => ( // Limit tags on mobile
             <TagBadge key={idx} tag={genre} />
          ))}
          {story.genres.length > 3 && (
            <span className="bg-slate-800/80 text-white text-[9px] px-1 rounded flex items-center">+</span>
          )}
        </div>
      </Link>

      {/* Title */}
      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-[15px] mb-1 md:mb-2 leading-tight line-clamp-2 min-h-[2.5em]">
        <Link to={`/story/${story.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
           {story.title}
        </Link>
      </h3>

      {/* Footer Stats (Replaced Likes/Comments with Views for a cleaner look without interaction) */}
      <div className="mt-auto flex justify-end items-center text-slate-500 dark:text-slate-400 text-xs md:text-sm px-1 pt-2 border-t border-slate-100 dark:border-white/5">
         <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <Eye size={14} className="md:w-[16px] md:h-[16px]" />
            <span className="font-medium">{story.stats.views.toLocaleString()}</span>
         </div>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const { stories, loading, announcement } = useStories();
  const { showNSFW } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStories = stories.filter(story => {
    // 1. Ẩn truyện bị admin ẩn
    if (story.isHidden) return false;

    // 2. Lọc NSFW
    const isNSFW = story.genres.some(g => g.toLowerCase().includes('nsfw') || g.toLowerCase() === '18+');
    if (isNSFW && !showNSFW) return false;

    // 3. Lọc theo từ khóa
    return story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           story.genres.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-200 py-4 md:py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Search & Hero */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 dark:border-slate-700 pb-4 md:pb-6">
           <div className="w-full md:w-auto">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2">Mới Cập Nhật</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">Danh sách truyện tranh mới nhất từ cộng đồng.</p>
           </div>
           
           <div className="w-full md:w-80 relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400 dark:text-slate-500" />
             </div>
            <input 
              type="text" 
              placeholder="Tìm tên truyện, thể loại..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#313338] border border-slate-200 dark:border-transparent focus:border-indigo-500 text-slate-900 dark:text-slate-200 focus:outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Announcement Box */}
        {announcement && announcement.isShow && (
            <div className="mb-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-800/50 rounded-lg text-indigo-600 dark:text-indigo-300 flex-shrink-0">
                    <Megaphone size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-indigo-800 dark:text-indigo-200 mb-1">Thông Báo Từ Quản Trị Viên</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {announcement.message}
                    </p>
                </div>
            </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <Loader2 size={48} className="text-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {filteredStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>

            {filteredStories.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-[#2B2D31] rounded-xl mt-4 border border-dashed border-slate-200 dark:border-slate-700">
                <Disc size={48} className="mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-lg">Không tìm thấy truyện nào phù hợp.</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
                    {showNSFW ? 'Hãy thử từ khóa khác.' : 'Hãy thử bật "Nội dung 18+" trong Cài đặt hoặc tìm từ khóa khác.'}
                </p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default Home;
