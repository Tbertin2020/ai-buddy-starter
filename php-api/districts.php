<?php
require_once __DIR__ . '/auth_middleware.php';

// Verify token (will exit with 401 if invalid)
$user = getAuthenticatedUser();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Use GET."]);
    exit();
}

try {
    $stmt = $pdo->query("SELECT id, name, province, lat, lng FROM districts ORDER BY name");
    $districts = $stmt->fetchAll();

    // Map types to match javascript expectations (lat, lng as numbers)
    foreach ($districts as &$d) {
        $d['lat'] = (float)$d['lat'];
        $d['lng'] = (float)$d['lng'];
    }

    http_response_code(200);
    echo json_encode($districts);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
