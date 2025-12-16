
// CẤU HÌNH GITHUB
// QUAN TRỌNG: Hãy điền chính xác USERNAME của bạn để đảm bảo hệ thống chạy ổn định 100%

export const GITHUB_CONFIG = {
  // Dán Token mới của bạn vào đây (Token cũ đã bị xóa)
  TOKEN: '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',

  // HÃY SỬA DÒNG NÀY: Điền tên tài khoản GitHub của bạn (Ví dụ: 'nguyenvana')
  // Nếu để 'auto-detect', hệ thống sẽ tự dò nhưng có thể bị lỗi mạng.
  USERNAME: 'auto-detect', 
  
  // Tên Repository chứa truyện
  REPO_NAME: 'truyen-nha-furry',
  
  // Nhánh chính (main hoặc master)
  BRANCH: 'main',

  // Đường dẫn file
  USERS_FILE_PATH: 'public/users.json',
  ANNOUNCEMENT_PATH: 'public/announcement.json'
};

export const getRawBaseUrl = (username: string) => {
    return `https://raw.githubusercontent.com/${username}/${GITHUB_CONFIG.REPO_NAME}/${GITHUB_CONFIG.BRANCH}`;
};
