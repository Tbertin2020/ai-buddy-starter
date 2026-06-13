<?php
require_once __DIR__ . '/auth_middleware.php';

// Verify token
$user = getAuthenticatedUser();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Use POST."]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['districtName']) || !isset($input['indicatorName']) || !isset($input['unit']) || !isset($input['history'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields: districtName, indicatorName, unit, history."]);
    exit();
}

$districtName = $input['districtName'];
$indicatorName = $input['indicatorName'];
$unit = $input['unit'];
$history = $input['history'];
$forecastYears = isset($input['forecastYears']) ? (int)$input['forecastYears'] : 3;

if (!is_array($history) || count($history) === 0) {
    http_response_code(400);
    echo json_encode(["error" => "History must be a non-empty array of data points."]);
    exit();
}

// Sort history by year ascending
usort($history, function($a, $b) {
    return $a['year'] - $b['year'];
});

$n = count($history);
$sumX = 0;
$sumY = 0;
$sumXY = 0;
$sumXX = 0;

foreach ($history as $point) {
    $x = (float)$point['year'];
    $y = (float)$point['value'];
    $sumX += $x;
    $sumY += $y;
    $sumXY += $x * $y;
    $sumXX += $x * $x;
}

$denominator = ($n * $sumXX) - ($sumX * $sumX);
$slope = 0;
$intercept = 0;

if ($denominator != 0) {
    $slope = ($n * $sumXY - $sumX * $sumY) / $denominator;
    $intercept = ($sumY - $slope * $sumX) / $n;
} else {
    // If we have only 1 point or denominator is 0, keep it constant
    $slope = 0;
    $intercept = (float)$history[0]['value'];
}

$lastYear = (int)$history[$n - 1]['year'];
$forecast = [];

for ($i = 1; $i <= $forecastYears; $i++) {
    $targetYear = $lastYear + $i;
    $forecastValue = $slope * $targetYear + $intercept;
    // Don't let positive percentages exceed 100 or values go below 0 if appropriate
    if ($unit === '%' && $forecastValue > 100) {
        $forecastValue = 100.0;
    }
    if ($forecastValue < 0) {
        $forecastValue = 0.0; // Statistical floor
    }
    $forecast[] = [
        'year' => $targetYear,
        'value' => round($forecastValue, 4)
    ];
}

// Generate insight based on slope
$finalYearForecast = $forecast[count($forecast) - 1];
$formattedValue = number_format($finalYearForecast['value'], $unit === '%' ? 1 : 0);
$direction = "stable";
$directionVerb = "remain relatively stable at";

if ($slope > 0.01) {
    $direction = "upward";
    $directionVerb = "increase to approximately";
} elseif ($slope < -0.01) {
    $direction = "downward";
    $directionVerb = "decrease to approximately";
}

$insight = "Based on historical statistical modeling for $districtName, the $indicatorName is projected to show a $direction trend over the next 3 years. It is expected to $directionVerb $formattedValue$unit by the year {$finalYearForecast['year']}, assuming current socio-economic trajectories persist.";

http_response_code(200);
echo json_encode([
    'forecast' => $forecast,
    'insight' => $insight
]);
