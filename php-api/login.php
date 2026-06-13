<?php
require_once __DIR__ . '/auth_middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Use POST."]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields: email, password."]);
    exit();
}

$email = trim($input['email']);
$password = $input['password'];

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["error" => "Email and password are required."]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Generate Token
        $token = generateJWT($user['id'], $user['email'], $user['role']);
        
        http_response_code(200);
        echo json_encode([
            "message" => "Login successful.",
            "token" => $token,
            "user" => [
                "id" => $user['id'],
                "names" => $user['names'],
                "email" => $user['email'],
                "phone" => $user['phone'],
                "role" => $user['role']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Invalid email or password."]);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
