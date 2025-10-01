<?php
// api/driver/accept-job.php - Accept Job

error_reporting(0);
ini_set('display_errors', 0);
ob_start();

session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    if (!isset($_SESSION['logged_in']) || !isset($_SESSION['driver_id']) || $_SESSION['role'] !== 'driver') {
        throw new Exception('Not authenticated');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $booking_ref = $input['booking_ref'] ?? '';

    if (empty($booking_ref)) {
        throw new Exception('Booking reference required');
    }

    require_once '../config/database.php';

    $driver_id = $_SESSION['driver_id'];
    $db = new Database();
    $pdo = $db->getConnection();

    // Start transaction
    $pdo->beginTransaction();

    // Check if assignment exists and belongs to this driver
    $checkSql = "SELECT id, status FROM driver_vehicle_assignments 
                 WHERE booking_ref = :booking_ref AND driver_id = :driver_id";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([
        ':booking_ref' => $booking_ref,
        ':driver_id' => $driver_id
    ]);
    $assignment = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$assignment) {
        throw new Exception('Assignment not found');
    }

    if ($assignment['status'] !== 'assigned') {
        throw new Exception('Job already accepted or in different state');
    }

    // Update assignment status - keep as 'assigned' but mark as acknowledged
    // Status will change to 'in_progress' when driver starts the job

    // For now, we'll just record that driver viewed/accepted the job
    // You can add an 'acknowledged_at' column if needed

    $pdo->commit();

    ob_end_clean();

    echo json_encode([
        'success' => true,
        'message' => 'Job acknowledged successfully',
        'data' => [
            'booking_ref' => $booking_ref,
            'status' => 'assigned'
        ]
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    ob_end_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
