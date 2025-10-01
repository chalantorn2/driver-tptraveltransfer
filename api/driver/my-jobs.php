<?php
// api/driver/my-jobs.php - Get Driver's Jobs

// Prevent any output before JSON
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

session_start();

// CORS Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Check authentication
    if (!isset($_SESSION['logged_in']) || !isset($_SESSION['driver_id']) || $_SESSION['role'] !== 'driver') {
        throw new Exception('Not authenticated');
    }

    require_once '../config/database.php';

    $driver_id = $_SESSION['driver_id'];
    $status = $_GET['status'] ?? 'all'; // all, assigned, in_progress, completed

    $db = new Database();
    $pdo = $db->getConnection();

    // Build WHERE clause based on status
    $whereClause = "dva.driver_id = :driver_id";

    if ($status !== 'all') {
        $whereClause .= " AND dva.status = :status";
    }

    // Get jobs assigned to this driver
    $sql = "SELECT 
                b.booking_ref,
                b.passenger_name,
                b.passenger_phone,
                b.pax_total,
                b.pickup_date,
                b.arrival_date,
                b.departure_date,
                b.airport,
                b.accommodation_name,
                b.resort,
                b.flight_no_arrival,
                b.flight_no_departure,
                b.ht_status,
                b.internal_status,
                dva.status as assignment_status,
                dva.assigned_at,
                v.registration,
                v.brand,
                v.model,
                v.color
            FROM driver_vehicle_assignments dva
            INNER JOIN bookings b ON dva.booking_ref = b.booking_ref
            LEFT JOIN vehicles v ON dva.vehicle_id = v.id
            WHERE $whereClause
            ORDER BY b.pickup_date DESC";

    $stmt = $pdo->prepare($sql);
    $params = [':driver_id' => $driver_id];

    if ($status !== 'all') {
        $params[':status'] = $status;
    }

    $stmt->execute($params);
    $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Count by status
    $countSql = "SELECT 
                    COUNT(CASE WHEN dva.status = 'assigned' THEN 1 END) as new_count,
                    COUNT(CASE WHEN dva.status = 'in_progress' THEN 1 END) as in_progress_count,
                    COUNT(CASE WHEN dva.status = 'completed' THEN 1 END) as completed_count,
                    COUNT(*) as total_count
                 FROM driver_vehicle_assignments dva
                 WHERE dva.driver_id = :driver_id";

    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute([':driver_id' => $driver_id]);
    $counts = $countStmt->fetch(PDO::FETCH_ASSOC);

    ob_end_clean();

    echo json_encode([
        'success' => true,
        'data' => [
            'jobs' => $jobs,
            'counts' => $counts,
            'filter' => $status
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
