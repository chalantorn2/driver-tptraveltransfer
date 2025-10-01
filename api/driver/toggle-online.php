<?php
// api/driver/toggle-online.php - Toggle Online/Offline Status

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
    $is_online = isset($input['is_online']) ? (int)$input['is_online'] : 0;

    require_once '../config/database.php';

    $driver_id = $_SESSION['driver_id'];
    $db = new Database();
    $pdo = $db->getConnection();

    // Note: Need to add 'is_online' column to drivers table first
    // ALTER TABLE drivers ADD COLUMN is_online TINYINT(1) DEFAULT 0 AFTER status;

    $sql = "UPDATE drivers SET is_online = :is_online WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':is_online' => $is_online,
        ':id' => $driver_id
    ]);

    ob_end_clean();

    echo json_encode([
        'success' => true,
        'message' => $is_online ? 'Online' : 'Offline',
        'data' => [
            'is_online' => (bool)$is_online
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
