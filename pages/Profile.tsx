
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStories } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, BookOpen, Eye, Edit3, X, Loader2, Check, BadgeCheck, Camera, Image as ImageIcon } from 'lucide-react';
import { Story, User as UserType } from '../types';

// Pre-defined Avatar Seeds for DiceBear
const AVATAR_SEEDS = [
  "Felix", "Aneka", "Zoe", "Simba", "Shadow", "Bella", 
  "Bandit", "Tiger", "Luna", "Oreo", "Jasper", "Gizmo",
  "Coco", "Molly", "Buster", "Loki", "Koda", "Nala"
];

// Reusing StoryCard Component specifically for Profile
const ProfileStoryCard: React.FC<{ story: Story }> = ({ story }) => {
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
    <div className="bg-white dark:bg-[#2B2D31] rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-[#313338] transition-colors duration-200 border border-slate-200 dark:border-slate-700">
      <Link to={`/story/${story.id}`} className="block relative aspect-[4/3] rounded-lg overflow-hidden group mb-3">
        <img 
          src={story.coverUrl} 
          alt={story.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Status Badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm backdrop-blur-sm ${getStatusStyle(story.status)}`}>
           {getStatusText(story.status)}
        </div>
      </Link>

      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-2 leading-tight line-clamp-2 min-h-[2.5em]">
        <Link to={`/story/${story.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
           {story.title}
        </Link>
      </h3>

      <div className="flex justify-end items-center text-slate-500 dark:text-slate-400 text-xs mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
         <div className="flex items-center gap-1">
            <Eye size={14} />
            {/* Sử dụng optional chaining để an toàn */}
            <span>{(story.stats?.views || 0).toLocaleString()}</span>
         </div>
      </div>
    </div>
  );
};

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { stories } = useStories();
  const { user: currentUser, updateUserProfile, getPublicUserProfile, isAdmin } = useAuth();
  
  const [profileUser, setProfileUser] = useState<UserType | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('');
  const [selectedCoverUrl, setSelectedCoverUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Check if viewing own profile
  const isMyProfile = currentUser && (currentUser.id === userId || currentUser.id === profileUser?.id);
  const canUploadCustom = currentUser?.isVerified || isAdmin;

  // Fetch Profile Data
  useEffect(() => {
      const fetchProfile = async () => {
          if (!userId) return;
          // Optimistic: If viewing self, don't fetch stale data, use Context data
          if (currentUser && (currentUser.id === userId || currentUser.name === userId)) {
              setProfileUser(currentUser);
              setLoadingProfile(false);
              return;
          }

          setLoadingProfile(true);
          const userData = await getPublicUserProfile(userId);
          setProfileUser(userData);
          setLoadingProfile(false);
      };
      fetchProfile();
  }, [userId, currentUser]); 

  // Find stories by this user
  const userStories = stories.filter(s => 
    s.uploaderId === userId || s.uploader === userId || s.translator === userId
  );

  const displayUser = isMyProfile ? currentUser : (profileUser || {
    id: userId || '',
    name: userStories.length > 0 ? userStories[0].uploader : 'Người dùng',
    email: '',
    role: userStories.length > 0 ? 'translator' : 'user',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    description: '',
    cover: '',
    isVerified: false,
    joinedAt: undefined
  });

  if (!displayUser) return null;

  // Calculate Join Year
  const getJoinYear = () => {
      if (displayUser.joinedAt) {
          return new Date(displayUser.joinedAt).getFullYear();
      }
      return 2024; // Default/Fallback
  };

  // Logic tính tổng lượt xem (Cập nhật theo yêu cầu)
  const totalViews = userStories.reduce((acc, curr) => {
      return acc + (curr.stats?.views || 0);
  }, 0);

  // Handlers
  const handleEditClick = () => {
      setEditName(displayUser.name);
      setEditDesc(displayUser.description || '');
      setSelectedAvatarUrl(displayUser.avatar || '');
      setSelectedCoverUrl(displayUser.cover || '');
      setIsEditing(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setUploadStatus(`Đang tải lên ${type === 'avatar' ? 'avatar' : 'ảnh bìa'}...`);
          
          try {
             const formData = new FormData();
             formData.append('action', 'upload_image');
             formData.append('file', file);
             // Create a unique path
             const ext = file.name.split('.').pop();
             const path = `uploads/users/${displayUser.id}/${type}_${Date.now()}.${ext}`;
             formData.append('path', path);

             const res = await fetch('/api.php', { method: 'POST', body: formData });
             const data = await res.json();
             
             if (data.success) {
                 if (type === 'avatar') setSelectedAvatarUrl(data.url);
                 else setSelectedCoverUrl(data.url);
                 setUploadStatus('');
             } else {
                 setUploadStatus('Lỗi tải ảnh: ' + data.message);
             }
          } catch (err) {
             setUploadStatus('Lỗi kết nối server.');
          }
      }
  };

  const handleSave = async () => {
      if (!currentUser) return;
      setIsSaving(true);
      try {
          const dbUser: UserType = {
              ...currentUser,
              name: editName,
              description: editDesc,
              avatar: selectedAvatarUrl,
              cover: selectedCoverUrl
          };

          await updateUserProfile(dbUser);
          setIsEditing(false);
          alert("Cập nhật thành công!");
      } catch (e) {
          alert("Có lỗi xảy ra khi lưu.");
      } finally {
          setIsSaving(false);
      }
  };

  if (loadingProfile && !profileUser && userStories.length === 0) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
      );
  }

  return (
    <div className="min-h-screen pb-12 transition-colors duration-300 relative">
      
      {/* EDIT MODAL */}
      {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chỉnh sửa hồ sơ</h3>
                      <button onClick={() => setIsEditing(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-4 no-scrollbar">
                      {uploadStatus && <div className="p-2 bg-indigo-50 text-indigo-600 text-sm rounded">{uploadStatus}</div>}

                      {/* Avatar Selection */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Avatar</label>
                             {canUploadCustom && (
                                <label className="text-xs bg-indigo-600 text-white px-2 py-1 rounded cursor-pointer hover:bg-indigo-700 flex items-center gap-1">
                                    <Camera size={12} /> Tải ảnh lên
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'avatar')} />
                                </label>
                             )}
                        </div>
                        
                        <div className="flex gap-4 items-center mb-3">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100">
                                <img src={selectedAvatarUrl} className="w-full h-full object-cover" alt="Selected" />
                            </div>
                            <div className="text-xs text-slate-500">Ảnh hiện tại</div>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {AVATAR_SEEDS.map((seed) => {
                                const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                                const isSelected = selectedAvatarUrl === url;
                                return (
                                    <button 
                                        key={seed}
                                        onClick={() => setSelectedAvatarUrl(url)}
                                        className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-800' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}
                                    >
                                        <img src={url} alt={seed} className="w-full h-full object-cover" />
                                    </button>
                                )
                            })}
                        </div>
                      </div>

                      {/* Cover Selection (Only for verified/admin) */}
                      {canUploadCustom && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                               <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ảnh bìa (Cover)</label>
                                    <label className="text-xs bg-indigo-600 text-white px-2 py-1 rounded cursor-pointer hover:bg-indigo-700 flex items-center gap-1">
                                        <ImageIcon size={12} /> Tải ảnh bìa
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'cover')} />
                                    </label>
                               </div>
                               {selectedCoverUrl ? (
                                   <div className="w-full h-24 rounded-lg overflow-hidden relative group">
                                       <img src={selectedCoverUrl} className="w-full h-full object-cover" />
                                       <button onClick={() => setSelectedCoverUrl('')} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><X size={12}/></button>
                                   </div>
                               ) : (
                                   <div className="w-full h-24 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 text-xs">Chưa có ảnh bìa</div>
                               )}
                          </div>
                      )}

                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên hiển thị</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tiểu sử</label>
                          <textarea 
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700">Hủy</button>
                      <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                      >
                          {isSaving && <Loader2 className="animate-spin" size={16} />}
                          Lưu Thay Đổi
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* COVER IMAGE */}
      <div className="h-48 md:h-64 bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
          {displayUser.cover ? (
              <img src={displayUser.cover} alt="Cover" className="w-full h-full object-cover" />
          ) : (
              <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90 dark:opacity-40"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20 z-10">
        
        {/* Profile Info Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 flex flex-col md:flex-row items-center gap-6 mb-8">
           
           {/* Avatar */}
           <div className="flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 overflow-hidden shadow-md">
                 <img src={displayUser.avatar} alt={displayUser.name} className="w-full h-full object-cover" />
              </div>
           </div>

           {/* Name & Role */}
           <div className="flex-grow text-center md:text-left pt-2 md:pt-8">
               <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex flex-col md:flex-row items-center md:items-end gap-2 md:gap-3">
                        {displayUser.name}
                        <div className="flex items-center gap-1">
                          <span className="bg-indigo-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full uppercase">
                              {displayUser.role === 'translator' ? 'Dịch Giả' : displayUser.role === 'admin' ? 'Admin' : 'Thành Viên'}
                          </span>
                          {/* Force check for verification to display badge */}
                          {displayUser.isVerified && (
                             <span title="Đã xác minh">
                                <BadgeCheck size={24} className="text-blue-500 fill-blue-500 stroke-white dark:stroke-slate-800" />
                             </span>
                          )}
                        </div>
                    </h1>
                    {displayUser.description && (
                        <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm max-w-lg mx-auto md:mx-0">
                            {displayUser.description}
                        </p>
                    )}
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center justify-center md:justify-start gap-2 mt-3">
                        <Calendar size={14} /> Tham gia {getJoinYear()}
                    </p>
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-col items-center md:items-end gap-3">
                      {isMyProfile && (
                          <button 
                            onClick={handleEditClick}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                          >
                              <Edit3 size={16} /> Chỉnh sửa
                          </button>
                      )}
                      
                      {/* Stats - HIỂN THỊ TỔNG LƯỢT XEM TỪ BIẾN totalViews */}
                      <div className="flex gap-4 md:gap-6 mt-2">
                          <div className="text-center md:text-right">
                             <div className="text-lg font-bold text-slate-900 dark:text-white">{userStories.length}</div>
                             <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Truyện</div>
                          </div>
                          <div className="text-center md:text-right">
                             <div className="text-lg font-bold text-slate-900 dark:text-white">{totalViews.toLocaleString()}</div>
                             <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Lượt xem</div>
                          </div>
                      </div>
                  </div>
               </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="text-indigo-600 dark:text-indigo-400" />
                Danh Sách Truyện Đã Đăng
            </h2>

            {userStories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {userStories.map(story => (
                        <ProfileStoryCard key={story.id} story={story} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400">Người dùng này chưa đăng truyện nào.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
