import { useMemo } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TableData, Axis, DataPoint } from "../types";

interface BarChartProps {
  data: TableData;
  axis: Axis;
  fullScreen?: boolean;
}

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#d84315",
  "#3f51b5",
  "#009688",
  "#9c27b0",
  "#e91e63",
  "#00bcd4",
  "#4caf50",
  "#ff5722",
];

interface ChartRow {
  name: string;
  value: number;
  annotation: string;
}

const isValidNumber = (value: number | undefined): boolean => {
  return value !== undefined && !isNaN(value);
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  axis,
  fullScreen = false,
}) => {
  const chartData = useMemo<ChartRow[]>(() => {
    return data.dataPoints
      .filter((row) => isValidNumber(row.attributes[axis.name]))
      .map((row) => ({
        name: row.name,
        value: row.attributes[axis.name],
        annotation: row.annotation,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, axis]);

  const invalidPoints = useMemo<DataPoint[]>(() => {
    return data.dataPoints.filter(
      (row) => !isValidNumber(row.attributes[axis.name])
    );
  }, [data, axis]);

  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        <p>No valid data points for "{axis.name}"</p>
      </div>
    );
  }

  return (
    <div className={`bar-chart-container ${fullScreen ? "h-full" : ""}`}>
      <ResponsiveContainer width="100%" height={fullScreen ? "90%" : 500}>
        <RechartsBarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 40, bottom: 20, left: 160 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            label={{
              value: axis.name,
              position: "insideBottom",
              offset: -10,
            }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), axis.name]}
            labelFormatter={(label) => `Herb: ${label}`}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} minPointSize={2}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>

      {invalidPoints.length > 0 && (
        <div className="mt-4 mx-6">
          <p className="text-red-600 font-semibold">
            無效的點：部分點由於缺少或無效的數據而無法繪製。
          </p>
          <ul className="list-disc list-inside mt-2">
            {invalidPoints.map((row, index) => (
              <li key={index} className="text-red-500">
                <span className="font-semibold">{row.name}</span>:{" "}
                {axis.name}={row.attributes[axis.name] ?? "N/A"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
