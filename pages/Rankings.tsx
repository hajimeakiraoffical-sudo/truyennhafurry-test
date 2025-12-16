
import React from 'react';
import { Link } from 'react-router-dom';
import { useStories } from '../context/StoryContext';
import { Eye, Trophy, Loader2 } from 'lucide-react';
import { Story } from '../types';

const RankItem: React.FC<{ story: Story; rank: number }> = ({ story, rank }) => {
  let badgeColor = "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  if (rank === 1) badgeColor = "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700";
  if (rank === 2) badgeColor = "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600";
  if (rank === 3) badgeColor = "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700";

  return (
    <Link 
      to={`/story/${story.id}`}
      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group"
    >
      <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg font-bold text-xl border ${badgeColor}`}>
         {rank}
      </div>
      
      <div className="flex-shrink-0 w-20 h-28 bg-slate-200 rounded-lg overflow-hidden shadow-sm">
         <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
      </div>

      <div className="flex-grow min-w-0 px-2">
         <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {story.title}
         </h3>
         <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-3">
            {story.originalAuthor} • {story.chapters.length} chương
         </p>
         <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-1.5">
               <Eye size={16} className="text-indigo-500" />
               <span className="text-slate-700 dark:text-slate-300">{story.stats.views.toLocaleString()} lượt xem</span>
            </div>
         </div>
      </div>
    </Link>
  );
};

const Rankings: React.FC = () => {
  const { stories, loading } = useStories();
  // Sort stories by views
  const topViewed = [...stories].sort((a, b) => b.stats.views - a.stats.views);

  return (
    <div className="min-h-screen py-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
           <div className="inline-flex items-center justify-center p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4 shadow-sm">
              <Trophy size={40} />
           </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Bảng Xếp Hạng
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Những bộ truyện tranh được cộng đồng yêu thích nhất tuần qua
          </p>
        </div>

        {loading ? (
           <div className="flex justify-center items-center h-64">
              <Loader2 size={48} className="text-indigo-500 animate-spin" />
           </div>
        ) : (
          <div className="bg-white/50 dark:bg-slate-800/50 rounded-3xl p-4 md:p-8 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
             {topViewed.length > 0 ? (
                <div className="space-y-4">
                  {topViewed.map((story, idx) => (
                    <RankItem key={story.id} story={story} rank={idx + 1} />
                  ))}
                </div>
             ) : (
                <div className="text-center py-8 text-slate-500">Chưa có dữ liệu xếp hạng.</div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rankings;
