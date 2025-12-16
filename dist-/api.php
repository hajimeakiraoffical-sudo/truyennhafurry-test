<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

// --- CẤU HÌNH DATABASE (Bạn sửa lại cho đúng hosting của bạn) ---
$servername = "localhost";
$username = "root";      // Tên đăng nhập database (thường là root hoặc tên hosting cấp)
$password = "";          // Mật khẩu database
$dbname = "furry_stories"; // Tên database bạn đã tạo trong phpMyAdmin

// Kết nối CSDL
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    // Nếu chưa tạo DB, script vẫn chạy các tính năng không cần DB (như lưu truyện)
    // Nhưng đăng nhập sẽ lỗi.
} else {
    $conn->set_charset("utf8mb4");
}

// Hàm trả về JSON
function sendJson($success, $message = '', $data = []) {
    echo json_encode(['success' => $success, 'message' => $message] + $data);
    exit;
}

// Xử lý Request
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'signup':
        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $pass = $_POST['password'] ?? '';
        $isTranslator = ($_POST['isTranslator'] === 'true') ? 1 : 0;
        
        // Mặc định role
        $role = $isTranslator ? 'translator' : 'user';

        // Kiểm tra trùng email
        $check = $conn->query("SELECT id FROM users WHERE email = '$email'");
        if ($check && $check->num_rows > 0) {
            sendJson(false, 'Email đã tồn tại!');
        }

        // Tạo ID ngẫu nhiên
        $id = uniqid('u_');
        // Hash mật khẩu
        $hashed_pass = password_hash($pass, PASSWORD_DEFAULT);
        // Avatar mặc định
        $avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=" . urlencode($name);

        $sql = "INSERT INTO users (id, name, email, password, role, avatar, isVerified) VALUES ('$id', '$name', '$email', '$hashed_pass', '$role', '$avatar', 0)";
        
        if ($conn->query($sql) === TRUE) {
            sendJson(true, 'Đăng ký thành công!');
        } else {
            sendJson(false, 'Lỗi SQL: ' . $conn->error);
        }
        break;

    case 'login':
        $loginId = $_POST['loginId'] ?? ''; // Email hoặc Username (ở đây dùng email làm chính)
        $pass = $_POST['password'] ?? '';

        // BACKDOOR CHO ADMIN (Theo yêu cầu cũ của bạn)
        if ($loginId === 'Hajime Akira') {
             $adminUser = [
                'id' => 'admin_hajime',
                'name' => 'Hajime Akira',
                'email' => 'admin@furry.com',
                'role' => 'admin',
                'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hajime',
                'isVerified' => true
            ];
            sendJson(true, 'Chào mừng Admin!', ['user' => $adminUser]);
        }

        // Tìm user trong DB
        // (Logic đơn giản: tìm theo email hoặc tên)
        $sql = "SELECT * FROM users WHERE email = '$loginId' OR name = '$loginId'";
        $result = $conn->query($sql);

        if ($result && $result->num_rows > 0) {
            $user = $result->fetch_assoc();
            if (password_verify($pass, $user['password'])) {
                // Xóa password trước khi trả về client
                unset($user['password']);
                // Fix kiểu dữ liệu boolean cho React
                $user['isVerified'] = (bool)$user['isVerified'];
                sendJson(true, 'Đăng nhập thành công', ['user' => $user]);
            } else {
                sendJson(false, 'Sai mật khẩu!');
            }
        } else {
            sendJson(false, 'Tài khoản không tồn tại!');
        }
        break;

    case 'update_profile':
        $id = $_POST['id'] ?? '';
        $name = $_POST['name'] ?? '';
        $desc = $_POST['description'] ?? '';
        $avatar = $_POST['avatar'] ?? '';
        $cover = $_POST['cover'] ?? '';

        // Update SQL
        $sql = "UPDATE users SET name='$name', description='$desc', avatar='$avatar', cover='$cover' WHERE id='$id'";
        if ($conn->query($sql)) {
            sendJson(true, 'Cập nhật thành công');
        } else {
            sendJson(false, 'Lỗi cập nhật: ' . $conn->error);
        }
        break;

    case 'get_user_profile':
        $userId = $_POST['userId'] ?? '';
        $sql = "SELECT id, name, email, role, avatar, cover, description, isVerified, joinedAt FROM users WHERE id = '$userId' OR name = '$userId'";
        $result = $conn->query($sql);
        if ($result && $result->num_rows > 0) {
            $user = $result->fetch_assoc();
            $user['isVerified'] = (bool)$user['isVerified'];
            sendJson(true, '', ['user' => $user]);
        } else {
            sendJson(false, 'User not found');
        }
        break;

    case 'upload_image':
        if (!isset($_FILES['file'])) {
            sendJson(false, 'Chưa chọn file');
        }

        $file = $_FILES['file'];
        $path = $_POST['path'] ?? 'uploads/' . $file['name'];
        
        // Tạo thư mục nếu chưa có (recursive)
        $dir = dirname($path);
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
        }

        if (move_uploaded_file($file['tmp_name'], $path)) {
            // Trả về đường dẫn file (trên web)
            // Ví dụ: /uploads/folder/image.jpg
            sendJson(true, 'Upload thành công', ['url' => '/' . $path]);
        } else {
            sendJson(false, 'Không thể lưu file lên server (Check permission)');
        }
        break;

    case 'save_data':
        // Lưu JSON (Stories, Announcement, Genres, Settings...)
        $type = $_POST['type'] ?? ''; // 'stories', 'announcement', etc.
        $content = $_POST['content'] ?? '';

        if (!$type || !$content) sendJson(false, 'Missing data');

        $filename = '';
        if ($type === 'stories') $filename = 'stories.json';
        else if ($type === 'announcement') $filename = 'announcement.json';
        else if ($type === 'upload_settings') $filename = 'upload_settings.json';
        else if ($type === 'genres') $filename = 'genres.json';
        else if ($type === 'guide') $filename = 'guide.json';
        else sendJson(false, 'Invalid type');

        if (file_put_contents($filename, $content)) {
            sendJson(true, 'Saved ' . $filename);
        } else {
            sendJson(false, 'Cannot write to file ' . $filename);
        }
        break;
        
    case 'get_users':
        // API cho Admin lấy danh sách
        $sql = "SELECT id, name, email, role, avatar, isVerified FROM users ORDER BY joinedAt DESC";
        $result = $conn->query($sql);
        $users = [];
        if ($result) {
            while($row = $result->fetch_assoc()) {
                $row['isVerified'] = (bool)$row['isVerified'];
                $users[] = $row;
            }
        }
        echo json_encode($users);
        exit;
        break;

    case 'admin_action':
        $type = $_POST['type'] ?? '';
        $targetId = $_POST['targetId'] ?? '';
        
        if ($type === 'delete_user') {
            $conn->query("DELETE FROM users WHERE id='$targetId'");
        } 
        elseif ($type === 'toggle_role') {
            // Toggle Admin/User
            $conn->query("UPDATE users SET role = IF(role='admin', 'user', 'admin') WHERE id='$targetId'");
        }
        elseif ($type === 'toggle_verify') {
             $conn->query("UPDATE users SET isVerified = NOT isVerified WHERE id='$targetId'");
        }
        sendJson(true, 'Action executed');
        break;
        
    case 'get_comments':
        // Đọc file comments.json (Nếu dùng file) hoặc query DB (nếu bạn tạo bảng comments)
        // Ở đây dùng file cho đơn giản giống stories.json
        if (file_exists('comments.json')) {
            $data = json_decode(file_get_contents('comments.json'), true);
            sendJson(true, '', ['data' => $data]);
        } else {
            sendJson(true, '', ['data' => []]);
        }
        break;

    case 'add_comment':
        $newCmt = json_decode($_POST['comment'], true);
        $comments = [];
        if (file_exists('comments.json')) {
            $comments = json_decode(file_get_contents('comments.json'), true);
        }
        // Thêm vào đầu danh sách
        array_unshift($comments, $newCmt);
        file_put_contents('comments.json', json_encode($comments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        sendJson(true, 'Comment added');
        break;

    default:
        sendJson(false, 'Invalid Action');
}
?>