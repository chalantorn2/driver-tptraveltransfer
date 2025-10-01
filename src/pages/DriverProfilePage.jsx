import { useState, useEffect } from "react";
import { driverApi } from "../services/driverApi";
import { getCompanyClass, COMPANY_NAME } from "../config/company";
import {
  formatDateTime,
  formatDate,
  isToday,
  isTomorrow,
} from "../utils/dateUtils";

function DriverProfilePage({ driver, onLogout, onBack }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await driverApi.getProfile();

      if (result.success) {
        setProfileData(result.data);
      } else {
        setError(result.error || "Failed to load profile");
      }
    } catch (err) {
      setError("Network error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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

  if (error || !profileData) {
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
            )} text-white rounded-lg font-medium`}
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  const { driver: driverInfo, vehicle, statistics, recent_jobs } = profileData;

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
              <h1 className="text-xl font-bold">โปรไฟล์</h1>
              <p className="text-sm opacity-90">{COMPANY_NAME}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Driver Info Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-center mb-4">
            <div
              className={`w-20 h-20 ${getCompanyClass(
                "gradient"
              )} rounded-full flex items-center justify-center mx-auto mb-3`}
            >
              <svg
                className="w-10 h-10 text-white"
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
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {driverInfo.name}
            </h2>
            <p className="text-gray-600">@{driverInfo.username}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">เบอร์โทร:</span>
              <a
                href={`tel:${driverInfo.phone_number}`}
                className="font-medium text-cyan-600 hover:underline"
              >
                {driverInfo.phone_number}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ใบขับขี่:</span>
              <span className="font-medium text-gray-900">
                {driverInfo.license_number || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">สถานะ:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  driverInfo.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {driverInfo.status === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">เริ่มงานเมื่อ:</span>
              <span className="font-medium text-gray-900">
                {formatDate(driverInfo.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        {vehicle && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
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
              รถประจำตัว
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ทะเบียน:</span>
                <span className="font-bold text-gray-900">
                  {vehicle.registration}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ยี่ห้อ/รุ่น:</span>
                <span className="font-medium text-gray-900">
                  {vehicle.brand} {vehicle.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">สี:</span>
                <span className="font-medium text-gray-900">
                  {vehicle.color}
                </span>
              </div>
              {vehicle.description && (
                <div className="pt-2 border-t">
                  <p className="text-gray-600">{vehicle.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            สถิติการทำงาน
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Today */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="text-xs text-blue-600 font-medium mb-1">
                วันนี้
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {statistics.today.completed || 0}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                จาก {statistics.today.total || 0} งาน
              </div>
            </div>

            {/* Week */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="text-xs text-purple-600 font-medium mb-1">
                สัปดาห์นี้
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {statistics.week.completed || 0}
              </div>
              <div className="text-xs text-purple-700 mt-1">
                จาก {statistics.week.total || 0} งาน
              </div>
            </div>

            {/* Month */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="text-xs text-green-600 font-medium mb-1">
                เดือนนี้
              </div>
              <div className="text-2xl font-bold text-green-900">
                {statistics.month.completed || 0}
              </div>
              <div className="text-xs text-green-700 mt-1">
                จาก {statistics.month.total || 0} งาน
              </div>
            </div>

            {/* All Time */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="text-xs text-orange-600 font-medium mb-1">
                ทั้งหมด
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {statistics.all_time.completed || 0}
              </div>
              <div className="text-xs text-orange-700 mt-1">
                จาก {statistics.all_time.total || 0} งาน
              </div>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        {recent_jobs && recent_jobs.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              งานล่าสุด
            </h3>
            <div className="space-y-2">
              {recent_jobs.map((job) => (
                <div
                  key={job.booking_ref}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">
                      {job.passenger_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(job.pickup_date, "ยังไม่กำหนด")}
                    </div>
                  </div>
                  <div className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                    เสร็จแล้ว
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverProfilePage;
