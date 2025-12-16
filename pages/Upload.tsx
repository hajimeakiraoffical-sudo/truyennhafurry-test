
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload as UploadIcon, BookOpen, Layers, Lock, AlertTriangle, Server, Cloud, Info, CheckCircle, Image as ImageIcon, Download, Link as LinkIcon, Palette, Tag, Trash2, FolderOpen, HelpCircle } from 'lucide-react';
import { useStories } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { Story, Chapter } from '../types';

const Upload: React.FC = () => {
  const { stories, refreshStories, deleteStory, uploadSettings, genres: availableGenres } = useStories();
  const { user, isTranslator } = useAuth();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<'new' | 'update'>('new');

  // Storage Settings: 'server' | 'drive' | 'canva' | 'drive_folder'
  const [storageType, setStorageType] = useState<string>('server');
  
  // Google Apps Script URL (Updated)
  const scriptUrl = "https://script.google.com/macros/s/AKfycbzKjg6liYMg9T3DMyxXQzoBZBZZeBsclssnSjGw1ZTTrT1QcyVhu4yUCyLCuRsbIOjY0g/exec";

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genres, setGenres] = useState('');
  const [desc, setDesc] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  
  // Cover State
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [canvaCoverUrl, setCanvaCoverUrl] = useState(''); // For Canva & Drive Link modes
  
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [storyStatus, setStoryStatus] = useState<Story['status']>('Đang tiến hành');

  // Chapter Content State
  const [chapterFiles, setChapterFiles] = useState<FileList | null>(null);
  const [canvaChapterUrls, setCanvaChapterUrls] = useState(''); // For Canva/Drive Link mode (textarea)

  const [chapterOrder, setChapterOrder] = useState<number>(1);
  const [chapterTitle, setChapterTitle] = useState('Chapter 1');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Manual Save Fallback State
  const [showManualSave, setShowManualSave] = useState(false);
  const [manualJsonContent, setManualJsonContent] = useState('');

  // Effect to validate storageType when settings change
  useEffect(() => {
      // Default fallback logic
      if (!storageType) {
          if (uploadSettings.allowServer) setStorageType('server');
          else if (uploadSettings.allowDrive) setStorageType('drive');
          else if (uploadSettings.allowDriveFolder) setStorageType('drive_folder');
          else if (uploadSettings.allowCanva) setStorageType('canva');
      }
  }, [uploadSettings, storageType]);

  // Auto-fill update mode
  useEffect(() => {
    if (mode === 'update' && selectedStoryId) {
        const story = stories.find(s => s.id === selectedStoryId);
        if (story) {
            const nextOrder = story.chapters.length + 1;
            setChapterOrder(nextOrder);
            setChapterTitle(`Chapter ${nextOrder}`);
            setStoryStatus(story.status);
        }
    }
  }, [selectedStoryId, mode, stories]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value) || 0;
      setChapterOrder(val);
      setChapterTitle(`Chapter ${val}`);
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleChapterPagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setChapterFiles(e.target.files);
    }
  };

  const toggleGenre = (genre: string) => {
    let currentGenres = genres.split(',').map(g => g.trim()).filter(g => g !== '');
    if (currentGenres.includes(genre)) {
        currentGenres = currentGenres.filter(g => g !== genre);
    } else {
        currentGenres.push(genre);
    }
    setGenres(currentGenres.join(', '));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); 
        };
        reader.onerror = error => reject(error);
    });
  };

  // Helper: Convert Google Drive View Links to Direct Image Links
  const convertDriveLink = (url: string) => {
      const driveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
      const match = url.match(driveRegex);
      if (match && match[1]) {
          return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
      return url;
  };

  const handleDeleteStory = async () => {
      if (!selectedStoryId) {
          alert("Vui lòng chọn truyện cần xóa!");
          return;
      }
      
      const storyToDelete = stories.find(s => s.id === selectedStoryId);
      if (!storyToDelete) return;

      const isOwner = user && (user.id === storyToDelete.uploaderId || user.name === storyToDelete.translator || user.role === 'admin');

      if (!isOwner) {
          alert("Bạn không có quyền xóa truyện này! Chỉ người đăng mới có thể xóa.");
          return;
      }

      const confirmMsg = `CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn truyện "${storyToDelete.title}"?\n\nHành động này không thể hoàn tác!`;
      if (!window.confirm(confirmMsg)) return;

      setIsSubmitting(true);
      setUploadStatus('Đang xóa truyện...');

      try {
          const success = await deleteStory(selectedStoryId);
          if (success) {
              alert("Đã xóa truyện thành công!");
              await refreshStories();
              setSelectedStoryId(''); 
              setMode('new'); 
          } else {
              throw new Error("Không thể xóa truyện trên server.");
          }
      } catch (e: any) {
          alert("Lỗi xóa truyện: " + e.message);
      } finally {
          setIsSubmitting(false);
          setUploadStatus('');
      }
  };

  // --- UPLOAD HANDLERS ---

  // 1. Upload to PHP (InfinityFree)
  const uploadFileToPHP = async (file: File, path: string): Promise<string> => {
      const formData = new FormData();
      formData.append('action', 'upload_image');
      formData.append('file', file);
      formData.append('path', path);

      try {
          const res = await fetch('/api.php', {
              method: 'POST',
              body: formData
          });
          
          if (res.status === 404) throw new Error("Không tìm thấy file api.php trên server. Hãy kiểm tra folder 'dist' đã có 'api.php' chưa.");
          if (!res.ok) throw new Error("Lỗi Server: " + res.status + " " + res.statusText);
          
          const text = await res.text();
          try {
              const data = JSON.parse(text);
              if (!data.success) throw new Error(data.message);
              return data.url; 
          } catch (jsonErr) {
              // If response is not JSON, it might be an InfinityFree HTML error page
              console.error("Server Response:", text);
              throw new Error("Server trả về lỗi không xác định (HTML). Xem console để biết chi tiết.");
          }
      } catch (err: any) {
          throw err; // Re-throw to be caught in handleSubmit
      }
  };

  // 2. Upload to Google Apps Script
  const uploadFileToScript = async (file: File, folderName: string): Promise<string> => {
      if (!scriptUrl) throw new Error("Chưa cấu hình Script URL");

      const base64Data = await fileToBase64(file);
      
      const payload = {
          base64: base64Data,
          mimeType: file.type,
          filename: file.name,
          folderName: folderName 
      };

      try {
        const res = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        if (res.status === 404) throw new Error("Script URL không tồn tại (404 Not Found)");
        if (!res.ok) throw new Error(`Lỗi kết nối Google Drive (${res.status})`);
        
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Lỗi tải lên GAS");
        
        let directUrl = data.url;
        const idMatch = directUrl.match(/[\w-]{25,}/); 
        if (idMatch) {
             directUrl = `https://lh3.googleusercontent.com/d/${idMatch[0]}`;
        }
        
        return directUrl;
      } catch (e: any) {
         console.error("GAS Error:", e);
         throw new Error("Lỗi Google Drive: " + e.message);
      }
  };

  const handleManualDownload = () => {
      if (!manualJsonContent) return;
      const blob = new Blob([manualJsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "stories.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert("Đã tải file stories.json! Vui lòng upload file này lên thư mục gốc của Host (InfinityFree).");
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!storageType) {
          alert("Hệ thống đang bảo trì tính năng upload!");
          return;
      }

      if (storageType === 'drive' && !scriptUrl) {
          alert("Lỗi cấu hình: Thiếu Script URL!");
          return;
      }

      const isLinkMode = storageType === 'canva' || storageType === 'drive_folder';

      // --- VALIDATION ---
      if (mode === 'new') {
          if (!title) {
              alert("Vui lòng nhập tên truyện!");
              return;
          }
          if (!isLinkMode && !coverFile) {
              alert("Vui lòng chọn ảnh bìa!");
              return;
          }
          if (isLinkMode && !canvaCoverUrl.trim()) {
              alert("Vui lòng nhập link ảnh bìa!");
              return;
          }
      } else {
          if (!selectedStoryId) {
              alert("Vui lòng chọn truyện cần thêm chapter!");
              return;
          }
      }

      // Validate Chapter Content
      if (isLinkMode) {
          if (!canvaChapterUrls.trim()) {
              alert("Vui lòng nhập danh sách link ảnh chapter!");
              return;
          }
      } else {
          if (!chapterFiles || chapterFiles.length === 0) {
              alert("Vui lòng chọn file ảnh chapter!");
              return;
          }
      }

      setIsSubmitting(true);
      setShowManualSave(false);
      setUploadStatus('Đang khởi tạo...');

      try {
        const timestamp = Date.now();
        const storyId = mode === 'new' ? 's_' + timestamp : selectedStoryId;
        const chapterId = 'c_' + timestamp;
        
        let coverUrl = '';
        
        let targetFolderName = "Uncategorized";
        if (mode === 'new') {
            targetFolderName = title.trim();
        } else {
            const existingStory = stories.find(s => s.id === selectedStoryId);
            if (existingStory) {
                targetFolderName = existingStory.title.trim();
            }
        }
        targetFolderName = targetFolderName.replace(/[/\\]/g, "-");

        // --- 1. PROCESS COVER ---
        if (mode === 'new') {
            if (isLinkMode) {
                // Auto convert cover link if it's drive
                coverUrl = convertDriveLink(canvaCoverUrl.trim());
            } else if (coverFile) {
                setUploadStatus('Đang tải lên ảnh bìa...');
                if (storageType === 'server') {
                    const coverExt = coverFile.name.split('.').pop();
                    const coverPath = `uploads/${storyId}/cover.${coverExt}`;
                    coverUrl = await uploadFileToPHP(coverFile, coverPath);
                } else {
                    coverUrl = await uploadFileToScript(coverFile, targetFolderName);
                }
            }
        } else if (mode === 'update') {
            const existingStory = stories.find(s => s.id === selectedStoryId);
            if (existingStory) coverUrl = existingStory.coverUrl;
        }

        // --- 2. PROCESS CHAPTER IMAGES ---
        let imageUrls: string[] = [];
        
        if (isLinkMode) {
            imageUrls = canvaChapterUrls.split('\n')
                .map(url => url.trim())
                .filter(url => url !== '')
                .map(url => convertDriveLink(url)); // Apply conversion logic for Drive links
            
            if (imageUrls.length === 0) throw new Error("Không tìm thấy link ảnh hợp lệ.");
        } else {
            if (chapterFiles) {
                for (let i = 0; i < chapterFiles.length; i++) {
                    setUploadStatus(`Đang tải ảnh ${i + 1}/${chapterFiles.length} lên ${storageType === 'drive' ? 'Google Drive' : 'Host'}...`);
                    const file = chapterFiles[i];
                    
                    let uploadedUrl = '';
                    let retries = 3;
                    while (retries > 0) {
                        try {
                            if (storageType === 'server') {
                                const ext = file.name.split('.').pop();
                                const fileName = `ch${chapterOrder}_page_${(i+1).toString().padStart(3, '0')}.${ext}`;
                                const path = `uploads/${storyId}/${chapterId}/${fileName}`;
                                uploadedUrl = await uploadFileToPHP(file, path);
                            } else {
                                uploadedUrl = await uploadFileToScript(file, targetFolderName);
                            }
                            
                            if(uploadedUrl) break;
                            else throw new Error("Empty URL returned");
                        } catch (err) {
                            retries--;
                            if (retries === 0) throw err;
                            await new Promise(r => setTimeout(r, 2000));
                        }
                    }
                    imageUrls.push(uploadedUrl);
                }
            }
        }

        setUploadStatus('Đang lưu dữ liệu truyện vào Host...');
        
        // --- 3. CREATE DATA OBJECT ---
        const newChapter: Chapter = {
            id: chapterId,
            storyId: storyId, 
            order: chapterOrder,
            title: chapterTitle || `Chapter ${chapterOrder}`,
            images: imageUrls, 
            publishedAt: new Date().toLocaleDateString('vi-VN')
        };

        let updatedStories = [...stories];
        if (mode === 'new') {
            const finalUploaderName = uploaderName.trim() || user?.name || 'Ẩn danh';
            const newStory: Story = {
                id: storyId,
                title: title,
                originalAuthor: author || 'Unknown',
                translator: finalUploaderName,
                uploader: finalUploaderName,
                uploaderId: user?.id || 'admin',
                uploaderBadge: user?.role === 'translator' ? 'Dịch Giả' : 'Admin',
                coverUrl: coverUrl,
                description: desc,
                genres: genres.split(',').map(g => g.trim()).filter(g => g !== ''),
                status: storyStatus, 
                chapters: [newChapter],
                publishedTimeRelative: 'Vừa xong',
                lastUpdated: new Date().toISOString(),
                stats: { views: 0, rating: 0, likes: 0, comments: 0 }
            };
            updatedStories.unshift(newStory);
        } else {
            const index = updatedStories.findIndex(s => s.id === selectedStoryId);
            if (index !== -1) {
                const storyToUpdate = { ...updatedStories[index] };
                storyToUpdate.chapters = [...storyToUpdate.chapters, newChapter];
                storyToUpdate.lastUpdated = new Date().toISOString();
                storyToUpdate.publishedTimeRelative = 'Vừa cập nhật';
                storyToUpdate.status = storyStatus;
                updatedStories.splice(index, 1);
                updatedStories.unshift(storyToUpdate);
            }
        }
        
        const jsonContent = JSON.stringify(updatedStories, null, 2);
        setManualJsonContent(jsonContent);

        // --- 4. SAVE JSON METADATA (STRICTLY TO SERVER) ---
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const formData = new FormData();
            formData.append('action', 'save_data');
            formData.append('type', 'stories');
            formData.append('content', jsonContent);
            
            const saveRes = await fetch('/api.php', { 
                method: 'POST', 
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (saveRes.status === 404) {
                 throw new Error("Không tìm thấy file api.php trên Host. Vui lòng kiểm tra xem bạn đã upload file api.php chưa.");
            }
            
            if (!saveRes.ok) throw new Error("Lỗi Server (HTTP " + saveRes.status + ")");
            
            const text = await saveRes.text();
            try { 
                const saveData = JSON.parse(text); 
                if (!saveData.success) throw new Error(saveData.message);
            } catch(e) { 
                console.warn("Server trả về không phải JSON:", text);
                throw new Error("Server phản hồi không đúng định dạng JSON. Có thể do lỗi PHP.");
            }

        } catch (serverErr: any) {
             console.error("Server save failed", serverErr);
             throw new Error("Lỗi lưu dữ liệu: " + serverErr.message);
        }

        setUploadStatus('Hoàn tất!');
        alert("Đăng truyện thành công!");
        await refreshStories(); 
        navigate('/');

      } catch (error: any) {
        console.error("Upload Error:", error);
        setUploadStatus('Lỗi: ' + error.message);
        setShowManualSave(true);
        setIsSubmitting(false);
      } 
  }

  if (!isTranslator) {
     return (
        <div className="min-h-screen flex items-center justify-center px-4 transition-colors">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md text-center border border-slate-100 dark:border-slate-700">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-6">
                    <Lock size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Quyền Truy Cập Bị Từ Chối</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Tính năng này chỉ dành cho tài khoản Dịch Giả.
                </p>
                <Link to="/" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700">Trang Chủ</Link>
            </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen py-6 md:py-12 pb-24 md:pb-12 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="text-green-500" />
                Đăng Truyện
            </h1>
            <p className="text-slate-500 text-sm mt-2 flex items-center gap-1">
                <Info size={14} /> Chào mừng dịch giả {user?.name}.
            </p>
        </div>

        {/* Configuration Panel */}
        <div className="mb-8 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            
            {/* Storage Type (Images) */}
            <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
                    <ImageIcon size={16} /> Phương thức upload
                </h3>
                
                {/* Method Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {uploadSettings.allowServer && (
                        <button 
                            onClick={() => setStorageType('server')}
                            className={`py-2 px-2 rounded-lg text-xs md:text-sm font-bold border transition-colors flex items-center justify-center gap-1 md:gap-2 ${storageType === 'server' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                        >
                            <Server size={14} /> Host (Free)
                        </button>
                    )}
                    {uploadSettings.allowDrive && (
                        <button 
                            onClick={() => setStorageType('drive')}
                            className={`py-2 px-2 rounded-lg text-xs md:text-sm font-bold border transition-colors flex items-center justify-center gap-1 md:gap-2 ${storageType === 'drive' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                        >
                            <Cloud size={14} /> Drive (Script)
                        </button>
                    )}
                    {uploadSettings.allowDriveFolder && (
                         <button 
                            onClick={() => setStorageType('drive_folder')}
                            className={`py-2 px-2 rounded-lg text-xs md:text-sm font-bold border transition-colors flex items-center justify-center gap-1 md:gap-2 ${storageType === 'drive_folder' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                        >
                            <FolderOpen size={14} /> Drive (Link)
                        </button>
                    )}
                    {uploadSettings.allowCanva && (
                        <button 
                            onClick={() => setStorageType('canva')}
                            className={`py-2 px-2 rounded-lg text-xs md:text-sm font-bold border transition-colors flex items-center justify-center gap-1 md:gap-2 ${storageType === 'canva' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                        >
                            <Palette size={14} /> Canva/Link
                        </button>
                    )}
                </div>
            </div>
            
            {/* Storage Info Messages */}
             {storageType === 'drive_folder' && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex flex-col gap-2 animate-in fade-in zoom-in-95">
                    <div className="flex items-start gap-2">
                        <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                            LƯU Ý QUAN TRỌNG:
                        </span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 ml-6 space-y-1">
                        <li>Google Drive không cho phép lấy link trực tiếp từ thư mục (Folder).</li>
                        <li>Bạn hãy vào thư mục, <b>chọn tất cả ảnh</b> (Ctrl+A).</li>
                        <li>Chuột phải chọn <b>Share (Chia sẻ)</b> {'>'} <b>Copy Link (Sao chép liên kết)</b>.</li>
                        <li>Dán danh sách link đó vào khung bên dưới. Hệ thống sẽ tự xử lý.</li>
                    </ul>
                </div>
            )}
        </div>

        {/* Mode Selection */}
        <div className="flex gap-4 mb-6">
            <button
                onClick={() => { setMode('new'); setStoryStatus('Đang tiến hành'); }}
                className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                    mode === 'new' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
            >
                <BookOpen size={20} />
                Đăng Truyện Mới
            </button>
            <button
                onClick={() => setMode('update')}
                className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                    mode === 'update' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
            >
                <Layers size={20} />
                Thêm Chapter / Quản Lý
            </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-8 space-y-6">
            
            {/* NEW STORY FORM */}
            {mode === 'new' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên truyện <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trạng thái</label>
                        <select 
                            value={storyStatus} 
                            onChange={(e) => setStoryStatus(e.target.value as any)} 
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white"
                        >
                            <option value="Đang tiến hành">Đang tiến hành</option>
                            <option value="Đã hoàn thành">Đã hoàn thành</option>
                            <option value="Tạm ngưng">Tạm ngưng</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tác giả gốc</label>
                            <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white" value={author} onChange={(e) => setAuthor(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Người đăng</label>
                            <input type="text" value={uploaderName} onChange={(e) => setUploaderName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white" placeholder={`Mặc định: ${user?.name}`} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Thể loại</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                           {availableGenres.map(g => {
                               const isActive = genres.split(',').map(s => s.trim()).includes(g);
                               return (
                                  <button
                                    type="button"
                                    key={g}
                                    onClick={() => toggleGenre(g)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                       isActive
                                       ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                       : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                  >
                                    <Tag size={12} />
                                    {g}
                                  </button>
                               );
                           })}
                        </div>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white" 
                            placeholder="Nhập thêm thể loại khác, cách nhau bằng dấu phẩy..."
                            value={genres} 
                            onChange={(e) => setGenres(e.target.value)} 
                        />
                        <p className="text-xs text-slate-400 mt-2">Đã chọn: {genres || "(Chưa chọn)"}</p>
                    </div>
                    
                    {/* Cover Input: Depends on Storage Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ảnh bìa <span className="text-red-500">*</span></label>
                        
                        {storageType === 'canva' || storageType === 'drive_folder' ? (
                             <div className="flex gap-2 items-center">
                                <input 
                                    type="text" 
                                    className="flex-grow px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white"
                                    placeholder={storageType === 'drive_folder' ? "Dán link ảnh bìa Drive (View link đều được)" : "Dán link ảnh bìa vào đây (https://...)"}
                                    value={canvaCoverUrl}
                                    onChange={(e) => {
                                        setCanvaCoverUrl(e.target.value);
                                        setCoverPreview(storageType === 'drive_folder' ? convertDriveLink(e.target.value) : e.target.value);
                                    }}
                                />
                                {coverPreview && <img src={coverPreview} alt="Preview" className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0 bg-slate-200" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />}
                             </div>
                        ) : (
                             <div className="flex gap-4 items-center">
                                <label className={`cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium flex items-center gap-2 ${!storageType ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <ImageIcon size={18} /> Chọn Ảnh
                                    <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" disabled={!storageType} />
                                </label>
                                {coverPreview && <img src={coverPreview} alt="Preview" className="w-12 h-16 object-cover rounded shadow-sm" />}
                            </div>
                        )}
                        {storageType === 'drive_folder' && (
                             <p className="text-xs text-slate-400 mt-1">Hệ thống sẽ tự động chuyển đổi link Drive "View" sang link trực tiếp.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mô tả</label>
                        <textarea rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white" value={desc} onChange={(e) => setDesc(e.target.value)}></textarea>
                    </div>
                </div>
            )}

            {/* UPDATE STORY FORM */}
            {mode === 'update' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chọn truyện <span className="text-red-500">*</span></label>
                        <select value={selectedStoryId} onChange={(e) => setSelectedStoryId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white">
                            <option value="">-- Chọn truyện --</option>
                            {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                        </select>
                    </div>
                    
                    {/* NÚT XÓA TRUYỆN */}
                    {selectedStoryId && (() => {
                        const s = stories.find(st => st.id === selectedStoryId);
                        const isOwner = user && s && (user.id === s.uploaderId || user.name === s.translator || user.role === 'admin');
                        return isOwner ? (
                            <div className="flex justify-end">
                                <button 
                                    type="button" 
                                    onClick={handleDeleteStory}
                                    className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-sm font-bold flex items-center gap-2 border border-red-200 dark:border-red-900/50"
                                >
                                    <Trash2 size={16} /> Xóa Truyện Này
                                </button>
                            </div>
                        ) : null;
                    })()}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trạng thái</label>
                        <select value={storyStatus} onChange={(e) => setStoryStatus(e.target.value as any)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white">
                            <option value="Đang tiến hành">Đang tiến hành</option>
                            <option value="Đã hoàn thành">Đã hoàn thành</option>
                            <option value="Tạm ngưng">Tạm ngưng</option>
                        </select>
                    </div>
                </div>
            )}

            {/* CHAPTER CONTENT */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Nội Dung Chapter</h3>
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Thứ tự</label>
                        <input type="number" min="1" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white text-center" value={chapterOrder} onChange={handleOrderChange} />
                    </div>
                    <div className="col-span-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên Chapter</label>
                        <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {storageType === 'canva' || storageType === 'drive_folder' ? 'Danh sách link ảnh (Mỗi dòng 1 link)' : 'Trang truyện'} <span className="text-red-500">*</span>
                    </label>
                    
                    {storageType === 'canva' || storageType === 'drive_folder' ? (
                        <>
                            <textarea 
                                rows={8}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white font-mono text-sm"
                                placeholder={storageType === 'drive_folder' 
                                    ? "https://drive.google.com/file/d/1...\nhttps://drive.google.com/file/d/2...\n(Paste toàn bộ link ảnh bạn đã copy vào đây)" 
                                    : "https://my-canva-image-1.jpg\nhttps://my-canva-image-2.jpg\n..."}
                                value={canvaChapterUrls}
                                onChange={(e) => setCanvaChapterUrls(e.target.value)}
                            />
                            {storageType === 'drive_folder' && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center gap-1">
                                    <HelpCircle size={12} /> Hướng dẫn: Vào thư mục Drive {'>'} Chọn tất cả ảnh (Ctrl+A) {'>'} Chuột phải {'>'} Share {'>'} Copy Link.
                                </p>
                            )}
                        </>
                    ) : (
                        <div className={`relative group p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 ${!storageType ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input type="file" multiple accept="image/*" onChange={handleChapterPagesChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={!storageType} />
                            {chapterFiles && chapterFiles.length > 0 ? (
                                <><CheckCircle size={32} className="mb-2 text-green-500" /><p>Đã chọn {chapterFiles.length} trang</p></>
                            ) : (
                                <><UploadIcon size={32} className="mb-2" /><p>{storageType ? 'Chạm để chọn ảnh' : 'Vui lòng chọn nơi lưu ảnh trước'}</p></>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MANUAL SAVE FALLBACK UI */}
            {showManualSave && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold text-yellow-800 dark:text-yellow-200">Không thể lưu tự động</h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 mb-3">
                                {uploadStatus}
                                <br/>Hệ thống đã chuẩn bị file dữ liệu dự phòng.
                            </p>
                            
                            <div className="flex flex-col gap-2">
                                <button 
                                    type="button"
                                    onClick={handleManualDownload}
                                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 w-fit"
                                >
                                    <Download size={16} /> Tải xuống stories.json
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col items-end gap-3 pt-2">
                {isSubmitting && <span className="text-sm text-indigo-500 font-medium animate-pulse">{uploadStatus}</span>}
                <button type="submit" disabled={isSubmitting || showManualSave} className="px-6 py-2 rounded-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                    {isSubmitting ? 'Đang Xử Lý...' : (mode === 'new' ? 'Đăng Truyện' : 'Đăng Chapter')}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;
