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
        // Retrieve indicator numbers with joining names and optional filtering
        $districtId = isset($_GET['district_id']) ? trim($_GET['district_id']) : '';
        $indicatorId = isset($_GET['indicator_id']) ? trim($_GET['indicator_id']) : '';
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 200;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        try {
            $sql = "
                SELECT di.id, di.district_id, d.name as district_name, di.indicator_id, i.name as indicator_name, di.year, di.value, di.created_at
                FROM district_indicators di
                JOIN districts d ON di.district_id = d.id
                JOIN indicators i ON di.indicator_id = i.id
                WHERE 1=1
            ";
            $params = [];

            if (!empty($districtId)) {
                $sql .= " AND di.district_id = ?";
                $params[] = $districtId;
            }

            if (!empty($indicatorId)) {
                $sql .= " AND di.indicator_id = ?";
                $params[] = $indicatorId;
            }

            if (!empty($search)) {
                $sql .= " AND (d.name LIKE ? OR i.name LIKE ? OR di.year LIKE ?)";
                $searchWildcard = "%" . $search . "%";
                $params[] = $searchWildcard;
                $params[] = $searchWildcard;
                $params[] = $searchWildcard;
            }

            $sql .= " ORDER BY di.created_at DESC, d.name ASC, di.year DESC LIMIT $limit OFFSET $offset";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $numbers = $stmt->fetchAll();

            // Format numeric values
            foreach ($numbers as &$num) {
                $num['year'] = (int)$num['year'];
                $num['value'] = (float)$num['value'];
            }

            // Get total count for pagination
            $countSql = "
                SELECT COUNT(*) as total
                FROM district_indicators di
                JOIN districts d ON di.district_id = d.id
                JOIN indicators i ON di.indicator_id = i.id
                WHERE 1=1
            ";
            $countParams = [];
            if (!empty($districtId)) {
                $countSql .= " AND di.district_id = ?";
                $countParams[] = $districtId;
            }
            if (!empty($indicatorId)) {
                $countSql .= " AND di.indicator_id = ?";
                $countParams[] = $indicatorId;
            }
            if (!empty($search)) {
                $countSql .= " AND (d.name LIKE ? OR i.name LIKE ? OR di.year LIKE ?)";
                $countParams[] = $searchWildcard;
                $countParams[] = $searchWildcard;
                $countParams[] = $searchWildcard;
            }

            $countStmt = $pdo->prepare($countSql);
            $countStmt->execute($countParams);
            $totalCount = (int)$countStmt->fetch()['total'];

            http_response_code(200);
            echo json_encode([
                "data" => $numbers,
                "total" => $totalCount,
                "limit" => $limit,
                "offset" => $offset
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        // Add statistical number (upsert if unique constraints collide)
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['district_id']) || !isset($input['indicator_id']) || !isset($input['year']) || !isset($input['value'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit();
        }

        $districtId = trim($input['district_id']);
        $indicatorId = trim($input['indicator_id']);
        $year = (int)$input['year'];
        $value = (float)$input['value'];

        if (empty($districtId) || empty($indicatorId) || $year <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "District, Indicator, and valid Year are required."]);
            exit();
        }

        try {
            // Verify if district exists
            $stmt = $pdo->prepare("SELECT id FROM districts WHERE id = ?");
            $stmt->execute([$districtId]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(["error" => "District not found."]);
                exit();
            }

            // Verify if indicator exists
            $stmt = $pdo->prepare("SELECT id FROM indicators WHERE id = ?");
            $stmt->execute([$indicatorId]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(["error" => "Indicator not found."]);
                exit();
            }

            // Check if there is an existing entry for this district+indicator+year
            $stmt = $pdo->prepare("SELECT id FROM district_indicators WHERE district_id = ? AND indicator_id = ? AND year = ?");
            $stmt->execute([$districtId, $indicatorId, $year]);
            $existing = $stmt->fetch();

            if ($existing) {
                // Update
                $stmt = $pdo->prepare("UPDATE district_indicators SET value = ? WHERE id = ?");
                $stmt->execute([$value, $existing['id']]);
                http_response_code(200);
                echo json_encode(["message" => "Statistical value updated successfully.", "id" => $existing['id']]);
            } else {
                // Insert
                $id = generate_uuid();
                $stmt = $pdo->prepare("INSERT INTO district_indicators (id, district_id, indicator_id, year, value) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$id, $districtId, $indicatorId, $year, $value]);
                http_response_code(201);
                echo json_encode(["message" => "Statistical value created successfully.", "id" => $id]);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Direct Edit by ID
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['id']) || !isset($input['district_id']) || !isset($input['indicator_id']) || !isset($input['year']) || !isset($input['value'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit();
        }

        $id = trim($input['id']);
        $districtId = trim($input['district_id']);
        $indicatorId = trim($input['indicator_id']);
        $year = (int)$input['year'];
        $value = (float)$input['value'];

        if (empty($id) || empty($districtId) || empty($indicatorId) || $year <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "All fields are required."]);
            exit();
        }

        try {
            // Check district+indicator+year collision for other rows
            $stmt = $pdo->prepare("SELECT id FROM district_indicators WHERE district_id = ? AND indicator_id = ? AND year = ? AND id != ?");
            $stmt->execute([$districtId, $indicatorId, $year, $id]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(["error" => "A statistical record already exists for this District, Indicator and Year combination."]);
                exit();
            }

            $stmt = $pdo->prepare("UPDATE district_indicators SET district_id = ?, indicator_id = ?, year = ?, value = ? WHERE id = ?");
            $stmt->execute([$districtId, $indicatorId, $year, $value, $id]);

            http_response_code(200);
            echo json_encode(["message" => "Statistical record updated successfully."]);
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
            echo json_encode(["error" => "Missing statistical record ID."]);
            exit();
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM district_indicators WHERE id = ?");
            $stmt->execute([$id]);
            http_response_code(200);
            echo json_encode(["message" => "Statistical record deleted successfully."]);
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
