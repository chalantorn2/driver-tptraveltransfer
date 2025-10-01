<?php
// api/driver/profile.php - Driver Profile & Statistics (No Online/Offline)

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

try {
    if (!isset($_SESSION['logged_in']) || !isset($_SESSION['driver_id']) || $_SESSION['role'] !== 'driver') {
        throw new Exception('Not authenticated');
    }

    require_once '../config/database.php';

    $driver_id = $_SESSION['driver_id'];
    $db = new Database();
    $pdo = $db->getConnection();

    // Get driver info
    $driverSql = "SELECT id, name, phone_number, preferred_contact_method, 
                         license_number, username, status, created_at
                  FROM drivers 
                  WHERE id = :id";
    $driverStmt = $pdo->prepare($driverSql);
    $driverStmt->execute([':id' => $driver_id]);
    $driver = $driverStmt->fetch(PDO::FETCH_ASSOC);

    if (!$driver) {
        throw new Exception('Driver not found');
    }

    // Get default vehicle
    $vehicleSql = "SELECT v.* 
                   FROM vehicles v 
                   WHERE v.default_driver_id = :driver_id AND v.status = 'active'
                   LIMIT 1";
    $vehicleStmt = $pdo->prepare($vehicleSql);
    $vehicleStmt->execute([':driver_id' => $driver_id]);
    $vehicle = $vehicleStmt->fetch(PDO::FETCH_ASSOC);

    // Statistics - Today
    $todaySql = "SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN dva.status = 'completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN dva.status = 'in_progress' THEN 1 END) as in_progress,
                    COUNT(CASE WHEN dva.status = 'assigned' THEN 1 END) as pending
                 FROM driver_vehicle_assignments dva
                 WHERE dva.driver_id = :driver_id 
                 AND DATE(dva.assigned_at) = CURDATE()";
    $todayStmt = $pdo->prepare($todaySql);
    $todayStmt->execute([':driver_id' => $driver_id]);
    $todayStats = $todayStmt->fetch(PDO::FETCH_ASSOC);

    // Statistics - This Week
    $weekSql = "SELECT 
                   COUNT(*) as total,
                   COUNT(CASE WHEN dva.status = 'completed' THEN 1 END) as completed
                FROM driver_vehicle_assignments dva
                WHERE dva.driver_id = :driver_id 
                AND YEARWEEK(dva.assigned_at, 1) = YEARWEEK(CURDATE(), 1)";
    $weekStmt = $pdo->prepare($weekSql);
    $weekStmt->execute([':driver_id' => $driver_id]);
    $weekStats = $weekStmt->fetch(PDO::FETCH_ASSOC);

    // Statistics - This Month
    $monthSql = "SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN dva.status = 'completed' THEN 1 END) as completed
                 FROM driver_vehicle_assignments dva
                 WHERE dva.driver_id = :driver_id 
                 AND YEAR(dva.assigned_at) = YEAR(CURDATE()) 
                 AND MONTH(dva.assigned_at) = MONTH(CURDATE())";
    $monthStmt = $pdo->prepare($monthSql);
    $monthStmt->execute([':driver_id' => $driver_id]);
    $monthStats = $monthStmt->fetch(PDO::FETCH_ASSOC);

    // Statistics - All Time
    $allTimeSql = "SELECT 
                      COUNT(*) as total,
                      COUNT(CASE WHEN dva.status = 'completed' THEN 1 END) as completed
                   FROM driver_vehicle_assignments dva
                   WHERE dva.driver_id = :driver_id";
    $allTimeStmt = $pdo->prepare($allTimeSql);
    $allTimeStmt->execute([':driver_id' => $driver_id]);
    $allTimeStats = $allTimeStmt->fetch(PDO::FETCH_ASSOC);

    // Recent completed jobs (last 5)
    $recentSql = "SELECT 
                     b.booking_ref,
                     b.passenger_name,
                     b.pickup_date,
                     dva.status,
                     dva.assigned_at
                  FROM driver_vehicle_assignments dva
                  INNER JOIN bookings b ON dva.booking_ref = b.booking_ref
                  WHERE dva.driver_id = :driver_id 
                  AND dva.status = 'completed'
                  ORDER BY dva.assigned_at DESC
                  LIMIT 5";
    $recentStmt = $pdo->prepare($recentSql);
    $recentStmt->execute([':driver_id' => $driver_id]);
    $recentJobs = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

    ob_end_clean();

    echo json_encode([
        'success' => true,
        'data' => [
            'driver' => $driver,
            'vehicle' => $vehicle,
            'statistics' => [
                'today' => $todayStats,
                'week' => $weekStats,
                'month' => $monthStats,
                'all_time' => $allTimeStats
            ],
            'recent_jobs' => $recentJobs
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
