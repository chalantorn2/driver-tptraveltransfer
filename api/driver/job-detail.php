<?php
// api/driver/job-detail.php - Get Job Details

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

    $booking_ref = $_GET['ref'] ?? '';

    if (empty($booking_ref)) {
        throw new Exception('Booking reference required');
    }

    require_once '../config/database.php';

    $driver_id = $_SESSION['driver_id'];
    $db = new Database();
    $pdo = $db->getConnection();

    // Get job details with driver assignment
    $sql = "SELECT
                b.*,
                b.pickup_date as pickup_date_original,
                b.pickup_date_adjusted,
                COALESCE(b.pickup_date_adjusted, b.pickup_date) as pickup_date,
                dva.status as assignment_status,
                dva.completion_type,
                dva.assigned_at,
                v.registration,
                v.brand,
                v.model,
                v.color,
                v.description as vehicle_description,
                d.name as driver_name,
                d.phone_number as driver_phone
            FROM bookings b
            LEFT JOIN driver_vehicle_assignments dva ON b.booking_ref = dva.booking_ref AND dva.driver_id = :driver_id
            LEFT JOIN vehicles v ON dva.vehicle_id = v.id
            LEFT JOIN drivers d ON dva.driver_id = d.id
            WHERE b.booking_ref = :booking_ref";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':booking_ref' => $booking_ref,
        ':driver_id' => $driver_id
    ]);

    $job = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$job) {
        throw new Exception('Job not found');
    }

    // Check if this job is assigned to this driver
    if ($job['assignment_status'] === null) {
        throw new Exception('This job is not assigned to you');
    }

    // Parse raw_data if exists
    if (!empty($job['raw_data'])) {
        $job['raw_data'] = json_decode($job['raw_data'], true);
    }

    // === Calculate pickup and dropoff locations based on booking_type (same logic as tracking/info.php) ===
    $bookingType = strtolower($job['booking_type'] ?? '');
    $accommodation = $job['accommodation_name'] ?? $job['resort'] ?? '';
    $airport = $job['airport'] ?? $job['from_airport'] ?? $job['to_airport'] ?? '';

    $pickupLocation = '-';
    $dropoffLocation = '-';

    if (strpos($bookingType, 'arrival') !== false || !empty($job['arrival_date'])) {
        // Arrival transfer: Airport -> Accommodation
        $pickupLocation = $airport ?: 'Airport';
        $dropoffLocation = $accommodation ?: 'Resort/Hotel';
    } elseif (strpos($bookingType, 'departure') !== false || !empty($job['departure_date'])) {
        // Departure transfer: Accommodation -> Airport
        $pickupLocation = $accommodation ?: 'Resort/Hotel';
        $dropoffLocation = $airport ?: 'Airport';
    } elseif (strpos($bookingType, 'quote') !== false) {
        // Quote transfer: Use pickup_address1 and dropoff_address1 if available
        $pickupLocation = $job['pickup_address1'] ?? '';
        $dropoffLocation = $job['dropoff_address1'] ?? '';

        // If Quote addresses not available, try to determine from dates
        if (empty($pickupLocation) && empty($dropoffLocation)) {
            // If arrival_date exists, treat as arrival (Airport -> Accommodation)
            if (!empty($job['arrival_date'])) {
                $pickupLocation = $airport ?: 'Airport';
                $dropoffLocation = $accommodation ?: 'Resort/Hotel';
            }
            // If departure_date exists, treat as departure (Accommodation -> Airport)
            elseif (!empty($job['departure_date'])) {
                $pickupLocation = $accommodation ?: 'Resort/Hotel';
                $dropoffLocation = $airport ?: 'Airport';
            }
            // Use available location data
            else {
                if (!empty($accommodation) && !empty($airport)) {
                    $pickupLocation = $accommodation;
                    $dropoffLocation = $airport;
                } elseif (!empty($accommodation)) {
                    $pickupLocation = $accommodation;
                    $dropoffLocation = 'Destination';
                } elseif (!empty($airport)) {
                    $pickupLocation = $airport;
                    $dropoffLocation = 'Destination';
                } else {
                    $pickupLocation = '-';
                    $dropoffLocation = '-';
                }
            }
        }

        // Fallback if still empty
        if (empty($pickupLocation)) $pickupLocation = '-';
        if (empty($dropoffLocation)) $dropoffLocation = '-';
    } else {
        // Default: Use available location data
        if (!empty($accommodation) && !empty($airport)) {
            // If both exist, default to departure direction
            $pickupLocation = $accommodation;
            $dropoffLocation = $airport;
        } elseif (!empty($accommodation)) {
            $pickupLocation = $accommodation;
            $dropoffLocation = 'Destination';
        } elseif (!empty($airport)) {
            $pickupLocation = $airport;
            $dropoffLocation = 'Destination';
        }
    }

    // Add calculated fields to job data
    $job['pickup_location'] = $pickupLocation;
    $job['dropoff_location'] = $dropoffLocation;

    ob_end_clean();

    echo json_encode([
        'success' => true,
        'data' => [
            'job' => $job
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
