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

  useEffect(() => {
    loadJobDetail();
  }, [bookingRef]);

  const loadJobDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await driverApi.getJobDetail(bookingRef);

      if (result.success) {
        setJob(result.data.job);
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

  const handleStartJob = async () => {
    if (!confirm("เริ่มงานนี้หรือไม่?")) return;

    try {
      setActionLoading(true);
      const result = await driverApi.startJob(bookingRef);

      if (result.success) {
        alert("เริ่มงานสำเร็จ!");
        loadJobDetail();
        if (onJobUpdated) onJobUpdated();
      } else {
        alert(result.error || "ไม่สามารถเริ่มงานได้");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    if (!confirm("ยืนยันเสร็จงานหรือไม่?")) return;

    try {
      setActionLoading(true);
      const result = await driverApi.completeJob(bookingRef);

      if (result.success) {
        alert("บันทึกเสร็จงานสำเร็จ!");
        loadJobDetail();
        if (onJobUpdated) onJobUpdated();
      } else {
        alert(result.error || "ไม่สามารถบันทึกได้");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const info = {
      assigned: {
        color: "bg-blue-100 text-blue-800",
        label: "งานใหม่",
        icon: "📋",
      },
      in_progress: {
        color: "bg-purple-100 text-purple-800",
        label: "กำลังทำ",
        icon: "🚗",
      },
      completed: {
        color: "bg-green-100 text-green-800",
        label: "เสร็จแล้ว",
        icon: "✅",
      },
    };
    return info[status] || info.assigned;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-cyan-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-4">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-4">
            {error || "ไม่พบข้อมูล"}
          </p>
          <button
            onClick={onBack}
            className={`px-6 py-2 ${getCompanyClass(
              "primary"
            )} text-white rounded-lg`}
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(job.assignment_status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${getCompanyClass("gradient")} text-white shadow-lg`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
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
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">รายละเอียดงาน</h1>
              <p className="text-sm opacity-90">{job.booking_ref}</p>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.color}`}
            >
              {statusInfo.icon} {statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Passenger Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-cyan-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            ข้อมูลผู้โดยสาร
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">ชื่อ:</span>
              <span className="font-medium text-gray-900">
                {job.passenger_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">เบอร์โทร:</span>
              <a
                href={`tel:${job.passenger_phone}`}
                className="font-medium text-cyan-600 hover:underline"
              >
                {job.passenger_phone || "-"}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">จำนวน:</span>
              <span className="font-medium text-gray-900">
                {job.pax_total} ท่าน
              </span>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-cyan-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            รายละเอียดการเดินทาง
          </h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">เวลารับ</div>
              <div className="font-medium text-gray-900">
                {formatDate(job.pickup_date, "ยังไม่กำหนด")}
              </div>
            </div>
            <div className="border-l-4 border-green-500 pl-3">
              <div className="text-sm text-gray-600 mb-1">จุดรับ</div>
              <div className="font-medium text-gray-900">
                {job.accommodation_name || job.resort || job.airport || "-"}
              </div>
              {job.accommodation_address1 && (
                <div className="text-sm text-gray-600 mt-1">
                  {job.accommodation_address1}
                </div>
              )}
            </div>
            <div className="border-l-4 border-blue-500 pl-3">
              <div className="text-sm text-gray-600 mb-1">จุดส่ง</div>
              <div className="font-medium text-gray-900">
                {job.airport || job.accommodation_name || "-"}
              </div>
            </div>
            {(job.flight_no_arrival || job.flight_no_departure) && (
              <div>
                <div className="text-sm text-gray-600 mb-1">เที่ยวบิน</div>
                <div className="font-medium text-gray-900">
                  {job.flight_no_arrival || job.flight_no_departure}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Info */}
        {job.registration && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-cyan-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              ข้อมูลรถ
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">ทะเบียน:</span>
                <span className="font-medium text-gray-900">
                  {job.registration}
                </span>
              </div>
              {job.brand && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ยี่ห้อ/รุ่น:</span>
                  <span className="font-medium text-gray-900">
                    {job.brand} {job.model}
                  </span>
                </div>
              )}
              {job.color && (
                <div className="flex justify-between">
                  <span className="text-gray-600">สี:</span>
                  <span className="font-medium text-gray-900">{job.color}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {job.assignment_status === "assigned" && (
            <button
              onClick={handleStartJob}
              disabled={actionLoading}
              className={`w-full py-4 ${getCompanyClass(
                "primary"
              )} ${getCompanyClass(
                "primaryHover"
              )} text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {actionLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  เริ่มงาน
                </>
              )}
            </button>
          )}

          {job.assignment_status === "in_progress" && (
            <button
              onClick={handleCompleteJob}
              disabled={actionLoading}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  เสร็จงาน
                </>
              )}
            </button>
          )}

          {job.assignment_status === "completed" && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
              <svg
                className="w-12 h-12 text-green-600 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-green-800 font-bold">งานเสร็จสมบูรณ์</p>
              <p className="text-sm text-green-600 mt-1">
                ขอบคุณสำหรับการบริการ
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DriverJobDetailPage;
