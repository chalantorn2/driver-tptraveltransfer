<?php
// api/driver/get-tracking-token.php - Get or Create Tracking Token for Driver

error_reporting(0);
ini_set('display_errors', 0);
ob_start();

session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    if (!isset($_SESSION['logged_in']) || !isset($_SESSION['driver_id']) || $_SESSION['role'] !== 'driver') {
        throw new Exception('Not authenticated');
    }

    $booking_ref = $_GET['ref'] ?? '';

    if (empty($booking_ref)) {
        throw new Exception('Booking reference required');
    }

    require_once '../config/database.php';

    $driver_id = $_SESSION['driver_id'];
    $db = new Database();
    $pdo = $db->getConnection();

    // Check if driver has this assignment
    $checkSql = "SELECT dva.id, dva.booking_ref, dva.vehicle_id,
                        b.pickup_date, b.arrival_date, b.departure_date,
                        b.booking_ref as vehicle_identifier
                 FROM driver_vehicle_assignments dva
                 LEFT JOIN bookings b ON dva.booking_ref = b.booking_ref
                 WHERE dva.booking_ref = :booking_ref AND dva.driver_id = :driver_id";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([
        ':booking_ref' => $booking_ref,
        ':driver_id' => $driver_id
    ]);
    $assignment = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$assignment) {
        throw new Exception('Assignment not found');
    }

    // Use booking_ref as vehicle_identifier if not available
    if (empty($assignment['vehicle_identifier'])) {
        $assignment['vehicle_identifier'] = $assignment['booking_ref'];
    }

    // Check if tracking token already exists
    $tokenSql = "SELECT token, status, started_at, completed_at, expires_at
                 FROM driver_tracking_tokens
                 WHERE assignment_id = :assignment_id
                 ORDER BY created_at DESC
                 LIMIT 1";
    $tokenStmt = $pdo->prepare($tokenSql);
    $tokenStmt->execute([':assignment_id' => $assignment['id']]);
    $existingToken = $tokenStmt->fetch(PDO::FETCH_ASSOC);

    // If token exists and is not expired, return it
    if ($existingToken && strtotime($existingToken['expires_at']) > time()) {
        ob_end_clean();
        echo json_encode([
            'success' => true,
            'data' => [
                'token' => $existingToken['token'],
                'status' => $existingToken['status'],
                'started_at' => $existingToken['started_at'],
                'completed_at' => $existingToken['completed_at'],
                'expires_at' => $existingToken['expires_at'],
                'is_new' => false
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Create new token
    $token = bin2hex(random_bytes(32)); // Generate secure token

    // Calculate expiration: pickup_date + 3 days
    $pickupDate = $assignment['pickup_date'] ?? $assignment['arrival_date'] ?? $assignment['departure_date'];
    $expiresAt = date('Y-m-d H:i:s', strtotime($pickupDate . ' +3 days'));

    // Insert new token
    $insertSql = "INSERT INTO driver_tracking_tokens
                  (token, booking_ref, driver_id, vehicle_id, assignment_id, vehicle_identifier,
                   status, tracking_interval, expires_at, created_at)
                  VALUES
                  (:token, :booking_ref, :driver_id, :vehicle_id, :assignment_id, :vehicle_identifier,
                   'pending', 30, :expires_at, NOW())";
    $insertStmt = $pdo->prepare($insertSql);
    $insertStmt->execute([
        ':token' => $token,
        ':booking_ref' => $assignment['booking_ref'],
        ':driver_id' => $driver_id,
        ':vehicle_id' => $assignment['vehicle_id'],
        ':assignment_id' => $assignment['id'],
        ':vehicle_identifier' => $assignment['vehicle_identifier'],
        ':expires_at' => $expiresAt
    ]);

    ob_end_clean();

    echo json_encode([
        'success' => true,
        'data' => [
            'token' => $token,
            'status' => 'pending',
            'started_at' => null,
            'completed_at' => null,
            'expires_at' => $expiresAt,
            'is_new' => true
        ]
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
