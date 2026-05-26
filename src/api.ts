import axios from "axios";
import {
  AxisConfigRecord,
  TableData,
  AxisConfigUpdateRequest,
  DataPoint,
  Axis,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Configure axios to include credentials with requests
axios.defaults.withCredentials = true;

// Check if we have a token in local storage and set it in axios headers
const token = localStorage.getItem("authToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export const api = {
  getTableData: async (): Promise<TableData> => {
    const response = await axios.get(`${API_URL}/table`);
    return response.data;
  },

  addColumn: async (column_name: Axis["name"]): Promise<void> => {
    await axios.post(`${API_URL}/column`, { column_name });
  },

  addRow: async (name: string): Promise<void> => {
    await axios.post(`${API_URL}/row`, { name });
  },

  updateRowName: async (
    old_name: DataPoint["name"],
    new_name: string
  ): Promise<void> => {
    await axios.put(`${API_URL}/row/${old_name}/name`, { new_name });
  },

  updateCell: async (
    row_id: string,
    column_name: Axis["name"],
    value: DataPoint["attributes"][Axis["name"]]
  ): Promise<void> => {
    await axios.put(`${API_URL}/cell`, { row_id, column_name, value });
  },

  updateAnnotation: async (
    row_id: string,
    annotation: DataPoint["annotation"]
  ): Promise<void> => {
    await axios.put(`${API_URL}/annotation`, { row_id, annotation });
  },

  deleteColumn: async (column_name: Axis["name"]): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/column/${column_name}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Network error occurred");
    }
  },

  deleteRow: async (row_name: DataPoint["name"]): Promise<void> => {
    await axios.delete(`${API_URL}/row/${row_name}`);
  },

  exportTable: async (): Promise<{
    data: TableData;
    timestamp: string;
    version: string;
  }> => {
    const response = await axios.get(`${API_URL}/export`);
    return response.data;
  },

  importTable: async (data: TableData): Promise<void> => {
    await axios.post(`${API_URL}/import`, { data });
  },

  getAxisSettings: async (): Promise<AxisConfigRecord[]> => {
    const response = await axios.get(`${API_URL}/axis-settings`);
    return response.data.map((record: any) => ({
      id: record.id,
      name: record.name,
      axis: record.settings.xPositive,
    }));
  },

  addAxisSetting: async (
    dto: AxisConfigUpdateRequest
  ): Promise<void> => {
    await axios.post(`${API_URL}/axis-settings`, dto);
  },

  updateAxisSetting: async (
    id: AxisConfigRecord["id"],
    dto: AxisConfigUpdateRequest
  ): Promise<AxisConfigRecord> => {
    const response = await axios.put(`${API_URL}/axis-settings/${id}`, dto);
    return {
      id: response.data.id,
      name: response.data.name,
      axis: response.data.settings.xPositive,
    };
  },

  deleteAxisSetting: async (id: AxisConfigRecord["id"]): Promise<void> => {
    await axios.delete(`${API_URL}/axis-settings/${id}`);
  },
};
