
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, List, User, Feather, PlayCircle, Share2, AlertTriangle, ShieldCheck, MessageCircle, Send } from 'lucide-react';
import { useStories } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { Comment } from '../types';

const StoryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stories, incrementView, getComments, addComment, refreshStories } = useStories();
  const { user } = useAuth();
  const [showNSFWWarning, setShowNSFWWarning] = useState(false);
  
  // Comment State
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  
  // Ref for preventing double view count in strict mode
  const viewIncremented = useRef(false);

  const story = stories.find(s => s.id === id);

  // Handle View Increment
  useEffect(() => {
      if (id && story && !viewIncremented.current) {
          viewIncremented.current = true;
          incrementView(id);
      }
  }, [id, story, incrementView]);

  // Handle Load Comments
  useEffect(() => {
      if (id) {
          getComments(id).then(setComments);
      }
  }, [id, getComments]);

  useEffect(() => {
      if (story) {
          const isNSFW = story.genres.some(g => {
              const normalized = g.toLowerCase().trim();
              return normalized.includes('nsfw') || normalized === '18+';
          });

          const hasVerifiedAge = localStorage.getItem('nsfw_age_verified') === 'true';
          
          if (isNSFW && !hasVerifiedAge) {
              setShowNSFWWarning(true);
          }
      }
  }, [story]);

  const handleAgeVerify = () => {
      localStorage.setItem('nsfw_age_verified', 'true');
      setShowNSFWWarning(false);
  };

  const handleDenyAge = () => {
      navigate('/');
  };

  const handlePostComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id || !newComment.trim()) return;
      
      const userName = user ? user.name : (guestName.trim() || 'Khách');
      const userAvatar = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;
      
      const comment: Comment = {
          id: 'cmt_' + Date.now(),
          storyId: id,
          userId: user?.id || 'guest',
          userName: userName,
          userAvatar: userAvatar,
          content: newComment.trim(),
          createdAt: new Date().toLocaleDateString('vi-VN')
      };

      setCommentLoading(true);
      const success = await addComment(comment);
      if (success) {
          setComments(prev => [comment, ...prev]);
          setNewComment('');
          // Cập nhật lại list story để số lượng comment hiển thị đúng
          refreshStories();
      } else {
          alert("Lỗi đăng bình luận!");
      }
      setCommentLoading(false);
  };

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

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center transition-colors duration-300">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Đang tải hoặc không tìm thấy...</h2>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Quay lại</button>
      </div>
    );
  }

  const latestChapter = story.chapters[story.chapters.length - 1];
  const firstChapter = story.chapters[0];

  const isNSFWStory = story.genres.some(g => g.toLowerCase().includes('nsfw') || g.toLowerCase() === '18+');

  return (
    <div className="min-h-screen pb-20 transition-colors duration-300 relative">
      
      {/* NSFW Modal */}
      {showNSFWWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md px-4">
              <div className="bg-slate-900 border-2 border-red-600 rounded-2xl max-w-md w-full p-8 text-center shadow-[0_0_50px_rgba(220,38,38,0.3)] animate-in zoom-in-95 duration-200">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-600/20 text-red-500 mb-6">
                      <AlertTriangle size={40} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 uppercase tracking-wide">Cảnh Báo 18+</h2>
                  <p className="text-slate-300 mb-8 leading-relaxed">
                      Truyện này có chứa nội dung nhạy cảm, chỉ dành cho người trưởng thành.
                      <br /><br />
                      <span className="font-bold text-white">Bạn có chắc chắn mình đã đủ 18 tuổi?</span>
                  </p>
                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleAgeVerify}
                        className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/50 flex items-center justify-center gap-2"
                      >
                          <ShieldCheck size={20} />
                          Tôi đã đủ 18 tuổi - Tiếp tục
                      </button>
                      <button 
                        onClick={handleDenyAge}
                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                      >
                          Quay lại trang chủ
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Mobile Header Image Blur Background */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-10"></div>
        <img src={story.coverUrl} className="w-full h-full object-cover blur-sm opacity-50" alt="" />
        <div className="absolute inset-0 z-20 flex items-center px-4 md:px-8 max-w-5xl mx-auto">
            <Link to="/" className="p-2 bg-black/30 rounded-full text-white hover:bg-black/50 backdrop-blur-sm transition-colors">
                <ChevronLeft size={24} />
            </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-30">
        
        {/* Story Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 md:p-8 flex flex-col md:flex-row gap-6 transition-colors">
          
          {/* Cover & Mobile Actions */}
          <div className="flex flex-row md:flex-col gap-4">
             <div className="w-32 md:w-64 flex-shrink-0 mx-auto md:mx-0">
                <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md ring-4 ring-white dark:ring-slate-700 relative">
                  <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
                  
                  {/* Status Badge (Top Right) */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold shadow-md backdrop-blur-sm ${getStatusStyle(story.status)}`}>
                    {getStatusText(story.status)}
                  </div>

                  {/* NSFW Badge (Top Left) */}
                  {isNSFWStory && (
                      <div className="absolute top-2 left-2 bg-black text-white text-xs font-bold px-2 py-1 rounded border border-red-500 shadow-md">
                          18+
                      </div>
                  )}
                </div>
             </div>
             
             <div className="md:hidden flex-grow flex flex-col justify-center">
                 <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight line-clamp-3">
                  {story.title}
                </h1>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <p className="truncate"><span className="font-semibold text-slate-700 dark:text-slate-300">Tác giả:</span> {story.originalAuthor}</p>
                    <p className="truncate">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Dịch:</span> 
                      <Link to={`/profile/${story.uploaderId || story.translator}`} className="text-indigo-600 dark:text-indigo-400 font-medium ml-1">
                        {story.translator}
                      </Link>
                    </p>
                    <p className={`${story.status === 'Đang tiến hành' ? 'text-green-600' : 'text-blue-600'} font-medium`}>{story.status}</p>
                </div>
             </div>
          </div>

          <div className="flex-grow">
            <h1 className="hidden md:block text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {story.title}
            </h1>
            
            <div className="hidden md:flex flex-wrap gap-4 text-sm mb-6">
              <div className="flex items-center text-slate-600 dark:text-slate-300">
                <Feather size={16} className="mr-2 text-indigo-500" />
                <span className="font-semibold mr-1">Tác giả:</span> {story.originalAuthor}
              </div>
              <div className="flex items-center text-slate-600 dark:text-slate-300">
                <User size={16} className="mr-2 text-indigo-500" />
                <span className="font-semibold mr-1">Dịch giả:</span> 
                <Link to={`/profile/${story.uploaderId || story.translator}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  {story.translator}
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
              {story.genres.map(genre => {
                const isTagNSFW = genre.toLowerCase().includes('nsfw') || genre.toLowerCase() === '18+';
                return (
                  <span key={genre} className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium border ${isTagNSFW ? 'bg-red-600 text-white border-red-700' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800'}`}>
                    {genre}
                  </span>
                );
              })}
            </div>

            <div className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 mb-6 line-clamp-4 md:line-clamp-none">
              <p>{story.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {firstChapter && (
                <Link 
                  to={`/read/${story.id}/${firstChapter.id}`}
                  className="col-span-2 md:col-span-1 flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
                >
                  <PlayCircle size={20} className="mr-2" />
                  Đọc Từ Đầu
                </Link>
              )}
               {latestChapter && (
                <Link 
                  to={`/read/${story.id}/${latestChapter.id}`}
                  className="col-span-2 md:col-span-1 flex items-center justify-center px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-medium rounded-xl transition-all active:scale-95"
                >
                  Đọc Mới Nhất
                </Link>
              )}
            </div>
            
            <div className="flex justify-end">
               <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <Share2 size={18} />
                  <span className="text-sm font-medium">Chia sẻ</span>
               </button>
            </div>
          </div>
        </div>

        {/* Chapter List */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <List size={20} className="mr-2 text-indigo-500" />
              Danh Sách Chương
            </h3>
            <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{story.chapters.length} chương</span>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-slate-700">
            {story.chapters.length === 0 ? (
               <div className="p-8 text-center text-slate-500 text-sm">Chưa có chương nào.</div>
            ) : (
              [...story.chapters].reverse().map((chapter) => (
                <Link 
                  key={chapter.id} 
                  to={`/read/${story.id}/${chapter.id}`}
                  className="block px-4 md:px-6 py-3 md:py-4 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors active:bg-indigo-50 dark:active:bg-indigo-900/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-200">
                      {chapter.title}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {chapter.publishedAt}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* COMMENT SECTION */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors p-4 md:p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center mb-6">
               <MessageCircle size={20} className="mr-2 text-indigo-500" />
               Bình Luận ({comments.length})
            </h3>
            
            {/* Input Form */}
            <form onSubmit={handlePostComment} className="mb-8">
                {!user && (
                    <div className="mb-3">
                        <input 
                            type="text" 
                            placeholder="Tên của bạn (Khách)"
                            className="w-full md:w-1/3 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                        />
                    </div>
                )}
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Viết bình luận của bạn..."
                        className="flex-grow px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button 
                        type="submit" 
                        disabled={commentLoading || !newComment.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                        <span className="hidden md:inline">Gửi</span>
                    </button>
                </div>
            </form>

            {/* List */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center text-slate-500 py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                                <img src={comment.userAvatar} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-grow bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{comment.userName}</span>
                                    <span className="text-xs text-slate-400">{comment.createdAt}</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-sm">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default StoryDetails;
