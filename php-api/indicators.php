<?php
require_once __DIR__ . '/auth_middleware.php';

// Verify token
$user = getAuthenticatedUser();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Use GET."]);
    exit();
}

try {
    $stmt = $pdo->query("SELECT id, `key`, name, unit, category FROM indicators ORDER BY category");
    $indicators = $stmt->fetchAll();

    http_response_code(200);
    echo json_encode($indicators);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
