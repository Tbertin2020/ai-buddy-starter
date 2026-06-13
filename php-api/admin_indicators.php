<?php
require_once __DIR__ . '/auth_middleware.php';

// Verify admin privilege
$adminUser = requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];

function generate_uuid() {
    return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
        mt_rand( 0, 0xffff ),
        mt_rand( 0, 0x0fff ) | 0x4000,
        mt_rand( 0, 0x3fff ) | 0x8000,
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
    );
}

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT id, `key`, name, unit, category, created_at FROM indicators ORDER BY name");
            $indicators = $stmt->fetchAll();
            echo json_encode($indicators);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['key']) || !isset($input['name']) || !isset($input['unit']) || !isset($input['category'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit();
        }

        $key = trim($input['key']);
        $name = trim($input['name']);
        $unit = trim($input['unit']);
        $category = trim($input['category']);

        if (empty($key) || empty($name) || empty($unit) || empty($category)) {
            http_response_code(400);
            echo json_encode(["error" => "All fields (key, name, unit, category) are required."]);
            exit();
        }

        try {
            // Check uniqueness of key
            $stmt = $pdo->prepare("SELECT id FROM indicators WHERE `key` = ?");
            $stmt->execute([$key]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(["error" => "An indicator with this key already exists."]);
                exit();
            }

            $id = generate_uuid();
            $stmt = $pdo->prepare("INSERT INTO indicators (id, `key`, name, unit, category) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$id, $key, $name, $unit, $category]);

            http_response_code(201);
            echo json_encode(["message" => "Indicator created successfully.", "id" => $id]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['id']) || !isset($input['key']) || !isset($input['name']) || !isset($input['unit']) || !isset($input['category'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit();
        }

        $id = trim($input['id']);
        $key = trim($input['key']);
        $name = trim($input['name']);
        $unit = trim($input['unit']);
        $category = trim($input['category']);

        if (empty($id) || empty($key) || empty($name) || empty($unit) || empty($category)) {
            http_response_code(400);
            echo json_encode(["error" => "All fields are required."]);
            exit();
        }

        try {
            // Check key collision
            $stmt = $pdo->prepare("SELECT id FROM indicators WHERE `key` = ? AND id != ?");
            $stmt->execute([$key, $id]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(["error" => "An indicator with this key already exists."]);
                exit();
            }

            $stmt = $pdo->prepare("UPDATE indicators SET `key` = ?, name = ?, unit = ?, category = ? WHERE id = ?");
            $stmt->execute([$key, $name, $unit, $category, $id]);

            http_response_code(200);
            echo json_encode(["message" => "Indicator updated successfully."]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? trim($_GET['id']) : '';
        if (empty($id)) {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? trim($input['id']) : '';
        }

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["error" => "Missing indicator ID."]);
            exit();
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM indicators WHERE id = ?");
            $stmt->execute([$id]);
            http_response_code(200);
            echo json_encode(["message" => "Indicator deleted successfully."]);
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
