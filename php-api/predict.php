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

function generateRecommendation($indicatorName, $direction, $districtName) {
    $key = strtolower($indicatorName);
    $rising = ($direction === 'upward');
    $falling = ($direction === 'downward');

    if (strpos($key, 'population') !== false) {
        if ($rising) return "Population in $districtName is projected to keep rising. Government should strengthen family planning strategies, expand reproductive health education, invest in additional schools and health centers, and plan urban infrastructure (water, housing, transport) to absorb the growth sustainably.";
        if ($falling) return "Population is projected to decline in $districtName. Government should investigate causes (migration, mortality, fertility), invest in job creation and youth retention programs, and reassess service delivery to avoid understaffed schools and clinics.";
        return "Population is stable in $districtName. Government should maintain current service capacity while monitoring migration and fertility indicators quarterly.";
    }
    if (strpos($key, 'literacy') !== false || strpos($key, 'education') !== false) {
        if ($rising) return "Literacy is improving in $districtName. Government should sustain teacher training investments, expand digital learning tools, and shift focus toward quality of education and TVET pathways.";
        if ($falling) return "Literacy is declining in $districtName. Government should urgently audit school attendance, deploy remedial reading programs, subsidize learning materials, and expand adult literacy campaigns through sector-level partnerships.";
        return "Literacy is stagnating in $districtName. Government should introduce targeted interventions such as community reading clubs and performance-based teacher incentives.";
    }
    if (strpos($key, 'gdp') !== false || strpos($key, 'income') !== false || strpos($key, 'economic') !== false) {
        if ($rising) return "Economic output in $districtName is growing. Government should channel gains into infrastructure, SME financing, and skills development to keep growth inclusive and diversify beyond the leading sector.";
        if ($falling) return "Economic output is contracting in $districtName. Government should launch stimulus measures — SME grants, tax relief for productive sectors, cash-for-work programs — and accelerate priority infrastructure projects to restore momentum.";
        return "Economy is flat in $districtName. Government should attract private investment through incentives, improve business registration efficiency, and upgrade market infrastructure.";
    }
    if (strpos($key, 'poverty') !== false || strpos($key, 'unemployment') !== false) {
        if ($rising) return "$indicatorName is worsening in $districtName. Government should scale social safety nets (VUP, Ubudehe), expand vocational training, and prioritize labor-intensive public works in the district.";
        if ($falling) return "$indicatorName is improving in $districtName. Government should protect the gains by strengthening graduation programs, financial inclusion, and continuous skills upgrading.";
        return "$indicatorName is stagnant in $districtName. Government should re-evaluate targeting of social programs and pilot new livelihood interventions.";
    }
    if (strpos($key, 'health') !== false || strpos($key, 'mortality') !== false || strpos($key, 'life') !== false) {
        if ($rising && strpos($key, 'mortality') !== false) return "Mortality is rising in $districtName. Government must urgently investigate the drivers (disease outbreak, maternal health, road safety), reinforce primary healthcare staffing, and expand community health worker coverage.";
        if ($rising) return "Health indicators are improving in $districtName. Government should sustain investment in community health, expand Mutuelle coverage, and prepare for the epidemiological transition to non-communicable diseases.";
        if ($falling && strpos($key, 'mortality') !== false) return "Mortality is declining in $districtName — a positive trend. Government should maintain immunization coverage, maternal health services, and continue investing in the referral hospital network.";
        return "Health indicators are stable in $districtName. Government should continue routine monitoring and invest in preventive care.";
    }
    if (strpos($key, 'water') !== false || strpos($key, 'electricity') !== false || strpos($key, 'access') !== false) {
        if ($rising) return "Access to $indicatorName is expanding in $districtName. Government should keep infrastructure investment steady and shift focus to service reliability, affordability, and last-mile connections.";
        if ($falling) return "Access to $indicatorName is regressing in $districtName. Government should audit distribution infrastructure, allocate emergency maintenance budgets, and partner with private operators to restore coverage.";
        return "Access to $indicatorName is unchanged in $districtName. Government should accelerate connections to underserved sectors to meet national targets.";
    }
    if (strpos($key, 'agriculture') !== false || strpos($key, 'crop') !== false || strpos($key, 'yield') !== false || strpos($key, 'production') !== false) {
        if ($rising) return "Agricultural production is growing in $districtName. Government should invest in post-harvest storage, market access roads, and export value chains to convert volume into farmer income.";
        if ($falling) return "Agricultural production is declining in $districtName. Government should provide subsidized inputs (seeds, fertilizer), expand irrigation, roll out climate-smart practices, and strengthen extension services.";
        return "Agricultural output is stable in $districtName. Government should promote crop diversification and mechanization to unlock the next growth wave.";
    }

    if ($rising) return "$indicatorName is projected to keep rising in $districtName. Government should plan proportional service expansion, allocate budget accordingly in the medium-term expenditure framework, and continue close monitoring.";
    if ($falling) return "$indicatorName is projected to decline in $districtName. Government should investigate root causes, design targeted interventions with the responsible ministry, and set corrective KPIs for the next planning cycle.";
    return "$indicatorName is expected to remain stable in $districtName. Government should maintain current policy and monitor for early signs of change.";
}

$recommendation = generateRecommendation($indicatorName, $direction, $districtName);

http_response_code(200);
echo json_encode([
    'forecast' => $forecast,
    'insight' => $insight,
    'recommendation' => $recommendation
]);
