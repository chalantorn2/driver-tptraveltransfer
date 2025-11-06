// src/pages/DriverLoginPage.jsx - Driver Login UI (Code-based single field)
import { useState, useEffect } from "react";
import { COMPANY_NAME, getCompanyClass } from "../config/company";
import { driverApi } from "../services/driverApi";

function DriverLoginPage({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    driverCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-fill driver code if remembered
  useEffect(() => {
    const savedDriverCode = localStorage.getItem("driver_code");
    if (savedDriverCode) {
      setFormData((prev) => ({ ...prev, driverCode: savedDriverCode }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await driverApi.login(formData.driverCode);

      if (result.success) {
        // Save driver code for next time
        localStorage.setItem("driver_code", formData.driverCode);

        // Save driver data
        localStorage.setItem("driver", JSON.stringify(result.data.driver));

        // Call success callback
        if (onLoginSuccess) {
          onLoginSuccess(result.data.driver);
        }
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <img
            src="/logo.png"
            alt={`${COMPANY_NAME} Logo`}
            className="mx-auto h-16 w-auto"
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Driver Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {COMPANY_NAME} Driver System
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="space-y-4">
              {/* Driver Code */}
              <div>
                <label
                  htmlFor="driverCode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Driver Code
                </label>
                <input
                  id="driverCode"
                  name="driverCode"
                  type="text"
                  required
                  value={formData.driverCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center"
                  placeholder="Enter your driver code (e.g., DRV001)"
                  autoComplete="off"
                />
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Enter the driver code provided by your administrator
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : `${getCompanyClass("primary")} ${getCompanyClass(
                        "primaryHover"
                      )}`
                }`}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-2"></i>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Sign In
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 {COMPANY_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DriverLoginPage;
