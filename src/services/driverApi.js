// src/services/driverApi.js - Driver API Service (No Online/Offline)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

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
  async login(username, password) {
    return await apiCall("/auth/driver-login.php", {
      method: "POST",
      body: JSON.stringify({ username, password }),
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

  async startJob(bookingRef) {
    return await apiCall("/driver/start-job.php", {
      method: "POST",
      body: JSON.stringify({ booking_ref: bookingRef }),
    });
  },

  async completeJob(bookingRef) {
    return await apiCall("/driver/complete-job.php", {
      method: "POST",
      body: JSON.stringify({ booking_ref: bookingRef }),
    });
  },

  // Profile
  async getProfile() {
    return await apiCall("/driver/profile.php");
  },
};

export default driverApi;
