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
            $stmt = $pdo->query("SELECT id, name, province, lat, lng, created_at FROM districts ORDER BY name");
            $districts = $stmt->fetchAll();
            foreach ($districts as &$d) {
                $d['lat'] = (float)$d['lat'];
                $d['lng'] = (float)$d['lng'];
            }
            echo json_encode($districts);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['name']) || !isset($input['province']) || !isset($input['lat']) || !isset($input['lng'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit();
        }

        $name = trim($input['name']);
        $province = trim($input['province']);
        $lat = (float)$input['lat'];
        $lng = (float)$input['lng'];

        if (empty($name) || empty($province)) {
            http_response_code(400);
            echo json_encode(["error" => "Name and Province are required."]);
            exit();
        }

        try {
            // Check uniqueness of name
            $stmt = $pdo->prepare("SELECT id FROM districts WHERE name = ?");
            $stmt->execute([$name]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(["error" => "A district with this name already exists."]);
                exit();
            }

            $id = generate_uuid();
            $stmt = $pdo->prepare("INSERT INTO districts (id, name, province, lat, lng) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$id, $name, $province, $lat, $lng]);

            http_response_code(201);
            echo json_encode(["message" => "District created successfully.", "id" => $id]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['id']) || !isset($input['name']) || !isset($input['province']) || !isset($input['lat']) || !isset($input['lng'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit();
        }

        $id = trim($input['id']);
        $name = trim($input['name']);
        $province = trim($input['province']);
        $lat = (float)$input['lat'];
        $lng = (float)$input['lng'];

        if (empty($id) || empty($name) || empty($province)) {
            http_response_code(400);
            echo json_encode(["error" => "All fields are required."]);
            exit();
        }

        try {
            // Check name collision
            $stmt = $pdo->prepare("SELECT id FROM districts WHERE name = ? AND id != ?");
            $stmt->execute([$name, $id]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(["error" => "A district with this name already exists."]);
                exit();
            }

            $stmt = $pdo->prepare("UPDATE districts SET name = ?, province = ?, lat = ?, lng = ? WHERE id = ?");
            $stmt->execute([$name, $province, $lat, $lng, $id]);

            http_response_code(200);
            echo json_encode(["message" => "District updated successfully."]);
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
            echo json_encode(["error" => "Missing district ID."]);
            exit();
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM districts WHERE id = ?");
            $stmt->execute([$id]);
            http_response_code(200);
            echo json_encode(["message" => "District deleted successfully."]);
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
