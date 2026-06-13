<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Use POST."]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['names']) || !isset($input['email']) || !isset($input['phone']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields: names, email, phone, password."]);
    exit();
}

$names = trim($input['names']);
$email = trim($input['email']);
$phone = trim($input['phone']);
$password = $input['password'];

if (empty($names) || empty($email) || empty($phone) || empty($password)) {
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
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "An account with this email already exists."]);
        exit();
    }

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // Insert user (default role is researcher)
    $stmt = $pdo->prepare("INSERT INTO users (names, email, phone, password, role) VALUES (?, ?, ?, ?, 'researcher')");
    $stmt->execute([$names, $email, $phone, $hashedPassword]);

    http_response_code(201);
    echo json_encode([
        "message" => "Registration successful.",
        "user" => [
            "names" => $names,
            "email" => $email,
            "phone" => $phone,
            "role" => "researcher"
        ]
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
