export type Axis = {
  id: number;
  name: string;
};

export interface TableData {
  dimensions: Axis[];
  dataPoints: DataPoint[];
}

export interface DataPoint {
  name: string;
  annotation: string;
  attributes: Record<Axis["name"], number>;
}

export interface AxisConfigUpdateRequest {
  name: Axis["name"];
  xNegativeCriteriaId: Axis["id"];
  xPositiveCriteriaId: Axis["id"];
  yNegativeCriteriaId: Axis["id"];
  yPositiveCriteriaId: Axis["id"];
}

export type AxisConfigRecord = {
  id: Axis["id"];
  name: Axis["name"];
  axis: Axis;
};
