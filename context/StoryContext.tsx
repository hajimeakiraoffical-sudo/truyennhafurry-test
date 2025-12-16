
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Story, Announcement, Comment, UploadSettings } from '../types';

interface StoryContextType {
  stories: Story[];
  announcement: Announcement | null;
  guideContent: string;
  uploadSettings: UploadSettings;
  genres: string[];
  loading: boolean;
  refreshStories: () => Promise<void>;
  deleteStory: (storyId: string) => Promise<boolean>;
  toggleStoryVisibility: (storyId: string) => Promise<boolean>;
  updateGuide: (content: string) => Promise<boolean>;
  updateUploadSettings: (settings: UploadSettings) => Promise<boolean>;
  updateGenres: (newGenres: string[]) => Promise<boolean>;
  getRawStories: () => Promise<Story[]>;
  incrementView: (storyId: string) => Promise<void>;
  getComments: (storyId: string) => Promise<Comment[]>;
  addComment: (comment: Comment) => Promise<boolean>;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

// Default genres fallback
const DEFAULT_GENRES = [
  "Furry", "Bara", "Chubby", "Muscle", "Yaoi", 
  "BDSM", "Cute", "SFW", "NSFW"
];

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [guideContent, setGuideContent] = useState<string>('');
  const [uploadSettings, setUploadSettings] = useState<UploadSettings>({
      allowServer: true,
      allowDrive: true,
      allowCanva: true,
      allowDriveFolder: true
  });
  const [genres, setGenres] = useState<string[]>(DEFAULT_GENRES);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    setLoading(true);
    try {
      // 1. Tải Stories
      try {
          const res = await fetch('/stories.json?t=' + Date.now());
          if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                  setStories(data);
              }
          } else {
             setStories([]); 
          }
      } catch (e) {
          console.warn("Fetch stories failed", e);
      }

      // 2. Tải Announcement
      try {
          const announceRes = await fetch('/announcement.json?t=' + Date.now());
          if (announceRes.ok) {
              const annData = await announceRes.json();
              setAnnouncement(annData);
          }
      } catch (e) {}

      // 3. Tải Guide Content
      try {
        const guideRes = await fetch('/guide.json?t=' + Date.now());
        if (guideRes.ok) {
            const guideData = await guideRes.json();
            setGuideContent(guideData.content || '');
        }
      } catch (e) {}

      // 4. Tải Upload Settings
      try {
        const settingsRes = await fetch('/upload_settings.json?t=' + Date.now());
        if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setUploadSettings(prev => ({ ...prev, ...settingsData }));
        }
      } catch (e) {}

      // 5. Tải Genres
      try {
        const genresRes = await fetch('/genres.json?t=' + Date.now());
        if (genresRes.ok) {
            const genresData = await genresRes.json();
            if (Array.isArray(genresData) && genresData.length > 0) {
                setGenres(genresData);
            }
        }
      } catch (e) {}

    } finally {
      setLoading(false);
    }
  };

  const getRawStories = async (): Promise<Story[]> => {
      try {
          const res = await fetch('/stories.json?t=' + Date.now());
          if (res.ok) return await res.json();
      } catch (e) {}
      return [];
  };

  const deleteStory = async (storyId: string) => {
    try {
        const currentStories = await getRawStories();
        const updatedStories = currentStories.filter(s => s.id !== storyId);
        
        const formData = new FormData();
        formData.append('action', 'save_data');
        formData.append('type', 'stories');
        formData.append('content', JSON.stringify(updatedStories, null, 2));

        const res = await fetch('/api.php', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            setStories(updatedStories);
            return true;
        }
        return false;
    } catch (e) {
        console.error("Failed to delete story", e);
        return false;
    }
  };

  const toggleStoryVisibility = async (storyId: string) => {
    try {
        const currentStories = await getRawStories();
        const updatedStories = currentStories.map(s => {
            if (s.id === storyId) {
                return { ...s, isHidden: !s.isHidden };
            }
            return s;
        });

        const formData = new FormData();
        formData.append('action', 'save_data');
        formData.append('type', 'stories');
        formData.append('content', JSON.stringify(updatedStories, null, 2));

        const res = await fetch('/api.php', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            setStories(updatedStories);
            return true;
        }
        return false;
    } catch (e) {
        console.error("Failed to toggle visibility", e);
        return false;
    }
  };

  const updateGuide = async (content: string) => {
      try {
          const payload = { content: content, updatedAt: new Date().toISOString() };
          const formData = new FormData();
          formData.append('action', 'save_data');
          formData.append('type', 'guide');
          formData.append('content', JSON.stringify(payload, null, 2));

          const res = await fetch('/api.php', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
              setGuideContent(content);
              return true;
          }
          return false;
      } catch (e) {
          return false;
      }
  };

  const updateUploadSettings = async (settings: UploadSettings) => {
      try {
          const formData = new FormData();
          formData.append('action', 'save_data');
          formData.append('type', 'upload_settings');
          formData.append('content', JSON.stringify(settings, null, 2));

          const res = await fetch('/api.php', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
              setUploadSettings(settings);
              return true;
          }
          return false;
      } catch (e) {
          return false;
      }
  };

  const updateGenres = async (newGenres: string[]) => {
      try {
          const formData = new FormData();
          formData.append('action', 'save_data');
          formData.append('type', 'genres');
          formData.append('content', JSON.stringify(newGenres, null, 2));

          const res = await fetch('/api.php', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
              setGenres(newGenres);
              return true;
          }
          return false;
      } catch (e) {
          return false;
      }
  };

  const incrementView = async (storyId: string) => {
      try {
          const formData = new FormData();
          formData.append('action', 'increment_view');
          formData.append('id', storyId);
          await fetch('/api.php', { method: 'POST', body: formData });
      } catch (e) {}
  };

  const getComments = async (storyId: string): Promise<Comment[]> => {
      try {
          const res = await fetch('/api.php?action=get_comments&t=' + Date.now());
          if (res.ok) {
              const json = await res.json();
              if (json.success && Array.isArray(json.data)) {
                  return json.data.filter((c: Comment) => c.storyId === storyId);
              }
          }
      } catch (e) {}
      return [];
  };

  const addComment = async (comment: Comment): Promise<boolean> => {
      try {
          const formData = new FormData();
          formData.append('action', 'add_comment');
          formData.append('comment', JSON.stringify(comment));
          
          const res = await fetch('/api.php', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
              return true;
          }
      } catch (e) {}
      return false;
  };

  useEffect(() => {
    fetchStories();
  }, []);

  return (
    <StoryContext.Provider value={{ 
        stories, announcement, guideContent, uploadSettings, genres, loading, 
        refreshStories: fetchStories, deleteStory, toggleStoryVisibility, updateGuide, updateUploadSettings, updateGenres, getRawStories,
        incrementView, getComments, addComment
    }}>
      {children}
    </StoryContext.Provider>
  );
};

export const useStories = () => {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error('useStories must be used within a StoryProvider');
  }
  return context;
};
