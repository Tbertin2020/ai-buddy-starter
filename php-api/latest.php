<?php
require_once __DIR__ . '/auth_middleware.php';

// Verify token
$user = getAuthenticatedUser();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Use GET."]);
    exit();
}

$indicatorId = isset($_GET['indicator_id']) ? $_GET['indicator_id'] : '';

if (empty($indicatorId)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required query parameter: indicator_id."]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT district_id, year, value FROM district_indicators WHERE indicator_id = ? ORDER BY year DESC");
    $stmt->execute([$indicatorId]);
    $rows = $stmt->fetchAll();

    $seen = [];
    $latest = [];
    foreach ($rows as $row) {
        $dId = $row['district_id'];
        if (!in_array($dId, $seen)) {
            $seen[] = $dId;
            $latest[] = [
                'district_id' => $dId,
                'year' => (int)$row['year'],
                'value' => (float)$row['value']
            ];
        }
    }

    http_response_code(200);
    echo json_encode($latest);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
