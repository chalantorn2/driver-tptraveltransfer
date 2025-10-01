// src/utils/dateUtils.js - Date Formatting Utilities

/**
 * ตรวจสอบว่า date string ถูกต้องหรือไม่
 */
export const isValidDate = (dateStr) => {
  if (!dateStr || dateStr === "null" || dateStr === "undefined") {
    return false;
  }

  // ตรวจสอบ MySQL zero date
  if (dateStr === "0000-00-00" || dateStr === "0000-00-00 00:00:00") {
    return false;
  }

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

/**
 * Format วันที่แบบเต็ม (วัน เดือน ปี เวลา)
 * @param {string} dateStr - Date string from database
 * @param {string} defaultValue - Default value if invalid (default: "-")
 * @returns {string} Formatted date string
 */
export const formatDateTime = (dateStr, defaultValue = "-") => {
  if (!isValidDate(dateStr)) {
    return defaultValue;
  }

  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (error) {
    console.error("Date formatting error:", error, dateStr);
    return defaultValue;
  }
};

/**
 * Format เฉพาะวันที่ (ไม่มีเวลา)
 * @param {string} dateStr - Date string from database
 * @param {string} defaultValue - Default value if invalid (default: "-")
 * @returns {string} Formatted date string
 */
export const formatDate = (dateStr, defaultValue = "-") => {
  if (!isValidDate(dateStr)) {
    return defaultValue;
  }

  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Date formatting error:", error, dateStr);
    return defaultValue;
  }
};

/**
 * Format เฉพาะเวลา
 * @param {string} dateStr - Date string from database
 * @param {string} defaultValue - Default value if invalid (default: "-")
 * @returns {string} Formatted time string
 */
export const formatTime = (dateStr, defaultValue = "-") => {
  if (!isValidDate(dateStr)) {
    return defaultValue;
  }

  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (error) {
    console.error("Time formatting error:", error, dateStr);
    return defaultValue;
  }
};

/**
 * Format แบบสั้น (วัน เดือน)
 * @param {string} dateStr - Date string from database
 * @param {string} defaultValue - Default value if invalid (default: "-")
 * @returns {string} Formatted date string
 */
export const formatShortDate = (dateStr, defaultValue = "-") => {
  if (!isValidDate(dateStr)) {
    return defaultValue;
  }

  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "short",
    }).format(date);
  } catch (error) {
    console.error("Date formatting error:", error, dateStr);
    return defaultValue;
  }
};

/**
 * คำนวณระยะเวลาจากปัจจุบัน (เช่น "2 ชั่วโมงที่แล้ว")
 * @param {string} dateStr - Date string from database
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateStr) => {
  if (!isValidDate(dateStr)) {
    return "-";
  }

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "เมื่อสักครู่";
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

    return formatDate(dateStr);
  } catch (error) {
    console.error("Relative time error:", error, dateStr);
    return "-";
  }
};

/**
 * ตรวจสอบว่าวันที่อยู่ในอดีตหรือไม่
 * @param {string} dateStr - Date string from database
 * @returns {boolean}
 */
export const isPastDate = (dateStr) => {
  if (!isValidDate(dateStr)) {
    return false;
  }

  try {
    const date = new Date(dateStr);
    return date < new Date();
  } catch (error) {
    return false;
  }
};

/**
 * ตรวจสอบว่าวันที่เป็นวันนี้หรือไม่
 * @param {string} dateStr - Date string from database
 * @returns {boolean}
 */
export const isToday = (dateStr) => {
  if (!isValidDate(dateStr)) {
    return false;
  }

  try {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * ตรวจสอบว่าวันที่เป็นพรุ่งนี้หรือไม่
 * @param {string} dateStr - Date string from database
 * @returns {boolean}
 */
export const isTomorrow = (dateStr) => {
  if (!isValidDate(dateStr)) {
    return false;
  }

  try {
    const date = new Date(dateStr);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * แปลง date string เป็น ISO format สำหรับ input type="datetime-local"
 * @param {string} dateStr - Date string from database
 * @returns {string} ISO formatted string
 */
export const toInputDateTime = (dateStr) => {
  if (!isValidDate(dateStr)) {
    return "";
  }

  try {
    const date = new Date(dateStr);
    // Format: YYYY-MM-DDTHH:mm
    return date.toISOString().slice(0, 16);
  } catch (error) {
    console.error("Date conversion error:", error, dateStr);
    return "";
  }
};

/**
 * Sort array โดยใช้ date field
 * @param {Array} array - Array to sort
 * @param {string} dateField - Field name containing date
 * @param {string} order - 'asc' or 'desc' (default: 'desc')
 * @returns {Array} Sorted array
 */
export const sortByDate = (array, dateField, order = "desc") => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);

    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      return 0;
    }

    return order === "desc" ? dateB - dateA : dateA - dateB;
  });
};
