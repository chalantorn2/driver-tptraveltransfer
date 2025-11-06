import { useState, useEffect } from "react";
import { driverApi } from "../services/driverApi";
import { getCompanyClass } from "../config/company";
import {
  formatDateTime,
  formatDate,
  isToday,
  isTomorrow,
} from "../utils/dateUtils";

function DriverJobDetailPage({ bookingRef, onBack, onJobUpdated }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // GPS tracking states
  const [currentStatus, setCurrentStatus] = useState("idle"); // idle, tracking, completed, no_show
  const [trackingInterval, setTrackingInterval] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [canStartTracking, setCanStartTracking] = useState(false);
  const [dateWarning, setDateWarning] = useState(null);

  // Tracking token for unified API
  const [trackingToken, setTrackingToken] = useState(null);

  useEffect(() => {
    loadJobDetail();
  }, [bookingRef]);

  useEffect(() => {
    // Load tracking token when job is loaded
    if (job) {
      loadTrackingToken();
    }
  }, [job]);

  useEffect(() => {
    // Cleanup tracking interval on unmount
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [trackingInterval]);

  const loadJobDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await driverApi.getJobDetail(bookingRef);

      if (result.success) {
        setJob(result.data.job);

        // Set current status based on job status
        if (result.data.job.completion_type === "NO_SHOW") {
          setCurrentStatus("no_show");
        } else if (result.data.job.assignment_status === "completed") {
          setCurrentStatus("completed");
        } else if (result.data.job.assignment_status === "in_progress") {
          setCurrentStatus("tracking");
          startGPSTracking();
        } else {
          setCurrentStatus("idle");
          checkDateRange(result.data.job);
        }
      } else {
        setError(result.error || "Failed to load job");
      }
    } catch (err) {
      setError("Network error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrackingToken = async () => {
    try {
      const result = await driverApi.getTrackingToken(bookingRef);
      if (result.success) {
        setTrackingToken(result.data.token);
        console.log("Tracking token loaded:", result.data.token);
      } else {
        console.error("Failed to load tracking token:", result.error);
      }
    } catch (err) {
      console.error("Error loading tracking token:", err);
    }
  };

  const checkDateRange = (jobData) => {
    if (!jobData.pickup_date) {
      setCanStartTracking(true);
      setDateWarning(null);
      return;
    }

    const pickupDate = new Date(jobData.pickup_date);
    const now = new Date();

    // Calculate allowed time range: 5 hours before pickup to +24 hours after
    const startAllowed = new Date(pickupDate);
    startAllowed.setHours(startAllowed.getHours() - 5); // 5 hours before pickup
    const endAllowed = new Date(pickupDate);
    endAllowed.setHours(endAllowed.getHours() + 24);

    const formatDateTimeThai = (date) => {
      return date.toLocaleString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    if (now < startAllowed) {
      // Too early
      setCanStartTracking(false);
      setDateWarning({
        type: "warning",
        title: "⏰ ยังไม่ถึงเวลาเริ่มงาน",
        message: `งานนี้สามารถเริ่มได้ตั้งแต่\n${formatDateTimeThai(
          startAllowed
        )}\n(5 ชั่วโมงก่อนเวลารับ)`,
      });
    } else if (now > endAllowed) {
      // Too late
      setCanStartTracking(false);
      setDateWarning({
        type: "error",
        title: "⚠️ งานนี้เลยกำหนดแล้ว",
        message: `กำหนดการเดินทาง: ${formatDateTimeThai(
          pickupDate
        )}\nหน้าต่างเวลา: ${formatDateTimeThai(
          startAllowed
        )} - ${formatDateTimeThai(
          endAllowed
        )}\nหากมีปัญหากรุณาติดต่อเจ้าหน้าที่`,
      });
    } else {
      // Within allowed range
      setCanStartTracking(true);
      setDateWarning(null);
    }
  };

  const startGPSTracking = () => {
    sendLocationUpdate();

    // Clear any existing interval
    if (trackingInterval) clearInterval(trackingInterval);

    // Set up new interval (default 30 seconds)
    const interval = setInterval(() => {
      sendLocationUpdate();
    }, 30 * 1000);

    setTrackingInterval(interval);
  };

  const sendLocationUpdate = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => sendLocation(position),
      (error) => console.error("GPS Error:", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const sendLocation = async (position) => {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      status: "BEFORE_PICKUP",
    };

    setCurrentLocation(location);

    try {
      // Send location to Tracking API
      if (trackingToken) {
        await driverApi.sendLocation(trackingToken, location);
        console.log("Location sent to tracking API:", location);
      }
    } catch (err) {
      console.error("Error sending location:", err);
    }
  };

  const handleStartJob = async () => {
    if (!canStartTracking) {
      alert("⏰ ยังไม่สามารถเริ่มงานได้ในขณะนี้ กรุณาตรวจสอบวันที่เริ่มงาน");
      return;
    }

    if (!navigator.geolocation) {
      alert("อุปกรณ์นี้ไม่รองรับ GPS");
      return;
    }

    if (!trackingToken) {
      alert("❌ ไม่สามารถเริ่มงานได้ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    try {
      setActionLoading(true);

      // Get initial location first
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Start job via Tracking API (unified with Staff Link)
          const result = await driverApi.startTracking(trackingToken);

          if (result.success) {
            setCurrentStatus("tracking");
            await sendLocation(position);
            startGPSTracking();
            // Success - UI will update automatically
          } else {
            alert("❌ ไม่สามารถเริ่มงานได้: " + (result.error || ""));
          }
          setActionLoading(false);
        },
        (error) => {
          console.error("GPS Error:", error);
          alert("❌ ไม่สามารถเข้าถึง GPS ได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง");
          setActionLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (err) {
      alert("❌ ไม่สามารถเริ่มงานได้");
      setActionLoading(false);
    }
  };

  const handleCompleteJob = async (
    status = "COMPLETED",
    confirmMessage = "✅ ยืนยันว่างานเสร็จสมบูรณ์แล้วใช่หรือไม่?"
  ) => {
    if (!confirm(confirmMessage)) return;

    if (!trackingToken) {
      alert("❌ ไม่สามารถจบงานได้ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    // Stop tracking
    if (trackingInterval) clearInterval(trackingInterval);

    const finalStatus = status === "NO_SHOW" ? "no_show" : "completed";
    const notes =
      status === "NO_SHOW" ? "Customer no-show" : "Completed by driver";

    try {
      setActionLoading(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Complete job via Tracking API (unified with Staff Link)
          const result = await driverApi.completeTracking(
            trackingToken,
            status,
            position.coords.latitude,
            position.coords.longitude,
            notes
          );

          if (result.success) {
            setCurrentStatus(finalStatus);
            // Success - UI will update automatically to show completed/no-show state
          } else {
            alert("❌ ไม่สามารถจบงานได้: " + (result.error || ""));
          }
          setActionLoading(false);
        },
        async () => {
          // Complete without location
          const result = await driverApi.completeTracking(
            trackingToken,
            status,
            null,
            null,
            notes + " (no final location)"
          );

          if (result.success) {
            setCurrentStatus(finalStatus);
            // Success - UI will update automatically to show completed/no-show state
          } else {
            alert("❌ ไม่สามารถจบงานได้: " + (result.error || ""));
          }
          setActionLoading(false);
        }
      );
    } catch (err) {
      alert("❌ ไม่สามารถจบงานได้");
      setActionLoading(false);
    }
  };

  const handleNoShow = () => {
    handleCompleteJob(
      "NO_SHOW",
      "❌ ยืนยันว่าไม่เจอลูกค้าใช่หรือไม่?\n\nระบบจะแจ้ง Holiday Taxis ว่าลูกค้าไม่มา (No Show)"
    );
  };

  const getStatusBadge = () => {
    if (currentStatus === "idle") {
      return {
        text: "รอเริ่มงาน",
        className:
          "px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800",
      };
    } else if (currentStatus === "tracking") {
      return {
        text: "🔴 กำลังทำงาน",
        className:
          "px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 animate-pulse-custom",
      };
    } else if (currentStatus === "completed") {
      return {
        text: "✅ เสร็จสิ้น",
        className:
          "px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800",
      };
    } else if (currentStatus === "no_show") {
      return {
        text: "❌ No Show",
        className:
          "px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800",
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md w-full">
          <div className="text-red-600 text-center">
            <i className="text-4xl mb-4">⚠️</i>
            <h2 className="text-xl font-semibold mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-700">{error || "ไม่พบข้อมูล"}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50">
      {/* Back Button - Fixed at top */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-md mx-auto px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>กลับ</span>
          </button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4 py-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">🚗 Transfer</h1>
            <span className={statusBadge.className}>{statusBadge.text}</span>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-gray-500">Booking Ref:</p>
            <p className="text-lg font-semibold text-blue-600">
              {job.booking_ref}
            </p>
          </div>
        </div>

        {/* Booking Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            📋 รายละเอียดการจอง
          </h2>
          <div className="space-y-3">
            {/* Passenger Info */}
            <div className="flex items-start gap-3">
              <i className="fas fa-user text-blue-600 mt-1"></i>
              <div>
                <p className="text-sm text-gray-500">ผู้โดยสาร</p>
                <p className="font-medium">{job.passenger_name}</p>
                <p className="text-sm text-gray-600">
                  {job.passenger_phone || "-"}
                </p>
              </div>
            </div>

            {/* Pickup Location */}
            <div className="flex items-start gap-3">
              <i className="fas fa-map-marker-alt text-blue-600 mt-1"></i>
              <div className="flex-1">
                <p className="text-sm text-gray-500">จุดรับ</p>
                <p className="font-medium">
                  {job.pickup_location || "-"}
                </p>
                <div>
                  {job.pickup_date_adjusted && job.pickup_date_original ? (
                    <>
                      <p className="text-sm text-blue-600 line-through">
                        {formatDateTime(job.pickup_date_original)}
                      </p>
                      <p className="text-sm text-orange-600 font-semibold">
                        {formatDateTime(job.pickup_date)}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        <i className="fas fa-clock mr-1"></i>
                        เวลาใหม่
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-blue-600">
                      {formatDateTime(job.pickup_date) || "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dropoff Location */}
            <div className="flex items-start gap-3">
              <i className="fas fa-map-marker-alt text-red-600 mt-1"></i>
              <div>
                <p className="text-sm text-gray-500">จุดส่ง</p>
                <p className="font-medium">
                  {job.dropoff_location || "-"}
                </p>
              </div>
            </div>

            {/* Passengers Count */}
            <div className="flex items-center gap-3">
              <i className="fas fa-users text-blue-600"></i>
              <div>
                <p className="text-sm text-gray-500">จำนวนผู้โดยสาร</p>
                <p className="font-medium">{job.pax_total} คน</p>
              </div>
            </div>

            {/* Flight Info */}
            {(job.flight_no_arrival || job.flight_no_departure) && (
              <div className="flex items-start gap-3">
                <i className="fas fa-plane text-blue-600 mt-1"></i>
                <div>
                  <p className="text-sm text-gray-500">เที่ยวบิน</p>
                  <p className="font-medium">
                    {job.flight_no_arrival || job.flight_no_departure}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Notes Card */}
        {job.assignment_notes && job.assignment_notes.trim() && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-message text-blue-600 text-xl"></i>
              <p className="text-sm text-blue-800 whitespace-pre-wrap flex-1">
                {job.assignment_notes}
              </p>
            </div>
          </div>
        )}

        {/* GPS Status Card */}
        {currentStatus === "tracking" && currentLocation && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <i className="fas fa-satellite-dish text-green-600 text-xl"></i>
              <h3 className="font-semibold text-green-900">GPS กำลังทำงาน</h3>
            </div>
            <div className="text-sm text-green-800 space-y-1">
              <p>📍 Lat: {currentLocation.latitude.toFixed(6)}</p>
              <p>📍 Lng: {currentLocation.longitude.toFixed(6)}</p>
              <p className="text-xs text-green-600 mt-2">
                ส่งตำแหน่งทุก 30 วินาที
              </p>
            </div>
          </div>
        )}

        {/* Date Validation Warning */}
        {dateWarning && (
          <div
            className={`${
              dateWarning.type === "error"
                ? "bg-red-50 border-red-200"
                : "bg-yellow-50 border-yellow-200"
            } border-2 rounded-xl p-4`}
          >
            <div className="flex items-start gap-3">
              <i
                className={`fas fa-exclamation-triangle ${
                  dateWarning.type === "error"
                    ? "text-red-600"
                    : "text-yellow-600"
                } text-xl mt-1`}
              ></i>
              <div className="flex-1">
                <h3
                  className={`font-semibold ${
                    dateWarning.type === "error"
                      ? "text-red-900"
                      : "text-yellow-900"
                  } mb-1`}
                >
                  {dateWarning.title}
                </h3>
                <p
                  className={`text-sm ${
                    dateWarning.type === "error"
                      ? "text-red-800"
                      : "text-yellow-800"
                  } whitespace-pre-wrap`}
                >
                  {dateWarning.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Start Job Button */}
          {currentStatus === "idle" && (
            <button
              onClick={handleStartJob}
              disabled={actionLoading || !canStartTracking}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-play-circle mr-2"></i>
              เริ่มงาน
            </button>
          )}

          {/* Complete and No Show Buttons */}
          {currentStatus === "tracking" && (
            <>
              <button
                onClick={() => handleCompleteJob()}
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-check-circle mr-2"></i>
                เสร็จสิ้นงาน
              </button>

              <button
                onClick={handleNoShow}
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-user-times mr-2"></i>
                ไม่เจอลูกค้า (No Show)
              </button>
            </>
          )}

          {/* Completed State */}
          {currentStatus === "completed" && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
              <i className="fas fa-check-circle text-blue-600 text-5xl mb-3"></i>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">
                งานเสร็จสมบูรณ์!
              </h3>
              <p className="text-blue-700">ขอบคุณสำหรับการให้บริการ</p>
              {job.completed_at && (
                <p className="text-sm text-blue-600 mt-2">
                  เสร็จสิ้นเมื่อ:{" "}
                  {new Date(job.completed_at).toLocaleString("th-TH")}
                </p>
              )}
            </div>
          )}

          {/* No Show State */}
          {currentStatus === "no_show" && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
              <i className="fas fa-user-times text-red-600 text-5xl mb-3"></i>
              <h3 className="text-xl font-semibold text-red-900 mb-2">
                ไม่พบลูกค้า (No Show)
              </h3>
              <p className="text-sm text-red-600 mt-2">
                แจ้งเมื่อ: {new Date().toLocaleString("th-TH")}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>TP Travel</p>
        </div>
      </div>
    </div>
  );
}

export default DriverJobDetailPage;
