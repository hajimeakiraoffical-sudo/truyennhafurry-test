
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStories } from '../context/StoryContext';
import { User, Story, Announcement, UploadSettings } from '../types';
import { Shield, CheckCircle, Trash2, Users, BookOpen, Loader2, AlertTriangle, BadgeCheck, RefreshCw, Megaphone, Save, Eye, EyeOff, FileText, Settings as SettingsIcon, Server, Cloud, Palette, Tag, Plus, X } from 'lucide-react';

const Admin: React.FC = () => {
  const { user, isAdmin, getAllUsers, toggleUserVerification, toggleAdminRole, deleteUser, updateAnnouncement } = useAuth();
  const { deleteStory, getRawStories, toggleStoryVisibility, announcement, guideContent, updateGuide, uploadSettings, updateUploadSettings, genres, updateGenres } = useStories();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'users' | 'stories' | 'announcement' | 'guide' | 'settings' | 'genres'>('users');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [rawStoriesList, setRawStoriesList] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);

  // Announcement State
  const [annMessage, setAnnMessage] = useState('');
  const [annShow, setAnnShow] = useState(false);

  // Guide State
  const [guideText, setGuideText] = useState('');

  // Upload Settings State
  const [localUploadSettings, setLocalUploadSettings] = useState<UploadSettings>({
      allowServer: true,
      allowDrive: true,
      allowCanva: true
  });

  // Genre State
  const [localGenres, setLocalGenres] = useState<string[]>([]);
  const [newGenre, setNewGenre] = useState('');

  useEffect(() => {
    if (!isAdmin) {
        navigate('/');
        return;
    }
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'stories') fetchStories();
    if (activeTab === 'announcement' && announcement) {
        setAnnMessage(announcement.message);
        setAnnShow(announcement.isShow);
    }
    if (activeTab === 'guide') {
        setGuideText(guideContent);
    }
    if (activeTab === 'settings') {
        setLocalUploadSettings(uploadSettings);
    }
    if (activeTab === 'genres') {
        setLocalGenres(genres);
    }
  }, [isAdmin, activeTab, announcement, guideContent, uploadSettings, genres]);

  const fetchUsers = async () => {
      setLoading(true);
      const data = await getAllUsers();
      setUsersList(data);
      setLoading(false);
  };

  const fetchStories = async () => {
      setLoading(true);
      const data = await getRawStories();
      setRawStoriesList(data);
      setLoading(false);
  };

  const handleToggleVerify = async (targetUser: User) => {
      const confirmMsg = targetUser.isVerified 
        ? `Hủy bỏ xác minh cho ${targetUser.name}?` 
        : `Xác nhận ${targetUser.name} là dịch giả uy tín?`;
      
      if (!window.confirm(confirmMsg)) return;

      setUsersList(prev => prev.map(u => 
        u.id === targetUser.id ? { ...u, isVerified: !u.isVerified } : u
      ));

      const success = await toggleUserVerification(targetUser.id);
      
      if (!success) {
          alert("Lỗi cập nhật. Vui lòng thử lại.");
          fetchUsers();
      }
  };

  const handleToggleAdmin = async (targetUser: User) => {
      if (targetUser.id === 'admin_hajime') {
          alert("Không thể thay đổi quyền của Admin gốc.");
          return;
      }

      const isPromoting = targetUser.role !== 'admin';
      const confirmMsg = isPromoting 
        ? `Bạn có chắc muốn thăng cấp "${targetUser.name}" thành ADMIN?\nHọ sẽ có toàn quyền quản lý hệ thống!`
        : `Bạn có chắc muốn gỡ quyền Admin của "${targetUser.name}"?`;
      
      if (!window.confirm(confirmMsg)) return;

      const success = await toggleAdminRole(targetUser.id);
      
      if (success) {
          alert(isPromoting ? "Đã thăng cấp thành công!" : "Đã gỡ quyền Admin thành công!");
          fetchUsers();
      } else {
          alert("Lỗi cập nhật. Vui lòng thử lại.");
      }
  };

  const handleDeleteUser = async (targetUser: User) => {
      const confirmMsg = `CẢNH BÁO: Bạn có chắc muốn XÓA VĨNH VIỄN tài khoản "${targetUser.name}"?\n\nHành động này không thể hoàn tác!`;
      if (!window.confirm(confirmMsg)) return;

      const success = await deleteUser(targetUser.id);
      if (success) {
          alert(`Đã xóa tài khoản ${targetUser.name}.`);
          fetchUsers();
      } else {
          alert("Xóa thất bại. Vui lòng thử lại.");
      }
  };

  const handleDeleteStory = async (storyId: string, title: string) => {
      if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn truyện "${title}"? HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC.`)) {
          setLoading(true);
          const success = await deleteStory(storyId);
          if (success) {
              alert("Đã xóa truyện thành công.");
              fetchStories();
          } else {
              alert("Xóa thất bại. Vui lòng kiểm tra console hoặc Token.");
          }
          setLoading(false);
      }
  };

  const handleToggleHideStory = async (story: Story) => {
      const confirmMsg = story.isHidden
         ? `Hiện lại truyện "${story.title}"?`
         : `Ẩn truyện "${story.title}" khỏi danh sách công khai?`;
      
      if (window.confirm(confirmMsg)) {
          setLoading(true);
          const success = await toggleStoryVisibility(story.id);
          if (success) {
              fetchStories();
          } else {
              alert("Thao tác thất bại.");
          }
          setLoading(false);
      }
  };

  const handleSaveAnnouncement = async () => {
      if (!annMessage.trim()) {
          alert("Nội dung thông báo không được để trống!");
          return;
      }
      
      const newAnn: Announcement = {
          message: annMessage,
          isShow: annShow,
          updatedAt: new Date().toISOString()
      };

      const success = await updateAnnouncement(newAnn);
      if (success) {
          alert("Cập nhật thông báo thành công!");
      } else {
          alert("Lỗi cập nhật thông báo.");
      }
  };

  const handleSaveGuide = async () => {
      setLoading(true);
      const success = await updateGuide(guideText);
      if (success) {
          alert("Cập nhật hướng dẫn thành công!");
      } else {
          alert("Lỗi cập nhật hướng dẫn.");
      }
      setLoading(false);
  };

  const handleSaveUploadSettings = async () => {
      setLoading(true);
      const success = await updateUploadSettings(localUploadSettings);
      if (success) {
          alert("Cập nhật cài đặt upload thành công!");
      } else {
          alert("Lỗi cập nhật cài đặt upload.");
      }
      setLoading(false);
  };

  // Genre Handlers
  const handleAddGenre = async () => {
      if (!newGenre.trim()) return;
      if (localGenres.includes(newGenre.trim())) {
          alert("Thể loại này đã tồn tại!");
          return;
      }
      
      const updated = [...localGenres, newGenre.trim()];
      setLocalGenres(updated);
      setNewGenre('');
      
      const success = await updateGenres(updated);
      if(!success) alert("Lỗi lưu thể loại");
  };

  const handleDeleteGenre = async (genreToDelete: string) => {
      if (!window.confirm(`Bạn có chắc muốn xóa thể loại "${genreToDelete}"?`)) return;
      
      const updated = localGenres.filter(g => g !== genreToDelete);
      setLocalGenres(updated);
      
      const success = await updateGenres(updated);
      if(!success) alert("Lỗi lưu thể loại");
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen py-8 px-4 transition-colors">
       <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
             <div className="p-3 bg-red-600 rounded-xl text-white shadow-lg shadow-red-500/30">
                 <Shield size={32} />
             </div>
             <div>
                 <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                 <p className="text-slate-500 dark:text-slate-400">Quản lý hệ thống Truyện Nhà Furry</p>
             </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
             {[
               { id: 'users', label: 'Tài khoản', icon: Users },
               { id: 'stories', label: 'Truyện', icon: BookOpen },
               { id: 'genres', label: 'Thể loại', icon: Tag },
               { id: 'announcement', label: 'Thông Báo', icon: Megaphone },
               { id: 'guide', label: 'Hướng Dẫn', icon: FileText },
               { id: 'settings', label: 'Cài đặt Upload', icon: SettingsIcon },
             ].map((tab) => (
                 <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'}`}
                 >
                    <tab.icon size={18} /> {tab.label}
                 </button>
             ))}
             
             <div className="ml-auto">
                 <button 
                    onClick={() => {
                        if (activeTab === 'users') fetchUsers();
                        else if (activeTab === 'stories') fetchStories();
                    }}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500"
                    title="Làm mới dữ liệu"
                 >
                     <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                 </button>
             </div>
          </div>

          {/* CONTENT TABS */}
          {activeTab === 'users' && (
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Vai trò</th>
                                <th className="p-4 text-center">Xác minh</th>
                                <th className="p-4 text-center">Admin</th>
                                <th className="p-4 text-right">Xóa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></td></tr>
                            ) : usersList.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-200 dark:border-slate-600">
                                                <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                                    {u.name}
                                                    {u.isVerified && <BadgeCheck size={14} className="text-blue-500 fill-white dark:fill-slate-800" />}
                                                </div>
                                                <div className="text-xs text-slate-400">{u.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            u.role === 'translator' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                            u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                            'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {u.role === 'translator' && (
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => handleToggleVerify(u)}
                                                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${u.isVerified 
                                                        ? 'bg-blue-100 text-blue-700 hover:bg-red-100 hover:text-red-600 hover:content-["Hủy"]' 
                                                        : 'bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600'}`}
                                                    title={u.isVerified ? "Bấm để hủy xác minh" : "Bấm để xác minh"}
                                                >
                                                    {u.isVerified ? (
                                                        <>
                                                            <CheckCircle size={14} /> Đã Duyệt
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-3 h-3 rounded-full border-2 border-slate-400"></div> Duyệt
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {u.id !== 'admin_hajime' && (
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => handleToggleAdmin(u)}
                                                    className={`p-2 rounded-lg transition-colors ${u.role === 'admin' 
                                                        ? 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20' 
                                                        : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                                                    title={u.role === 'admin' ? "Gỡ quyền Admin" : "Thăng cấp Admin"}
                                                >
                                                    <Shield size={18} fill={u.role === 'admin' ? "currentColor" : "none"} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {u.role !== 'admin' && (
                                            <button 
                                                onClick={() => handleDeleteUser(u)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Xóa tài khoản này"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
          )}

          {activeTab === 'stories' && (
              <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                      <AlertTriangle size={18} />
                      <span>Dữ liệu dưới đây được tải trực tiếp từ GitHub (Real-time). Xóa truyện tại đây sẽ có hiệu lực ngay lập tức.</span>
                  </div>
                  
                  {loading ? (
                     <div className="flex justify-center p-12">
                         <Loader2 className="animate-spin text-indigo-500" size={32} />
                     </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rawStoriesList.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-slate-500">Chưa có truyện nào trong hệ thống.</div>
                        ) : rawStoriesList.map(story => (
                            <div key={story.id} className={`bg-white dark:bg-slate-800 p-4 rounded-xl border flex gap-4 shadow-sm hover:shadow-md transition-shadow ${story.isHidden ? 'border-red-500 opacity-75' : 'border-slate-200 dark:border-slate-700'}`}>
                                <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 relative">
                                    <img src={story.coverUrl} className="w-full h-full object-cover" alt="" />
                                    {story.isHidden && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                            ĐÃ ẨN
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0 flex flex-col">
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate" title={story.title}>{story.title}</h3>
                                    <div className="text-xs text-slate-500 mb-2 space-y-1">
                                        <p>Dịch giả: <span className="text-indigo-500 font-medium">{story.translator}</span></p>
                                        <p>{story.chapters.length} chương • {story.status}</p>
                                        <p className="text-[10px] text-slate-400">ID: {story.id}</p>
                                    </div>
                                    
                                    <div className="mt-auto flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleToggleHideStory(story)}
                                            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider border ${story.isHidden 
                                                ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                                                : 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100'}`}
                                            title={story.isHidden ? "Hiện truyện này" : "Ẩn truyện này"}
                                        >
                                            {story.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                            {story.isHidden ? 'Hiện' : 'Ẩn'}
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleDeleteStory(story.id, story.title)}
                                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/30"
                                        >
                                            <Trash2 size={14} /> Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                  )}
              </div>
          )}

          {activeTab === 'genres' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Tag className="text-indigo-500" />
                      Quản lý Thể loại
                  </h2>
                  <p className="text-sm text-slate-500 mb-6">Thêm hoặc xóa các thể loại truyện. Thay đổi sẽ cập nhật cho toàn bộ hệ thống.</p>
                  
                  <div className="flex gap-2 mb-6">
                      <input 
                        type="text" 
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value)}
                        placeholder="Nhập tên thể loại mới..."
                        className="flex-grow px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button 
                        onClick={handleAddGenre}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
                      >
                          <Plus size={20} /> Thêm
                      </button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                      {localGenres.map(genre => (
                          <div key={genre} className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                              <span className="font-medium">{genre}</span>
                              <button 
                                onClick={() => handleDeleteGenre(genre)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                              >
                                  <X size={16} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'announcement' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6 max-w-2xl">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Megaphone className="text-orange-500" />
                      Cài đặt Hộp Thông Báo
                  </h2>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nội dung thông báo</label>
                          <textarea 
                             rows={4}
                             className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                             placeholder="Nhập nội dung thông báo hiển thị trên trang chủ..."
                             value={annMessage}
                             onChange={(e) => setAnnMessage(e.target.value)}
                          ></textarea>
                      </div>

                      <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id="showAnn"
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            checked={annShow}
                            onChange={(e) => setAnnShow(e.target.checked)}
                          />
                          <label htmlFor="showAnn" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                              Hiển thị thông báo trên trang chủ
                          </label>
                      </div>

                      <div className="pt-4 flex justify-end">
                          <button 
                            onClick={handleSaveAnnouncement}
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                          >
                              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                              Lưu Cài Đặt
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'guide' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileText className="text-indigo-500" />
                      Biên tập trang Hướng Dẫn
                  </h2>
                  <p className="text-sm text-slate-500 mb-4">Hỗ trợ định dạng HTML cơ bản (thẻ p, b, i, ul, li, br, h3, ...)</p>
                  
                  <div className="space-y-4">
                      <textarea 
                         rows={15}
                         className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono text-sm"
                         placeholder="Nhập nội dung hướng dẫn (HTML)..."
                         value={guideText}
                         onChange={(e) => setGuideText(e.target.value)}
                      ></textarea>

                      <div className="pt-4 flex justify-end">
                          <button 
                            onClick={handleSaveGuide}
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                          >
                              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                              Lưu Hướng Dẫn
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'settings' && (
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6 max-w-2xl">
                   <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                       <SettingsIcon className="text-slate-500" />
                       Cài đặt Upload
                   </h2>
                   <p className="text-sm text-slate-500 mb-6">Quản lý các phương thức upload được phép sử dụng cho Dịch Giả.</p>
                   
                   <div className="space-y-4">
                       <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                           <div className="flex items-center gap-3">
                               <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                   <Server size={20} />
                               </div>
                               <div>
                                   <h3 className="font-bold text-slate-900 dark:text-white">Host (Server)</h3>
                                   <p className="text-xs text-slate-500">Upload trực tiếp lên Host miễn phí.</p>
                               </div>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                               <input 
                                   type="checkbox" 
                                   className="sr-only peer"
                                   checked={localUploadSettings.allowServer}
                                   onChange={(e) => setLocalUploadSettings(prev => ({...prev, allowServer: e.target.checked}))}
                               />
                               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                           </label>
                       </div>

                       <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                           <div className="flex items-center gap-3">
                               <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                   <Cloud size={20} />
                               </div>
                               <div>
                                   <h3 className="font-bold text-slate-900 dark:text-white">Google Drive</h3>
                                   <p className="text-xs text-slate-500">Upload qua Google Apps Script.</p>
                               </div>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                               <input 
                                   type="checkbox" 
                                   className="sr-only peer"
                                   checked={localUploadSettings.allowDrive}
                                   onChange={(e) => setLocalUploadSettings(prev => ({...prev, allowDrive: e.target.checked}))}
                               />
                               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                           </label>
                       </div>

                       <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                           <div className="flex items-center gap-3">
                               <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                   <Palette size={20} />
                               </div>
                               <div>
                                   <h3 className="font-bold text-slate-900 dark:text-white">Link / Canva</h3>
                                   <p className="text-xs text-slate-500">Dán link ảnh từ nguồn ngoài.</p>
                               </div>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                               <input 
                                   type="checkbox" 
                                   className="sr-only peer"
                                   checked={localUploadSettings.allowCanva}
                                   onChange={(e) => setLocalUploadSettings(prev => ({...prev, allowCanva: e.target.checked}))}
                               />
                               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                           </label>
                       </div>

                       <div className="pt-4 flex justify-end">
                           <button 
                               onClick={handleSaveUploadSettings}
                               disabled={loading}
                               className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                           >
                               {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                               Lưu Cài Đặt
                           </button>
                       </div>
                   </div>
               </div>
          )}

       </div>
    </div>
  );
};

export default Admin;
