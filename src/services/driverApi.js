// src/services/driverApi.js - Driver API Service (Code-based authentication)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const TRACKING_API_BASE_URL = import.meta.env.VITE_TRACKING_API_BASE_URL || "/api/tracking";

/**
 * Generic API call function
 */
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Important: Send cookies with request
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    // Log for debugging (remove in production)
    console.log(`API ${options.method || "GET"} ${endpoint}:`, {
      status: response.status,
      data,
    });

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return {
      success: false,
      error: error.message || "Network error. Please try again.",
    };
  }
};

/**
 * Driver API Service
 */
export const driverApi = {
  // Authentication
  async login(driverCode) {
    return await apiCall("/auth/driver-login.php", {
      method: "POST",
      body: JSON.stringify({ driver_code: driverCode }),
    });
  },

  async checkAuth() {
    return await apiCall("/auth/driver-check.php");
  },

  async logout() {
    return await apiCall("/auth/driver-logout.php", {
      method: "POST",
    });
  },

  // Jobs Management
  async getMyJobs(status = "all") {
    return await apiCall(`/driver/my-jobs.php?status=${status}`);
  },

  async getJobDetail(bookingRef) {
    return await apiCall(`/driver/job-detail.php?ref=${bookingRef}`);
  },

  async acceptJob(bookingRef) {
    return await apiCall("/driver/accept-job.php", {
      method: "POST",
      body: JSON.stringify({ booking_ref: bookingRef }),
    });
  },

  async startJob(bookingRef, data = {}) {
    return await apiCall("/driver/start-job.php", {
      method: "POST",
      body: JSON.stringify({
        booking_ref: bookingRef,
        ...data
      }),
    });
  },

  async completeJob(bookingRef, data = {}) {
    return await apiCall("/driver/complete-job.php", {
      method: "POST",
      body: JSON.stringify({
        booking_ref: bookingRef,
        ...data
      }),
    });
  },

  // Profile
  async getProfile() {
    return await apiCall("/driver/profile.php");
  },

  // Tracking API Integration (Unified with Staff Link)
  async getTrackingToken(bookingRef) {
    return await apiCall(`/driver/get-tracking-token.php?ref=${bookingRef}`);
  },

  async startTracking(token) {
    // Note: This uses the main tptraveltransfer API
    // In dev: uses Vite proxy (/api/tracking)
    // In production: uses absolute URL (https://www.tptraveltransfer.com/api/tracking)
    // Token-based auth, no need for credentials
    const response = await fetch(`${TRACKING_API_BASE_URL}/start.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    console.log(`API POST ${TRACKING_API_BASE_URL}/start.php:`, { status: response.status, data });
    return data;
  },

  async sendLocation(token, location) {
    // Note: This uses the main tptraveltransfer API
    // In dev: uses Vite proxy (/api/tracking)
    // In production: uses absolute URL (https://www.tptraveltransfer.com/api/tracking)
    // Token-based auth, no need for credentials
    const response = await fetch(`${TRACKING_API_BASE_URL}/location.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, ...location }),
    });
    const data = await response.json();
    return data;
  },

  async completeTracking(token, status = "COMPLETED", latitude = null, longitude = null, notes = "") {
    // Note: This uses the main tptraveltransfer API
    // In dev: uses Vite proxy (/api/tracking)
    // In production: uses absolute URL (https://www.tptraveltransfer.com/api/tracking)
    // Token-based auth, no need for credentials
    const response = await fetch(`${TRACKING_API_BASE_URL}/complete.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        status,
        latitude,
        longitude,
        notes,
      }),
    });
    const data = await response.json();
    console.log(`API POST ${TRACKING_API_BASE_URL}/complete.php:`, { status: response.status, data });
    return data;
  },
};

export default driverApi;
