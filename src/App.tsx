import { useState, useEffect } from "react";
import { AxisConfigRecord } from "./types";
import { useAuth } from "./AuthContext";
import useTableData from "./hooks/useTableData";
import { DataTable } from "./components/DataTable";
import { BarChart } from "./components/BarChart";
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

  const toggleDrawer = (record: AxisConfigRecord) => {
    setFocusTabRecord((prev) => {
      return prev ? undefined : record;
    });
    setIsDrawerOpen(!isDrawerOpen);

    if (isDrawerOpen) {
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

    if (isDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">CMED Bar Chart</h1>
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

      {isDrawerOpen && focusTabRecord && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center bg-gray-100 border-b">
            <h2 className="text-xl font-bold">{focusTabRecord.name}</h2>
            <button
              onClick={() => toggleDrawer(focusTabRecord)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
            >
              Close
            </button>
          </div>
          <div className="flex-1 p-4">
            <BarChart
              data={tableData}
              axis={focusTabRecord.axis}
              fullScreen={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
