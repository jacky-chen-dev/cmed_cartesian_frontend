import { useState, useEffect } from "react";
import { AxisConfigRecord } from "./types";
import { useAuth } from "./AuthContext";
import useTableData from "./hooks/useTableData";
import { DataTable } from "./components/DataTable";
import { CartesianPlot } from "./components/CartesianPlot";
import PlotTabs from "./components/PlotTabs";

function App() {
  const { logout } = useAuth();
  const {
    tableData,
    isTableDataLoading,
    isTableDataRefreshing,
    refreshTableData,
    tableDataError,
  } = useTableData();
  const [focusTabRecord, setFocusTabRecord] = useState<AxisConfigRecord>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Toggle full-screen drawer
  const toggleDrawer = (record: AxisConfigRecord) => {
    setFocusTabRecord((prev) => {
      return prev ? undefined : record;
    });
    setIsDrawerOpen(!isDrawerOpen);

    if (isDrawerOpen) {
      // prevent scrolling when the drawer is open
      document.body.style.overflow = "auto";
    } else {
      document.body.style.overflow = "hidden";
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        setFocusTabRecord(undefined);
        setIsDrawerOpen(false);
        document.body.style.overflow = "auto";
      }
    };

    // Add event listener when the drawer is open
    if (isDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">CMED Cartesian Plot</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {import.meta.env.VITE_NICKNAME || "admin"}</span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      {tableDataError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-500 rounded text-red-700">
          {tableDataError}
        </div>
      )}

      {isTableDataLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div>
          <div className="mb-5">
            <DataTable data={tableData} onDataChange={refreshTableData} isDataRefreshing={isTableDataRefreshing} />
          </div>

          <PlotTabs tableData={tableData} toggleDrawer={toggleDrawer} />
        </div>
      )}

      {/* Full-screen drawer for the magnified plot */}
      {isDrawerOpen && focusTabRecord && (
        <div className="fixed inset-0 bg-white bg-opacity-100 z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              Magnified Cartesian Plot
            </h2>
            <button
              onClick={() => toggleDrawer(focusTabRecord)}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
            >
              Close
            </button>
          </div>
          <div className="flex-1 p-4">
            <div className="w-full h-full">
              <CartesianPlot
                data={tableData}
                settings={focusTabRecord.settings}
                fullScreen={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
