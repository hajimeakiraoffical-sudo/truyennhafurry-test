
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStories } from '../context/StoryContext';
import { useTheme } from '../context/ThemeContext';
import { Tag, Loader2, Disc, Eye } from 'lucide-react';
import { Story } from '../types';

// Reuse TagBadge
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

  return (
    <div className="bg-white dark:bg-[#2B2D31] rounded-lg p-2 md:p-3 hover:shadow-md dark:hover:bg-[#313338] transition-all duration-200 flex flex-col h-full shadow-sm border border-slate-200 dark:border-transparent">
      {/* Image Container */}
      <Link to={`/story/${story.id}`} className="block relative aspect-[4/5] md:aspect-[4/3] rounded-lg overflow-hidden group mb-2 md:mb-3">
        <img 
          src={story.coverUrl} 
          alt={story.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Status Badge */}
        <div className={`absolute top-1 right-1 md:top-2 md:right-2 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[9px] md:text-[10px] font-bold shadow-sm backdrop-blur-sm ${getStatusStyle(story.status)}`}>
          {getStatusText(story.status)}
        </div>

        {/* Tags Overlay */}
        <div className="absolute bottom-1 left-1 right-1 md:bottom-2 md:left-2 md:right-2 flex flex-wrap gap-1 pointer-events-none content-end">
          {story.genres.slice(0, 3).map((genre, idx) => ( 
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

      {/* Footer Stats */}
      <div className="mt-auto flex justify-end items-center text-slate-500 dark:text-slate-400 text-xs md:text-sm px-1 pt-2 border-t border-slate-100 dark:border-white/5">
         <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <Eye size={14} className="md:w-[16px] md:h-[16px]" />
            <span className="font-medium">{story.stats.views.toLocaleString()}</span>
         </div>
      </div>
    </div>
  );
};

const Genres: React.FC = () => {
  const { stories, loading, genres } = useStories();
  const { showNSFW } = useTheme();
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  const filteredStories = stories.filter(story => {
    // 1. Hide hidden stories
    if (story.isHidden) return false;

    // 2. NSFW Filter
    const isNSFW = story.genres.some(g => g.toLowerCase().includes('nsfw') || g.toLowerCase() === '18+');
    if (isNSFW && !showNSFW) return false;

    // 3. Genre Filter
    if (selectedGenre === 'All') return true;
    return story.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase() || g.toLowerCase().includes(selectedGenre.toLowerCase()));
  });

  return (
    <div className="min-h-screen py-4 md:py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <div className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Tag className="text-indigo-600 dark:text-indigo-400" />
                Thể Loại Truyện
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Khám phá truyện theo sở thích của bạn.</p>
        </div>

        {/* Genre Selection */}
        <div className="mb-8 flex flex-wrap gap-2">
            <button
                onClick={() => setSelectedGenre('All')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                    selectedGenre === 'All'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
                Tất Cả
            </button>
            {genres.map(genre => {
                 const isSelected = selectedGenre === genre;
                 return (
                    <button
                        key={genre}
                        onClick={() => setSelectedGenre(genre)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                            isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                        {genre}
                    </button>
                 );
            })}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <Loader2 size={48} className="text-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {filteredStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>

            {filteredStories.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-[#2B2D31] rounded-xl mt-4 border border-dashed border-slate-200 dark:border-slate-700">
                <Disc size={48} className="mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-lg">Không tìm thấy truyện nào.</p>
                {(!showNSFW && (selectedGenre === 'NSFW' || selectedGenre === '18+')) && (
                    <p className="text-red-500 text-sm mt-2 font-bold">
                        Vui lòng bật chế độ "Nội dung 18+" trong Cài đặt để xem thể loại này.
                    </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Genres;
