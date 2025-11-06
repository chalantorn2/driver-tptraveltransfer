<?php
// api/auth/driver-login.php - Driver Login API (Code-based v3)

// ⚠️ CRITICAL: Prevent any output before JSON
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

session_start();

// CORS Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    require_once '../config/database.php';

    // Get JSON input
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input');
    }

    $driverCode = trim($input['driver_code'] ?? '');

    // Validate input
    if (empty($driverCode)) {
        throw new Exception('Driver code is required');
    }

    // Connect to database
    $db = new Database();
    $pdo = $db->getConnection();

    // Get driver by code (or fallback to ID for backward compatibility)
    $sql = "SELECT id, username, name, phone_number, status, code
            FROM drivers
            WHERE code = :driver_code OR id = :driver_id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':driver_code' => $driverCode,
        ':driver_id' => is_numeric($driverCode) ? intval($driverCode) : 0
    ]);
    $driver = $stmt->fetch(PDO::FETCH_ASSOC);

    // Check if driver exists
    if (!$driver) {
        throw new Exception('Invalid driver code');
    }

    // Check if driver is active
    if ($driver['status'] !== 'active') {
        throw new Exception('Your account is inactive. Please contact administrator.');
    }

    // Create session
    $_SESSION['driver_id'] = $driver['id'];
    $_SESSION['driver_name'] = $driver['name'];
    $_SESSION['driver_username'] = $driver['username'];
    $_SESSION['role'] = 'driver';
    $_SESSION['logged_in'] = true;
    $_SESSION['login_time'] = time();

    // Remove password from response
    unset($driver['password']);

    // Clear any output buffer and send JSON
    ob_end_clean();

    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'data' => [
            'driver' => $driver,
            'session_id' => session_id()
        ]
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    ob_end_clean();
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
