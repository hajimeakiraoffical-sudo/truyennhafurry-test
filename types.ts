
export interface Chapter {
  id: string;
  storyId: string;
  order: number;
  title: string;
  images: string[]; // URL to images
  publishedAt: string;
}

export interface Story {
  id: string;
  title: string;
  originalAuthor: string;
  translator: string;
  uploader: string; // Name of the uploader for display
  uploaderId?: string;
  uploaderBadge?: string; // e.g., "DL", "Team", "Admin" - The nickname/badge shown before the name
  coverUrl: string;
  description: string;
  genres: string[];
  status: 'Đang tiến hành' | 'Đã hoàn thành' | 'Tạm ngưng';
  chapters: Chapter[];
  publishedTimeRelative: string; // e.g., "8 ngày trước"
  lastUpdated: string;
  isHidden?: boolean; // New: Admin can hide story
  stats: {
    views: number;
    rating: number;
    likes: number;
    comments: number;
  };
}

export interface Comment {
  id: string;
  storyId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export type Theme = 'light' | 'dark';

// New: Supported background themes
export type BackgroundTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'lavender';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'translator' | 'admin';
  avatar?: string;
  cover?: string; // Added back
  description?: string;
  isVerified?: boolean; // Translator verification status
  joinedAt?: string; // ISO Date string of join date
}

export interface Announcement {
  message: string;
  isShow: boolean;
  updatedAt: string;
}

export interface UploadSettings {
  allowServer: boolean;
  allowDrive: boolean;
  allowCanva: boolean;
}
