import { useState, useEffect } from "react";
import { driverApi } from "../services/driverApi";
import { getCompanyClass } from "../config/company";
import {
  formatDateTime,
  formatDate,
  isToday,
  isTomorrow,
} from "../utils/dateUtils";

function DriverJobsPage({ driver, onLogout, onViewDetail, onViewProfile }) {
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]); // Keep all jobs for counting
  const [counts, setCounts] = useState({});
  const [filter, setFilter] = useState("today"); // Changed default to "today"
  const [selectedDate, setSelectedDate] = useState(""); // For date picker in "all" filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadJobs();
  }, [filter, selectedDate]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await driverApi.getMyJobs("all"); // Always fetch all jobs

      if (result.success) {
        const allJobsData = result.data.jobs;
        let filteredJobs = [...allJobsData];

        // Filter by date on frontend
        if (filter === "today") {
          filteredJobs = filteredJobs.filter(
            (job) => job.pickup_date && isToday(job.pickup_date)
          );
        } else if (filter === "tomorrow") {
          filteredJobs = filteredJobs.filter(
            (job) => job.pickup_date && isTomorrow(job.pickup_date)
          );
        } else if (filter === "all" && selectedDate) {
          // Filter by selected date if provided
          filteredJobs = filteredJobs.filter((job) => {
            if (!job.pickup_date) return false;
            const jobDate = new Date(job.pickup_date)
              .toISOString()
              .split("T")[0];
            return jobDate === selectedDate;
          });
        }
        // "all" without selectedDate shows everything

        // Sort: completed jobs go to bottom
        filteredJobs.sort((a, b) => {
          // Completed jobs go last
          if (
            a.assignment_status === "completed" &&
            b.assignment_status !== "completed"
          )
            return 1;
          if (
            a.assignment_status !== "completed" &&
            b.assignment_status === "completed"
          )
            return -1;

          // Otherwise keep time order (already sorted by API)
          return 0;
        });

        setAllJobs(allJobsData); // Store all jobs for counting
        setJobs(filteredJobs);
        setCounts(result.data.counts);
      } else {
        setError(result.error || "Failed to load jobs");
      }
    } catch (err) {
      setError("Network error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, isNoShow = false) => {
    // If No Show, override with red badge
    if (isNoShow) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          No Show
        </span>
      );
    }

    const badges = {
      assigned: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    const labels = {
      assigned: "งานใหม่",
      in_progress: "กำลังทำ",
      completed: "เสร็จแล้ว",
      cancelled: "ยกเลิก",
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${getCompanyClass("gradient")} text-white shadow-lg`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold">งานของฉัน</h1>
              <p className="text-sm opacity-90">{driver.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onViewProfile}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="โปรไฟล์"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
              <button
                onClick={onLogout}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="ออกจากระบบ"
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter Tabs */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4">
          <div className="flex gap-2 py-3 pb-2">
            {[
              { value: "today", label: "วันนี้", icon: "calendar-day" },
              { value: "tomorrow", label: "พรุ่งนี้", icon: "calendar-plus" },
              { value: "all", label: "ทั้งหมด", icon: "list" },
            ].map((tab) => {
              // Count jobs for this filter from all jobs
              let count = 0;
              if (tab.value === "today") {
                count = allJobs.filter(
                  (job) => job.pickup_date && isToday(job.pickup_date)
                ).length;
              } else if (tab.value === "tomorrow") {
                count = allJobs.filter(
                  (job) => job.pickup_date && isTomorrow(job.pickup_date)
                ).length;
              } else if (tab.value === "all") {
                if (selectedDate) {
                  count = allJobs.filter((job) => {
                    if (!job.pickup_date) return false;
                    const jobDate = new Date(job.pickup_date)
                      .toISOString()
                      .split("T")[0];
                    return jobDate === selectedDate;
                  }).length;
                } else {
                  count = allJobs.length;
                }
              }

              return (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`flex-1 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    filter === tab.value
                      ? `${getCompanyClass("primary")} text-white shadow-md`
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <i className={`fas fa-${tab.icon} text-sm`}></i>
                      <span>{tab.label}</span>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        filter === tab.value ? "text-white/90" : "text-gray-500"
                      }`}
                    >
                      {count} งาน
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Date Picker - Show only when "all" filter is selected */}
          {filter === "all" && (
            <div className="pb-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="date-picker"
                  className="text-sm text-gray-600 flex items-center gap-1.5"
                >
                  <i className="fas fa-calendar text-gray-500"></i>
                  เลือกวันที่:
                </label>
                <input
                  id="date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate("")}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="ล้างการเลือก"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-md mx-auto p-4 space-y-3">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-2">กำลังโหลด...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadJobs}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-gray-500">ไม่มีงาน</p>
          </div>
        )}

        {!loading &&
          !error &&
          jobs.map((job, index) => {
            // Check if time was changed
            const hasTimeChange =
              job.pickup_date_adjusted && job.pickup_date_original;

            // Format pickup time
            const pickupTime = job.pickup_date
              ? new Date(job.pickup_date).toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-";

            const pickupTimeOriginal = hasTimeChange
              ? new Date(job.pickup_date_original).toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null;

            // Full date in Thai with Buddhist Era year (พ.ศ.)
            const fullDate = job.pickup_date
              ? (() => {
                  const date = new Date(job.pickup_date);
                  const thaiWeekdays = [
                    "อา.",
                    "จ.",
                    "อ.",
                    "พ.",
                    "พฤ.",
                    "ศ.",
                    "ส.",
                  ];
                  const thaiMonths = [
                    "ม.ค.",
                    "ก.พ.",
                    "มี.ค.",
                    "เม.ย.",
                    "พ.ค.",
                    "มิ.ย.",
                    "ก.ค.",
                    "ส.ค.",
                    "ก.ย.",
                    "ต.ค.",
                    "พ.ย.",
                    "ธ.ค.",
                  ];
                  const buddhistYear = date.getFullYear() + 543;
                  return `${thaiWeekdays[date.getDay()]} ${date.getDate()} ${
                    thaiMonths[date.getMonth()]
                  } ${buddhistYear}`;
                })()
              : "ยังไม่กำหนด";

            // Determine background color based on completion_type
            const isNoShow = job.completion_type === "NO_SHOW"; // Driver marked as No Show
            const isCompleted =
              job.assignment_status === "completed" && !isNoShow;

            let bgColor = "bg-white";
            if (isNoShow) {
              bgColor = "bg-red-50"; // Red background for No Show (highest priority)
            } else if (isCompleted) {
              bgColor = "bg-green-50"; // Green background for completed
            }

            return (
              <div
                key={job.booking_ref}
                onClick={() => onViewDetail(job.booking_ref)}
                className={`${bgColor} rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-3`}
              >
                {/* Header: ลำดับ + เวลา + Status */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    {/* เลขลำดับงาน */}
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-700 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">
                      {index + 1}
                    </div>

                    {/* เวลาและวันที่ */}
                    <div className="flex-1">
                      {hasTimeChange ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-orange-600">
                            {pickupTime}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {pickupTimeOriginal}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xl font-bold text-gray-900">
                          {pickupTime}
                        </div>
                      )}
                      <div className="text-xs text-gray-600 mt-0.5">
                        {fullDate}
                      </div>
                    </div>
                  </div>

                  {getStatusBadge(job.assignment_status, isNoShow)}
                </div>

                {/* ชื่อผู้โดยสาร + จำนวนคน */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 text-sm truncate pr-2">
                    {job.passenger_name}
                  </span>
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                    <i className="fas fa-users text-xs mr-1"></i>
                    {job.pax_total}
                  </span>
                </div>

                {/* เส้นทาง: จุดรับ → จุดส่ง */}
                <div className="space-y-1">
                  <div className="flex items-start text-xs">
                    <i className="fas fa-circle-dot text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                    <div className="flex-1 text-gray-700">
                      {job.pickup_location || "ไม่ระบุ"}
                      {job.flight_no_arrival && (
                        <span className="text-blue-600 ml-1">
                          ✈ {job.flight_no_arrival}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start text-xs">
                    <i className="fas fa-location-dot text-red-500 mt-1 mr-2 flex-shrink-0"></i>
                    <div className="flex-1 text-gray-700">
                      {job.dropoff_location || "ไม่ระบุ"}
                    </div>
                  </div>
                </div>

                {/* Booking Ref */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                  <span className="text-xs font-mono font-medium text-gray-600">
                    <i className="fas fa-hashtag text-gray-400 mr-1"></i>
                    {job.booking_ref}
                  </span>
                  {job.assignment_status !== "completed" && (
                    <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                      แตะเพื่อเริ่มงาน
                      <i className="fas fa-chevron-right"></i>
                    </span>
                  )}
                  {job.assignment_status === "completed" && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      ดูรายละเอียด
                      <i className="fas fa-chevron-right"></i>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default DriverJobsPage;
