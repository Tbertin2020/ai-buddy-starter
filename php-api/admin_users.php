<?php
require_once __DIR__ . '/auth_middleware.php';

// Verify admin privilege
$adminUser = requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // List users
        try {
            $stmt = $pdo->query("SELECT id, names, email, phone, role, created_at FROM users ORDER BY names");
            $users = $stmt->fetchAll();
            // Ensure ID is integer
            foreach ($users as &$u) {
                $u['id'] = (int)$u['id'];
            }
            echo json_encode($users);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;
        
    case 'POST':
        // Create user
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['names']) || !isset($input['email']) || !isset($input['phone']) || !isset($input['password']) || !isset($input['role'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit();
        }
        $names = trim($input['names']);
        $email = trim($input['email']);
        $phone = trim($input['phone']);
        $password = $input['password'];
        $role = trim($input['role']);
        
        if (empty($names) || empty($email) || empty($phone) || empty($password) || empty($role)) {
            http_response_code(400);
            echo json_encode(["error" => "All fields must be filled."]);
            exit();
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid email format."]);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(["error" => "Email is already taken."]);
                exit();
            }
            
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT INTO users (names, email, phone, password, role) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$names, $email, $phone, $hashedPassword, $role]);
            
            http_response_code(201);
            echo json_encode(["message" => "User created successfully."]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        // Update user
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['id']) || !isset($input['names']) || !isset($input['email']) || !isset($input['phone']) || !isset($input['role'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit();
        }
        $id = (int)$input['id'];
        $names = trim($input['names']);
        $email = trim($input['email']);
        $phone = trim($input['phone']);
        $role = trim($input['role']);
        
        if (empty($names) || empty($email) || empty($phone) || empty($role)) {
            http_response_code(400);
            echo json_encode(["error" => "All fields must be filled."]);
            exit();
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid email format."]);
            exit();
        }
        
        try {
            // Check email collision
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([$email, $id]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(["error" => "Email is already taken by another user."]);
                exit();
            }
            
            // Check if password needs updating
            if (isset($input['password']) && !empty($input['password'])) {
                $hashedPassword = password_hash($input['password'], PASSWORD_BCRYPT);
                $stmt = $pdo->prepare("UPDATE users SET names = ?, email = ?, phone = ?, role = ?, password = ? WHERE id = ?");
                $stmt->execute([$names, $email, $phone, $role, $hashedPassword, $id]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET names = ?, email = ?, phone = ?, role = ? WHERE id = ?");
                $stmt->execute([$names, $email, $phone, $role, $id]);
            }
            
            http_response_code(200);
            echo json_encode(["message" => "User updated successfully."]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        // Delete user
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id <= 0) {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? (int)$input['id'] : 0;
        }
        
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Missing or invalid user ID."]);
            exit();
        }
        
        // Prevent deleting oneself
        if ($id === (int)$adminUser['id']) {
            http_response_code(400);
            echo json_encode(["error" => "Cannot delete your own admin account."]);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            http_response_code(200);
            echo json_encode(["message" => "User deleted successfully."]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed."]);
        break;
}
