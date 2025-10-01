<?php
// api/auth/driver-check.php - Check Driver Session (Fixed v2)

// ⚠️ CRITICAL: Prevent any output before JSON
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

session_start();

// CORS Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Check if logged in and is driver
    if (
        !isset($_SESSION['logged_in']) ||
        !isset($_SESSION['driver_id']) ||
        $_SESSION['role'] !== 'driver'
    ) {
        throw new Exception('Not authenticated');
    }

    require_once '../config/database.php';

    // Get fresh driver data
    $db = new Database();
    $pdo = $db->getConnection();

    $sql = "SELECT id, username, name, phone_number, status
            FROM drivers 
            WHERE id = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $_SESSION['driver_id']]);
    $driver = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$driver) {
        throw new Exception('Driver not found');
    }

    if ($driver['status'] !== 'active') {
        throw new Exception('Account is inactive');
    }

    // Clear buffer and send JSON
    ob_end_clean();

    // Success response
    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'data' => [
            'driver' => $driver,
            'session_duration' => time() - ($_SESSION['login_time'] ?? time())
        ]
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    ob_end_clean();
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'authenticated' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
