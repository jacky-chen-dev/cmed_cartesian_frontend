import { useState, useRef } from "react";
import { Axis, DataPoint, TableData } from "../types";
import { api } from "../api";
import useMessage from "antd/es/message/useMessage";
import { message, Button } from "antd";
import useChangeStack from "../hooks/useChangeStack";
import { UndoOutlined, RedoOutlined } from "@ant-design/icons";

interface DataTableProps {
  data: TableData;
  onDataChange: () => void;
  isDataRefreshing?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  onDataChange,
  isDataRefreshing,
}) => {
  const [messageApi, contextHolder] = useMessage();
  const [newColumnName, setNewColumnName] = useState("");
  const [newRowName, setNewRowName] = useState("");
  const [editCellInfo, setEditCellInfo] = useState<{
    rowName: DataPoint["name"];
    columnName: Axis["name"];
    value: string | number;
  } | null>(null);
  const [editAnnotationInfo, setEditAnnotationInfo] = useState<{
    rowName: DataPoint["name"];
    value: DataPoint["annotation"];
  } | null>(null);
  const [editRowNameInfo, setEditRowNameInfo] = useState<{
    rowName: DataPoint["name"];
    value: string;
  } | null>(null);
  const [deleteColumnConfirm, setDeleteColumnConfirm] = useState<
    Axis["name"] | null
  >(null);
  const [deleteRowConfirm, setDeleteRowConfirm] = useState<
    DataPoint["name"] | null
  >(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading states for buttons that trigger API calls
  const [isAddingColumn, setIsAddingColumn] = useState<boolean>(false);
  const [isAddingRow, setIsAddingRow] = useState<boolean>(false);
  const [isDeletingColumn, setIsDeletingColumn] = useState<boolean>(false);
  const [isDeletingRow, setIsDeletingRow] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isUpdatingCell, setIsUpdatingCell] = useState<boolean>(false);
  const [isUpdatingAnnotation, setIsUpdatingAnnotation] =
    useState<boolean>(false);
  const [isUpdatingRowName, setIsUpdatingRowName] = useState<boolean>(false);
  const [isUndoing, setIsUndoing] = useState<boolean>(false);
  const [isRedoing, setIsRedoing] = useState<boolean>(false);

  const { pushChange, undo, redo, canUndo, canRedo } = useChangeStack();

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;
    if (data.dimensions.map((axis) => axis.name).includes(newColumnName)) {
      messageApi.error("已存在相同名稱的欄位。請選擇另一個名稱。");
      return;
    }

    try {
      setIsAddingColumn(true);
      await api.addColumn(newColumnName);
      setNewColumnName("");
      onDataChange();
    } catch (error) {
      console.error("Error adding column:", error);
    } finally {
      setIsAddingColumn(false);
    }
  };

  const handleAddRow = async () => {
    if (!newRowName.trim()) return;
    if (data.dataPoints.some((row) => row.name === newRowName)) {
      messageApi.error("已存在相同名稱的欄位。請選擇另一個名稱。");
      return;
    }

    try {
      setIsAddingRow(true);
      await api.addRow(newRowName);
      setNewRowName("");
      onDataChange();
    } catch (error) {
      console.error("Error adding row:", error);
    } finally {
      setIsAddingRow(false);
    }
  };

  const handleCellClick = (
    rowName: DataPoint["name"],
    columnName: Axis["name"],
    value: DataPoint["attributes"][Axis["name"]]
  ) => {
    setEditCellInfo({ rowName, columnName, value: value.toString() });
    setEditAnnotationInfo(null); // Close any open annotation editor
  };

  const handleCellUpdate = async () => {
    if (!editCellInfo) return;

    // Get the current value from the data structure for comparison
    const currentRow = data.dataPoints.find(
      (row) => row.name === editCellInfo.rowName
    );
    const currentValue = currentRow?.attributes[editCellInfo.columnName] || 0;

    // Convert the editCellInfo.value to a number or use 0 if empty/null
    const newValue =
      editCellInfo.value === "" ||
      editCellInfo.value === null ||
      editCellInfo.value === undefined
        ? 0
        : Number(editCellInfo.value);

    // Only update if the value has actually changed
    if (newValue !== currentValue) {
      try {
        setIsUpdatingCell(true);
        pushChange({
          type: "cell",
          rowName: editCellInfo.rowName,
          columnName: editCellInfo.columnName,
          previousValue: currentValue,
          nextValue: newValue,
        });
        await api.updateCell(
          editCellInfo.rowName,
          editCellInfo.columnName,
          newValue
        );
        onDataChange();
      } catch (error) {
        console.error("Error updating cell:", error);
      } finally {
        setIsUpdatingCell(false);
      }
    }

    // Reset edit cell info regardless of whether we updated
    setEditCellInfo(null);
  };

  const handleAnnotationClick = (rowName: string, value: string) => {
    setEditAnnotationInfo({ rowName, value });
    setEditCellInfo(null); // Close any open cell editor
  };

  const handleAnnotationUpdate = async () => {
    if (!editAnnotationInfo) return;

    const currentRow = data.dataPoints.find(
      (row) => row.name === editAnnotationInfo.rowName
    );
    const currentValue = currentRow?.annotation || "";

    if (editAnnotationInfo.value !== currentValue) {
      if (editAnnotationInfo.value === "") {
        const confirm = window.confirm("您確定要將此單元格清空嗎？");
        if (!confirm) {
          setEditAnnotationInfo(null);
          return;
        }
      }

      try {
        setIsUpdatingAnnotation(true);
        pushChange({
          type: "annotation",
          rowName: editAnnotationInfo.rowName,
          previousAnnotation: currentValue,
          nextAnnotation: editAnnotationInfo.value,
        });
        await api.updateAnnotation(
          editAnnotationInfo.rowName,
          editAnnotationInfo.value
        );
        setEditAnnotationInfo(null);
        onDataChange();
      } catch (error) {
        console.error("Error updating annotation:", error);
      } finally {
        setIsUpdatingAnnotation(false);
      }
    } else {
      setEditAnnotationInfo(null);
    }
  };

  const handleRowNameClick = (rowName: string, value: string) => {
    setEditRowNameInfo({ rowName, value });
    setEditCellInfo(null); // Close any open cell editor
  };

  const handleRowNameUpdate = async () => {
    if (!editRowNameInfo) return;

    const currentRow = data.dataPoints.find(
      (row) => row.name === editRowNameInfo.rowName
    );
    const currentValue = currentRow?.name || "";

    if (editRowNameInfo.value !== currentValue) {
      if (editRowNameInfo.value === "") {
        const confirm = window.confirm("您確定要將此單元格清空嗎？");
        if (!confirm) {
          setEditRowNameInfo(null);
          return;
        }
      }

      try {
        setIsUpdatingRowName(true);
        pushChange({
          type: "rowName",
          rowName: editRowNameInfo.rowName,
          previousRowName: currentValue,
          nextRowName: editRowNameInfo.value,
        });
        await api.updateRowName(editRowNameInfo.rowName, editRowNameInfo.value);
        setEditRowNameInfo(null);
        onDataChange();
      } catch (error) {
        console.error("Error updating row name:", error);
      } finally {
        setIsUpdatingRowName(false);
      }
    } else {
      setEditRowNameInfo(null);
    }
  };

  const handleDeleteColumnClick = (columnName: string) => {
    setDeleteColumnConfirm(columnName);
  };

  const handleDeleteColumnCancel = () => {
    setDeleteColumnConfirm(null);
  };

  const handleDeleteColumnConfirm = async () => {
    if (!deleteColumnConfirm) return;

    try {
      setIsDeletingColumn(true);
      await api.deleteColumn(deleteColumnConfirm);
      setDeleteColumnConfirm(null);
      onDataChange();
    } catch (error) {
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      message.error(`錯誤: ${errorMessage}`);
    } finally {
      setIsDeletingColumn(false);
    }
  };

  const handleDeleteRowClick = (rowName: string) => {
    setDeleteRowConfirm(rowName);
  };

  const handleDeleteRowCancel = () => {
    setDeleteRowConfirm(null);
  };

  const handleDeleteRowConfirm = async () => {
    if (!deleteRowConfirm) return;

    try {
      setIsDeletingRow(true);
      await api.deleteRow(deleteRowConfirm);
      setDeleteRowConfirm(null);
      onDataChange();
    } catch (error) {
      console.error("Error deleting row:", error);
    } finally {
      setIsDeletingRow(false);
    }
  };

  const handleExportTable = async () => {
    try {
      setIsExporting(true);
      const exportData = await api.exportTable();

      // Create a file to download
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      // Create download link and trigger it
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cartesian-data-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting table:", error);
      messageApi.error("匯出數據失敗。請重試。");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportTable = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    setImportError(null);

    if (!file) return;

    try {
      setIsImporting(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content);

          // Validate data structure
          if (
            !importData.data ||
            !importData.data.columns ||
            !importData.data.rows
          ) {
            setImportError("檔案格式無效。請使用有效的匯出檔案。");
            setIsImporting(false);
            return;
          }

          // Confirm before importing
          if (
            window.confirm(
              "匯入將會將數據與現有表格合併。相同行/欄名稱的新數據將覆蓋現有數據。是否繼續？"
            )
          ) {
            await api.importTable(importData.data);
            onDataChange();
            message.success("數據已成功匯入並合併！");
          }
        } catch (error) {
          console.error("Error parsing import file:", error);
          setImportError("無法解析匯入檔案。請確保它是有效的 JSON 檔案。");
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error reading import file:", error);
      setImportError("無法讀取匯入檔案。");
      setIsImporting(false);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative">
      {isDataRefreshing && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div className="overflow-x-auto">
        {contextHolder}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold mb-4">Data Table</h2>
          <div className="flex space-x-2">
            <Button
              onClick={handleExportTable}
              loading={isExporting}
              className="text-sm"
            >
              Export Table
            </Button>
            <Button
              onClick={handleImportClick}
              loading={isImporting}
              className="text-sm"
            >
              Import Table
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportTable}
              accept=".json"
              disabled={isImporting}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {deleteColumnConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">確認刪除</h3>
            <p className="mb-4">
              {`您確定要刪除欄位「${deleteColumnConfirm}
              」嗎？此操作無法撤銷，並會刪除此欄位中的所有數據。`}
            </p>
            <div className="flex justify-end space-x-2">
              <Button onClick={handleDeleteColumnCancel}>取消</Button>
              <Button
                onClick={handleDeleteColumnConfirm}
                loading={isDeletingColumn}
                danger
                type="primary"
              >
                刪除
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteRowConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">確認刪除</h3>
            <p className="mb-4">
              {`您確定要刪除行「${deleteRowConfirm}
              」嗎？此操作無法撤銷，並會刪除此行中的所有數據。`}
            </p>
            <div className="flex justify-end space-x-2">
              <Button onClick={handleDeleteRowCancel}>取消</Button>
              <Button
                onClick={handleDeleteRowConfirm}
                loading={isDeletingRow}
                danger
                type="primary"
              >
                刪除
              </Button>
            </div>
          </div>
        </div>
      )}

      {importError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{importError}</p>
        </div>
      )}

      <div className="flex space-x-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            placeholder="New column name"
            className="p-2 border rounded w-full"
          />
        </div>
        <Button
          onClick={handleAddColumn}
          loading={isAddingColumn}
          type="primary"
        >
          Add Column
        </Button>
      </div>

      <div className="flex space-x-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={newRowName}
            onChange={(e) => setNewRowName(e.target.value)}
            placeholder="New row name"
            className="p-2 border rounded w-full mb-2"
          />
        </div>
        <Button
          onClick={handleAddRow}
          loading={isAddingRow}
          type="primary"
          style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
        >
          Add Row
        </Button>
      </div>

      <div className="w-full flex justify-end items-center mb-2 gap-2">
        <Button
          icon={<UndoOutlined />}
          disabled={!canUndo || isDataRefreshing || isUndoing || isRedoing}
          loading={isUndoing}
          onClick={async () => {
            try {
              setIsUndoing(true);
              const lastChange = undo();
              if (lastChange) {
                if (lastChange.type === "cell" && lastChange.columnName) {
                  await api.updateCell(
                    lastChange.rowName,
                    lastChange.columnName,
                    lastChange.previousValue ?? 0
                  );
                } else if (lastChange.type === "annotation") {
                  await api.updateAnnotation(
                    lastChange.rowName,
                    lastChange.previousAnnotation ?? ""
                  );
                } else if (lastChange.type === "rowName") {
                  const currentRowName =
                    lastChange.nextRowName ?? lastChange.rowName;
                  await api.updateRowName(
                    currentRowName,
                    lastChange.previousRowName ?? ""
                  );
                }
                onDataChange();
              }
            } catch (error) {
              console.error("Error in undo operation:", error);
              messageApi.error("撤銷操作失敗。請重試。");
            } finally {
              setIsUndoing(false);
            }
          }}
        >
          Undo
        </Button>
        <Button
          icon={<RedoOutlined />}
          disabled={!canRedo || isDataRefreshing || isUndoing || isRedoing}
          loading={isRedoing}
          onClick={async () => {
            try {
              setIsRedoing(true);
              const lastRedo = redo();
              if (lastRedo) {
                if (lastRedo.type === "cell" && lastRedo.columnName) {
                  await api.updateCell(
                    lastRedo.rowName,
                    lastRedo.columnName,
                    lastRedo.nextValue ?? 0
                  );
                } else if (lastRedo.type === "annotation") {
                  await api.updateAnnotation(
                    lastRedo.rowName,
                    lastRedo.nextAnnotation ?? ""
                  );
                } else if (lastRedo.type === "rowName") {
                  const currentRowName =
                    lastRedo.previousRowName ?? lastRedo.rowName;
                  await api.updateRowName(
                    currentRowName,
                    lastRedo.nextRowName ?? ""
                  );
                }
                onDataChange();
              }
            } catch (error) {
              console.error("Error in redo operation:", error);
              messageApi.error("重做操作失敗。請重試。");
            } finally {
              setIsRedoing(false);
            }
          }}
        >
          Redo
        </Button>
      </div>
      <table className="data-table w-full border-collapse">
        <thead>
          <tr>
            <th className="w-[150px] min-w-[150px]">Name</th>
            <th className="w-[200px] min-w-[200px]">Annotation</th>
            {data.dimensions?.map((column) => (
              <th
                key={column.name}
                className="relative group w-[120px] min-w-[120px]"
              >
                {column.name}
                <button
                  onClick={() => handleDeleteColumnClick(column.name)}
                  className="absolute top-0 right-0 text-xs text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete column"
                >
                  ×
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.dataPoints?.map((row) => (
            <tr key={row.name}>
              <td
                onClick={() => handleRowNameClick(row.name, row.name)}
                className="relative group cursor-pointer p-2 h-[42px]"
              >
                {editRowNameInfo && editRowNameInfo.rowName === row.name ? (
                  <div className="flex absolute inset-0 p-1">
                    <input
                      type="text"
                      value={editRowNameInfo?.value ?? ""}
                      onChange={(e) =>
                        setEditRowNameInfo({
                          ...editRowNameInfo,
                          value: e.target.value,
                        })
                      }
                      autoFocus
                      className="p-1 border rounded flex-1 w-full"
                      disabled={isUpdatingRowName}
                      onBlur={handleRowNameUpdate}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRowNameUpdate();
                        }
                      }}
                    />
                  </div>
                ) : isUpdatingRowName ? (
                  <div className="truncate opacity-50">
                    <div className="animate-pulse">...</div>
                  </div>
                ) : (
                  <div className="truncate">{row.name || "-"}</div>
                )}
                <button
                  onClick={() => handleDeleteRowClick(row.name)}
                  className="absolute top-0 right-0 text-xs text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete row"
                >
                  ×
                </button>
              </td>
              <td
                onClick={() => handleAnnotationClick(row.name, row.annotation)}
                className="cursor-pointer p-2 h-[42px]"
              >
                {editAnnotationInfo &&
                editAnnotationInfo.rowName === row.name ? (
                  <textarea
                    value={editAnnotationInfo?.value ?? ""}
                    onChange={(e) =>
                      setEditAnnotationInfo({
                        ...editAnnotationInfo,
                        value: e.target.value,
                      })
                    }
                    autoFocus
                    className="p-1 border rounded w-full"
                    disabled={isUpdatingAnnotation}
                    onBlur={handleAnnotationUpdate}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAnnotationUpdate();
                      }
                    }}
                  />
                ) : isUpdatingAnnotation ? (
                  <div className="text-wrap opacity-50">
                    <div className="animate-pulse">...</div>
                  </div>
                ) : (
                  <div className="text-wrap">{row.annotation || ""}</div>
                )}
              </td>
              {data.dimensions?.map((column) => (
                <td
                  key={`${row.name}-${column.name}`}
                  onClick={() =>
                    handleCellClick(
                      row.name,
                      column.name,
                      row.attributes[column.name] || 0
                    )
                  }
                  className="cursor-pointer p-2 h-[42px] relative"
                >
                  {editCellInfo &&
                  editCellInfo.rowName === row.name &&
                  editCellInfo.columnName === column.name ? (
                    <div className="flex">
                      <input
                        type="number"
                        value={editCellInfo?.value ?? ""}
                        onChange={(e) =>
                          setEditCellInfo({
                            ...editCellInfo,
                            value: e.target.value,
                          })
                        }
                        autoFocus
                        className="p-1 border rounded w-full"
                        disabled={isUpdatingCell}
                        onBlur={handleCellUpdate}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCellUpdate();
                          }
                        }}
                      />
                    </div>
                  ) : isUpdatingCell ? (
                    <div className="truncate opacity-50">
                      <div className="animate-pulse">...</div>
                    </div>
                  ) : (
                    <div className="truncate">
                      {row.attributes[column.name] || 0}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
