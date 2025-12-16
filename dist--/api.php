<?php
// Cấu hình CORS để cho phép React gọi API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Xử lý preflight request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$action = isset($_POST['action']) ? $_POST['action'] : (isset($_GET['action']) ? $_GET['action'] : '');

// Thư mục gốc để lưu trữ
$baseDir = __DIR__;

// --- HÀM HỖ TRỢ ---
function sendResponse($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        '...data' => $data, // spread data if object, or put in key
        'url' => is_string($data) ? $data : null,
        'data' => is_array($data) ? $data : null
    ]);
    exit();
}

// --- XỬ LÝ UPLOAD ẢNH ---
if ($action === 'upload_image' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file']) || !isset($_POST['path'])) {
        sendResponse(false, 'Thiếu file hoặc đường dẫn lưu.');
    }

    $file = $_FILES['file'];
    $relativePath = $_POST['path']; // Ví dụ: uploads/story_1/cover.jpg
    
    // Bảo mật: Chỉ cho phép file ảnh
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
        sendResponse(false, 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP).');
    }

    $targetPath = $baseDir . '/' . $relativePath;
    $targetDir = dirname($targetPath);

    // Tạo thư mục nếu chưa có
    if (!is_dir($targetDir)) {
        if (!mkdir($targetDir, 0755, true)) {
            sendResponse(false, 'Không thể tạo thư mục lưu trữ.');
        }
    }

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Trả về URL tương đối để frontend hiển thị
        sendResponse(true, 'Upload thành công', $relativePath);
    } else {
        sendResponse(false, 'Lỗi khi di chuyển file.');
    }
}

// --- XỬ LÝ LƯU DỮ LIỆU (JSON) ---
if ($action === 'save_data' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $type = isset($_POST['type']) ? $_POST['type'] : '';
    $content = isset($_POST['content']) ? $_POST['content'] : '';

    if (empty($type) || empty($content)) {
        sendResponse(false, 'Dữ liệu không hợp lệ.');
    }

    $filename = '';
    switch ($type) {
        case 'stories': $filename = 'stories.json'; break;
        case 'users': $filename = 'users.json'; break;
        case 'announcement': $filename = 'announcement.json'; break;
        case 'guide': $filename = 'guide.json'; break;
        case 'upload_settings': $filename = 'upload_settings.json'; break;
        case 'genres': $filename = 'genres.json'; break;
        default: sendResponse(false, 'Loại dữ liệu không hỗ trợ.');
    }

    $filePath = $baseDir . '/' . $filename;

    // Ghi đè file JSON
    if (file_put_contents($filePath, $content)) {
        sendResponse(true, 'Đã lưu dữ liệu thành công.');
    } else {
        sendResponse(false, 'Không thể ghi file JSON. Kiểm tra quyền ghi (CHMOD 777).');
    }
}

// --- XỬ LÝ TĂNG VIEW ---
if ($action === 'increment_view' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? $_POST['id'] : '';
    if (!$id) sendResponse(false, 'Thiếu ID truyện.');

    $filePath = $baseDir . '/stories.json';
    if (!file_exists($filePath)) sendResponse(false, 'Chưa có dữ liệu truyện.');

    $json = file_get_contents($filePath);
    $stories = json_decode($json, true);

    if (!is_array($stories)) sendResponse(false, 'Lỗi định dạng JSON.');

    $found = false;
    foreach ($stories as &$story) {
        if ($story['id'] === $id) {
            if (!isset($story['stats'])) {
                $story['stats'] = ['views' => 0, 'rating' => 0, 'likes' => 0, 'comments' => 0];
            }
            $story['stats']['views']++;
            $found = true;
            break;
        }
    }

    if ($found) {
        file_put_contents($filePath, json_encode($stories, JSON_PRETTY_PRINT));
        sendResponse(true, 'Đã tăng view.');
    } else {
        sendResponse(false, 'Không tìm thấy truyện.');
    }
}

// --- XỬ LÝ COMMENT ---
if ($action === 'get_comments' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $filePath = $baseDir . '/comments.json';
    if (!file_exists($filePath)) {
        // Tạo file rỗng nếu chưa có
        file_put_contents($filePath, '[]');
        sendResponse(true, 'Lấy comment (rỗng)', []);
    }
    $content = file_get_contents($filePath);
    sendResponse(true, 'Lấy comment thành công', json_decode($content));
}

if ($action === 'add_comment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $newCommentJson = isset($_POST['comment']) ? $_POST['comment'] : '';
    if (!$newCommentJson) sendResponse(false, 'Thiếu nội dung comment.');

    $newComment = json_decode($newCommentJson, true);
    $filePath = $baseDir . '/comments.json';
    
    $currentComments = [];
    if (file_exists($filePath)) {
        $currentComments = json_decode(file_get_contents($filePath), true);
        if (!is_array($currentComments)) $currentComments = [];
    }

    // Thêm comment mới lên đầu
    array_unshift($currentComments, $newComment);
    
    // Giới hạn lưu trữ (ví dụ 1000 comment mới nhất để tránh file quá nặng)
    if (count($currentComments) > 1000) {
        $currentComments = array_slice($currentComments, 0, 1000);
    }

    file_put_contents($filePath, json_encode($currentComments, JSON_PRETTY_PRINT));
    sendResponse(true, 'Đăng comment thành công.');
}

sendResponse(false, 'Action không tồn tại.');
?>