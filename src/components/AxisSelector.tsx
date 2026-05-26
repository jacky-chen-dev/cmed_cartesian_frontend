import { Axis, TableData } from "../types";
import { Select } from "antd";

interface AxisSelectorProps {
  axis: Axis;
  dimensions: string[];
  onAxisChange: (axis: Axis) => void;
  tableData?: TableData;
}

export const AxisSelector: React.FC<AxisSelectorProps> = ({
  axis,
  dimensions,
  onAxisChange,
  tableData,
}) => {
  const handleChange = (value: string) => {
    let dimensionId = 0;
    if (tableData && tableData.dimensions) {
      const matchingDimension = tableData.dimensions.find(
        (d) => d.name === value
      );
      if (matchingDimension) {
        dimensionId = matchingDimension.id;
      } else {
        console.warn(`Dimension with name ${value} not found in tableData.`);
      }
    }
    onAxisChange({ id: dimensionId, name: value });
  };

  const selectOptions = dimensions?.map((column) => ({
    label: column,
    value: column,
  }));

  return (
    <div className="m-6">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
          Axis / Criteria:
        </label>
        <Select
          className="w-64"
          options={selectOptions}
          value={axis.name}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};
