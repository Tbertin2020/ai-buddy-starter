<?php
require_once __DIR__ . '/auth_middleware.php';

// Require admin privilege
$adminUser = requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Use GET."]);
    exit();
}

try {
    // 1. Total users
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $totalUsers = $stmt->fetch()['count'];

    // 2. Researchers
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'researcher'");
    $totalResearchers = $stmt->fetch()['count'];

    // 3. Admins
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    $totalAdmins = $stmt->fetch()['count'];

    // 4. Districts
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM districts");
    $totalDistricts = $stmt->fetch()['count'];

    // 5. Indicators
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM indicators");
    $totalIndicators = $stmt->fetch()['count'];

    // 6. Total data records
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM district_indicators");
    $totalRecords = $stmt->fetch()['count'];

    // 7. Recent Users (last 5)
    $stmt = $pdo->query("SELECT id, names, email, phone, role, created_at FROM users ORDER BY created_at DESC LIMIT 5");
    $recentUsers = $stmt->fetchAll();

    // 8. Recent Data Updates (last 5)
    $stmt = $pdo->query("
        SELECT di.id, d.name as district_name, i.name as indicator_name, di.year, di.value, di.created_at 
        FROM district_indicators di
        JOIN districts d ON di.district_id = d.id
        JOIN indicators i ON di.indicator_id = i.id
        ORDER BY di.created_at DESC 
        LIMIT 5
    ");
    $recentUpdates = $stmt->fetchAll();

    // Map types for recent updates
    foreach ($recentUpdates as &$update) {
        $update['year'] = (int)$update['year'];
        $update['value'] = (float)$update['value'];
    }

    http_response_code(200);
    echo json_encode([
        "counts" => [
            "users" => (int)$totalUsers,
            "researchers" => (int)$totalResearchers,
            "admins" => (int)$totalAdmins,
            "districts" => (int)$totalDistricts,
            "indicators" => (int)$totalIndicators,
            "records" => (int)$totalRecords
        ],
        "recentUsers" => $recentUsers,
        "recentUpdates" => $recentUpdates
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
