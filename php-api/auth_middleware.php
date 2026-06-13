<?php
require_once __DIR__ . '/config.php';

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

function base64UrlEncode($data) {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}

function base64UrlDecode($data) {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $padlen = 4 - $remainder;
        $data .= str_repeat('=', $padlen);
    }
    return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
}

function generateJWT($userId, $email, $role) {
    $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
    $payload = json_encode([
        'id' => $userId,
        'email' => $email,
        'role' => $role,
        'exp' => time() + 86400 // Valid for 24 hours
    ]);
    
    $base64UrlHeader = base64UrlEncode($header);
    $base64UrlPayload = base64UrlEncode($payload);
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = base64UrlEncode($signature);
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verifyJWT($jwt) {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return false;
    
    list($header, $payload, $signature) = $parts;
    
    $validSignature = base64UrlEncode(hash_hmac('sha256', $header . "." . $payload, JWT_SECRET, true));
    if ($signature !== $validSignature) return false;
    
    $payloadData = json_decode(base64UrlDecode($payload), true);
    if (!$payloadData) return false;
    
    if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
        return false; // Expired
    }
    
    return $payloadData;
}

function getAuthenticatedUser() {
    $headers = getallheaders();
    $authHeader = '';
    
    // Normalize headers keys to lowercase
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $authHeader = $value;
            break;
        }
    }
    
    if (empty($authHeader) && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $jwt = $matches[1];
        $userData = verifyJWT($jwt);
        if ($userData) {
            return $userData;
        }
    }
    
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized. Token is missing or invalid."]);
    exit();
}

function requireAdmin() {
    $user = getAuthenticatedUser();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["error" => "Forbidden. Admin access required."]);
        exit();
    }
    return $user;
}
