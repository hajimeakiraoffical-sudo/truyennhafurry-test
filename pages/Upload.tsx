
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload as UploadIcon, BookOpen, Layers, Lock, AlertTriangle, Server, Cloud, Info, CheckCircle, Image as ImageIcon, Download, Link as LinkIcon, Palette, Tag, Trash2 } from 'lucide-react';
import { useStories } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { Story, Chapter } from '../types';

const Upload: React.FC = () => {
  const { stories, refreshStories, deleteStory, uploadSettings, genres: availableGenres } = useStories();
  const { user, isTranslator } = useAuth();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<'new' | 'update'>('new');

  // Storage Settings: 'server' | 'drive' | 'canva' or '' if none allowed
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
  const [canvaCoverUrl, setCanvaCoverUrl] = useState(''); // For Canva mode
  
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [storyStatus, setStoryStatus] = useState<Story['status']>('Đang tiến hành');

  // Chapter Content State
  const [chapterFiles, setChapterFiles] = useState<FileList | null>(null);
  const [canvaChapterUrls, setCanvaChapterUrls] = useState(''); // For Canva mode (textarea)

  const [chapterOrder, setChapterOrder] = useState<number>(1);
  const [chapterTitle, setChapterTitle] = useState('Chapter 1');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Manual Save Fallback State
  const [showManualSave, setShowManualSave] = useState(false);
  const [manualJsonContent, setManualJsonContent] = useState('');

  // Effect to validate storageType when settings change
  useEffect(() => {
      // Priority: Server -> Drive -> Canva
      if (uploadSettings.allowServer) {
          if (!storageType || (storageType !== 'server' && !uploadSettings.allowDrive && !uploadSettings.allowCanva)) {
               setStorageType('server');
          }
      } else if (uploadSettings.allowDrive) {
           if (storageType === 'server' || !storageType) setStorageType('drive');
      } else if (uploadSettings.allowCanva) {
           if (storageType === 'server' || storageType === 'drive' || !storageType) setStorageType('canva');
      } else {
           setStorageType(''); // No method allowed
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

  // Hàm xử lý chọn/bỏ chọn thể loại
  const toggleGenre = (genre: string) => {
    let currentGenres = genres.split(',').map(g => g.trim()).filter(g => g !== '');
    
    if (currentGenres.includes(genre)) {
        // Nếu đã có thì xóa đi
        currentGenres = currentGenres.filter(g => g !== genre);
    } else {
        // Nếu chưa có thì thêm vào
        currentGenres.push(genre);
    }
    setGenres(currentGenres.join(', '));
  };

  // Helper: Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the "data:image/jpeg;base64," part
            resolve(result.split(',')[1]); 
        };
        reader.onerror = error => reject(error);
    });
  };

  // Handler xóa truyện
  const handleDeleteStory = async () => {
      if (!selectedStoryId) {
          alert("Vui lòng chọn truyện cần xóa!");
          return;
      }
      
      const storyToDelete = stories.find(s => s.id === selectedStoryId);
      if (!storyToDelete) return;

      // KIỂM TRA QUYỀN: Chỉ chủ sở hữu (uploaderId hoặc translator) hoặc Admin mới được xóa
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
              setSelectedStoryId(''); // Reset selection
              setMode('new'); // Switch back to new
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

      const res = await fetch('/api.php', {
          method: 'POST',
          body: formData
      });
      
      if (res.status === 404) throw new Error("Không tìm thấy file api.php trên server");
      if (!res.ok) throw new Error("Lỗi Server: " + res.status);
      
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      return data.url; 
  };

  // 2. Upload to Google Apps Script
  const uploadFileToScript = async (file: File, folderName: string): Promise<string> => {
      if (!scriptUrl) throw new Error("Chưa cấu hình Script URL");

      const base64Data = await fileToBase64(file);
      
      const payload = {
          base64: base64Data,
          mimeType: file.type,
          filename: file.name,
          folderName: folderName // Tên folder con (Tên truyện)
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
        
        // FIX: Xử lý link ảnh Google Drive để hiển thị tốt hơn
        // Link gốc: https://drive.google.com/uc?export=view&id=XXX
        // Link mới: https://lh3.googleusercontent.com/d/XXX
        let directUrl = data.url;
        
        // Tìm ID trong URL (thường là chuỗi dài > 25 ký tự)
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

      // --- VALIDATION ---
      if (mode === 'new') {
          if (!title) {
              alert("Vui lòng nhập tên truyện!");
              return;
          }
          if (storageType !== 'canva' && !coverFile) {
              alert("Vui lòng chọn ảnh bìa!");
              return;
          }
          if (storageType === 'canva' && !canvaCoverUrl.trim()) {
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
      if (storageType === 'canva') {
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
        
        // XÁC ĐỊNH TÊN FOLDER CON CHO GOOGLE DRIVE
        // Nếu là truyện mới: Dùng Title người dùng nhập
        // Nếu là update: Tìm tên truyện từ ID đã chọn
        let targetFolderName = "Uncategorized";
        if (mode === 'new') {
            targetFolderName = title.trim();
        } else {
            const existingStory = stories.find(s => s.id === selectedStoryId);
            if (existingStory) {
                targetFolderName = existingStory.title.trim();
            }
        }
        
        // Loại bỏ các ký tự đặc biệt để tránh lỗi tên folder (tùy chọn, Drive khá thoải mái)
        targetFolderName = targetFolderName.replace(/[/\\]/g, "-");

        // --- 1. PROCESS COVER ---
        if (mode === 'new') {
            if (storageType === 'canva') {
                coverUrl = canvaCoverUrl.trim();
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
        
        if (storageType === 'canva') {
            // Process text area urls
            imageUrls = canvaChapterUrls.split('\n')
                .map(url => url.trim())
                .filter(url => url !== '');
            
            if (imageUrls.length === 0) throw new Error("Không tìm thấy link ảnh hợp lệ.");
        } else {
            // Process file uploads
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
                 throw new Error("Không tìm thấy file api.php trên Host. Vui lòng tải JSON và upload thủ công.");
            }
            
            if (!saveRes.ok) throw new Error("Server Error: " + saveRes.status);
            
            const text = await saveRes.text();
            try { 
                const saveData = JSON.parse(text); 
                if (!saveData.success) throw new Error(saveData.message);
            } catch(e) { 
                console.warn("Non-JSON response from server:", text);
            }

        } catch (serverErr: any) {
             console.error("Server save failed", serverErr);
             throw new Error("Lỗi lưu vào Host: " + serverErr.message);
        }

        setUploadStatus('Hoàn tất!');
        alert("Đăng truyện thành công! Ảnh đã được lưu vào folder truyện trên Drive.");
        await refreshStories(); 
        navigate('/');

      } catch (error: any) {
        console.error("Upload Error:", error);
        setUploadStatus('Lỗi: ' + error.message);
        
        // Show fallback UI
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
                    <ImageIcon size={16} /> Nơi lưu ảnh
                </h3>
                
                {/* Method Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                    {uploadSettings.allowServer && (
                        <button 
                            onClick={() => setStorageType('server')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${storageType === 'server' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                        >
                            <Server size={16} /> Host (Free)
                        </button>
                    )}
                    {uploadSettings.allowDrive && (
                        <button 
                            onClick={() => setStorageType('drive')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${storageType === 'drive' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                        >
                            <Cloud size={16} /> Google Drive
                        </button>
                    )}
                    {uploadSettings.allowCanva && (
                        <button 
                            onClick={() => setStorageType('canva')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${storageType === 'canva' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                        >
                            <Palette size={16} /> Canva / Link
                        </button>
                    )}
                    {!uploadSettings.allowServer && !uploadSettings.allowDrive && !uploadSettings.allowCanva && (
                         <div className="w-full text-center text-red-500 py-2 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm font-bold">
                             Hệ thống upload đang bảo trì. Vui lòng quay lại sau.
                         </div>
                    )}
                </div>
            </div>

            {storageType === 'drive' && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-800 dark:text-green-200 font-medium">
                        Ảnh sẽ được lưu vào thư mục <b>truyennhafurry / [Tên Truyện]</b> trên Drive.
                    </span>
                </div>
            )}
             {storageType === 'canva' && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <LinkIcon size={18} className="text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-purple-800 dark:text-purple-200 font-medium">
                        Chế độ nhập link trực tiếp. Bạn chỉ cần dán URL ảnh (từ Canva, Imgur, Facebook...).
                    </span>
                </div>
            )}
            {storageType === 'server' && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <Server size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm text-indigo-800 dark:text-indigo-200 font-medium">
                        Lưu trữ trực tiếp trên Host. Nhanh và ổn định cho ảnh nhẹ.
                    </span>
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
                        
                        {storageType === 'canva' ? (
                             <div className="flex gap-2 items-center">
                                <input 
                                    type="text" 
                                    className="flex-grow px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white"
                                    placeholder="Dán link ảnh bìa vào đây (https://...)"
                                    value={canvaCoverUrl}
                                    onChange={(e) => {
                                        setCanvaCoverUrl(e.target.value);
                                        setCoverPreview(e.target.value);
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
                    
                    {/* NÚT XÓA TRUYỆN (Chỉ hiển thị khi đã chọn truyện và là chủ sở hữu) */}
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
                        {storageType === 'canva' ? 'Link ảnh (Mỗi dòng 1 link)' : 'Trang truyện'} <span className="text-red-500">*</span>
                    </label>
                    
                    {storageType === 'canva' ? (
                        <textarea 
                            rows={8}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white font-mono text-sm"
                            placeholder="https://my-canva-image-1.jpg&#10;https://my-canva-image-2.jpg&#10;..."
                            value={canvaChapterUrls}
                            onChange={(e) => setCanvaChapterUrls(e.target.value)}
                        />
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
