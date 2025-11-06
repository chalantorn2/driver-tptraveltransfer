import { useState, useEffect } from "react";
import { driverApi } from "../services/driverApi";
import { getCompanyClass, COMPANY_NAME } from "../config/company";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
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

  const { driver: driverInfo, vehicle } = profileData;

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

      <div className="max-w-md mx-auto p-3 space-y-3">
        {/* Driver Info Card */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center mb-3">
            <div
              className={`w-16 h-16 ${getCompanyClass(
                "gradient"
              )} rounded-full flex items-center justify-center mx-auto mb-2`}
            >
              <svg
                className="w-8 h-8 text-white"
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
            <h2 className="text-xl font-bold text-gray-900">
              {driverInfo.name}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <div
                className={`w-8 h-8 ${getCompanyClass(
                  "primary"
                )} rounded-lg flex items-center justify-center mb-1`}
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div className="text-xs text-gray-500 mb-0.5">เบอร์โทร</div>
              <a
                href={`tel:${driverInfo.phone_number}`}
                className="font-semibold text-gray-900 hover:text-blue-600 text-xs text-center"
              >
                {driverInfo.phone_number}
              </a>
            </div>

            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mb-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div className="text-xs text-gray-500 mb-0.5">ใบขับขี่</div>
              <span className="font-semibold text-gray-900 text-xs text-center">
                {driverInfo.license_number || "-"}
              </span>
            </div>

            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <div
                className={`w-8 h-8 ${
                  driverInfo.status === "active" ? "bg-green-500" : "bg-red-500"
                } rounded-lg flex items-center justify-center mb-1`}
              >
                <svg
                  className="w-4 h-4 text-white"
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
              </div>
              <div className="text-xs text-gray-500 mb-0.5">สถานะ</div>
              <span className="font-semibold text-gray-900 text-xs text-center">
                {driverInfo.status === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        {vehicle && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-600"
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
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm">ทะเบียน</span>
                <span className="font-bold text-gray-900">
                  {vehicle.registration}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm">ยี่ห้อ/รุ่น</span>
                <span className="font-semibold text-gray-900 text-sm">
                  {vehicle.brand} {vehicle.model}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm">สี</span>
                <span className="font-semibold text-gray-900 text-sm">
                  {vehicle.color}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverProfilePage;
