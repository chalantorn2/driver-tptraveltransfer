import { useState, useEffect } from "react";
import DriverLoginPage from "./pages/DriverLoginPage";
import DriverJobsPage from "./pages/DriverJobsPage";
import DriverJobDetailPage from "./pages/DriverJobDetailPage";
import DriverProfilePage from "./pages/DriverProfilePage";
import { driverApi } from "./services/driverApi";
import "./App.css";

function App() {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("jobs"); // jobs, detail, profile
  const [selectedJobRef, setSelectedJobRef] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedDriver = localStorage.getItem("driver");

      if (savedDriver) {
        const result = await driverApi.checkAuth();

        if (result.success && result.authenticated) {
          setDriver(result.data.driver);
          localStorage.setItem("driver", JSON.stringify(result.data.driver));
        } else {
          localStorage.removeItem("driver");
          setDriver(null);
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      localStorage.removeItem("driver");
      setDriver(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (driverData) => {
    setDriver(driverData);
    setCurrentPage("jobs");
  };

  const handleLogout = async () => {
    if (!confirm("ออกจากระบบหรือไม่?")) return;

    try {
      await driverApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("driver");
      setDriver(null);
      setCurrentPage("jobs");
    }
  };

  const handleViewDetail = (bookingRef) => {
    setSelectedJobRef(bookingRef);
    setCurrentPage("detail");
  };

  const handleBackToJobs = () => {
    setSelectedJobRef(null);
    setCurrentPage("jobs");
  };

  const handleViewProfile = () => {
    setCurrentPage("profile");
  };

  const handleBackFromProfile = () => {
    setCurrentPage("jobs");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-cyan-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!driver) {
    return <DriverLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Authenticated - show appropriate page
  return (
    <>
      {currentPage === "jobs" && (
        <DriverJobsPage
          driver={driver}
          onLogout={handleLogout}
          onViewDetail={handleViewDetail}
          onViewProfile={handleViewProfile}
        />
      )}

      {currentPage === "detail" && selectedJobRef && (
        <DriverJobDetailPage
          bookingRef={selectedJobRef}
          onBack={handleBackToJobs}
          onJobUpdated={handleBackToJobs}
        />
      )}

      {currentPage === "profile" && (
        <DriverProfilePage
          driver={driver}
          onLogout={handleLogout}
          onBack={handleBackFromProfile}
        />
      )}
    </>
  );
}

export default App;
