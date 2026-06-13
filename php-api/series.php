<?php
require_once __DIR__ . '/auth_middleware.php';

// Verify token
$user = getAuthenticatedUser();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Use GET."]);
    exit();
}

$districtId = isset($_GET['district_id']) ? $_GET['district_id'] : '';
$indicatorId = isset($_GET['indicator_id']) ? $_GET['indicator_id'] : '';

if (empty($districtId) || empty($indicatorId)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required query parameters: district_id, indicator_id."]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT year, value FROM district_indicators WHERE district_id = ? AND indicator_id = ? ORDER BY year");
    $stmt->execute([$districtId, $indicatorId]);
    $series = $stmt->fetchAll();

    // Map types to match javascript expectations (year as int, value as float/number)
    foreach ($series as &$s) {
        $s['year'] = (int)$s['year'];
        $s['value'] = (float)$s['value'];
    }

    http_response_code(200);
    echo json_encode($series);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
