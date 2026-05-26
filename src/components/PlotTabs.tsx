import { AxisConfigRecord, AxisConfigUpdateRequest, TableData, Axis } from "@/types";
import type { TabsProps } from "antd";
import {
  Button,
  Drawer,
  Form,
  Input,
  Modal,
  Skeleton,
  Tabs,
  Popover,
  message,
  Select,
} from "antd";
import { AxisSelector } from "./AxisSelector";
import { api } from "../api";
import { BarChart } from "./BarChart";
import useSWR from "swr";
import { useSwrDefaultConfig } from "../hooks/useSWRDefaultConfig";
import { useState, useEffect } from "react";

interface PlotTabProps {
  tableData: TableData;
  toggleDrawer: (setting: AxisConfigRecord) => void;
}

function getAxisKey(axisConfigRecord: AxisConfigRecord): string {
  return `axis-${axisConfigRecord.id}`;
}

function getAxisIdFromKey(key: string): number | undefined {
  const match = key.match(/axis-(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

const NULL_ACTIVE_KEY = "0";

export default function PlotTabs({ tableData, toggleDrawer }: PlotTabProps) {
  const {
    data: axisSettings,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<AxisConfigRecord[] | undefined>(
    "axis-settings",
    async () => {
      return await api.getAxisSettings();
    },
    useSwrDefaultConfig
  );
  const [activeKey, setActiveKey] = useState<string>();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [deleteTabKey, setDeleteTabKey] = useState<string | null>(null);
  const [addTabForm] = Form.useForm();
  const [editTabNameForm] = Form.useForm();
  const [editingTabId, setEditingTabId] = useState<number | null>(null);
  const [isTabNamePopoverOpen, setIsTabNamePopoverOpen] =
    useState<boolean>(false);
  const [isCreatingNewTab, setIsCreatingNewTab] = useState<boolean>(false);
  const [isSavingAxisSettings, setIsSavingAxisSettings] =
    useState<boolean>(false);
  const [isUpdatingTabName, setIsUpdatingTabName] = useState<boolean>(false);
  const [isDeletingTab, setIsDeletingTab] = useState<boolean>(false);

  const dimensions = tableData.dimensions?.map((d) => d.name);

  const [editingAxisId, setEditingAxisId] = useState<number | null>(null);
  const [pendingAxis, setPendingAxis] = useState<Axis | null>(null);

  // Duplicate same axis across all 4 backend fields (entity unchanged)
  const buildUpdateRequest = (
    name: string,
    axis: Axis
  ): AxisConfigUpdateRequest => ({
    name,
    xNegativeCriteriaId: axis.id,
    xPositiveCriteriaId: axis.id,
    yNegativeCriteriaId: axis.id,
    yPositiveCriteriaId: axis.id,
  });

  const saveAxisSettings = async (axisId: number, axis: Axis) => {
    const record = axisSettings?.find((a) => a.id === axisId);
    if (record && axis) {
      try {
        setIsSavingAxisSettings(true);
        await api.updateAxisSetting(
          record.id,
          buildUpdateRequest(record.name, axis)
        );

        await mutate();
        setEditingAxisId(null);
        setPendingAxis(null);
      } catch (error) {
        console.error("Failed to save axis settings:", error);
      } finally {
        setIsSavingAxisSettings(false);
      }
    }
  };

  const cancelAxisSettings = () => {
    setEditingAxisId(null);
    setPendingAxis(null);
  };

  const startEditingTabName = (axisId: number) => {
    setEditingTabId(axisId);
    setIsTabNamePopoverOpen(true);
  };

  const handleTabNameUpdate = async (values: { name: string }) => {
    if (editingTabId === null) return;

    const currentSetting = axisSettings?.find(
      (setting) => setting.id === editingTabId
    );
    if (!currentSetting) return;

    if (currentSetting.name === values.name) {
      setEditingTabId(null);
      setIsTabNamePopoverOpen(false);
      return;
    }

    try {
      setIsUpdatingTabName(true);
      await api.updateAxisSetting(
        editingTabId,
        buildUpdateRequest(values.name, currentSetting.axis)
      );

      await mutate();
      setEditingTabId(null);
      setIsTabNamePopoverOpen(false);
    } catch (error) {
      console.error("Failed to update tab name:", error);
    } finally {
      setIsUpdatingTabName(false);
    }
  };

  const cancelTabNameEdit = () => {
    setEditingTabId(null);
    setIsTabNamePopoverOpen(false);
    editTabNameForm.resetFields();
  };

  const handleAxisChange = (
    record: AxisConfigRecord,
    newAxis: Axis
  ) => {
    if (editingAxisId !== record.id) {
      setEditingAxisId(record.id);
    }
    setPendingAxis(newAxis);
  };

  const items: TabsProps["items"] = axisSettings?.map((axisConfigRecord) => {
    const isEditing = editingAxisId === axisConfigRecord.id;
    const displayAxis =
      isEditing && pendingAxis ? pendingAxis : axisConfigRecord.axis;

    const tabLabel = (
      <div className="flex items-center gap-2">
        <span>{axisConfigRecord.name}</span>
        {activeKey === getAxisKey(axisConfigRecord) && (
          <Popover
            open={isTabNamePopoverOpen && editingTabId === axisConfigRecord.id}
            title="Edit Tab Name"
            trigger="click"
            content={
              <Form
                form={editTabNameForm}
                layout="vertical"
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                onFinish={handleTabNameUpdate}
                initialValues={{ name: axisConfigRecord.name }}
                autoComplete="off"
              >
                <Form.Item
                  name="name"
                  rules={[{ required: true, message: "Please enter tab name" }]}
                >
                  <Input placeholder="Enter tab name" />
                </Form.Item>
                <div className="flex justify-end gap-2">
                  <Button size="small" onClick={cancelTabNameEdit}>
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    htmlType="submit"
                    loading={isUpdatingTabName}
                  >
                    Save
                  </Button>
                </div>
              </Form>
            }
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEditingTabName(axisConfigRecord.id);
              }}
              className="ml-2 text-gray-500 hover:text-blue-500 focus:outline-none"
              title="Edit Tab Name"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          </Popover>
        )}
      </div>
    );

    return {
      key: getAxisKey(axisConfigRecord),
      label: tabLabel,
      children: (
        <div>
          <AxisSelector
            axis={displayAxis}
            dimensions={dimensions}
            onAxisChange={(newAxis) =>
              handleAxisChange(axisConfigRecord, newAxis)
            }
            tableData={tableData}
          />

          {isEditing && (
            <div className="flex justify-end gap-2 mt-4 mb-4 mr-6">
              <Button onClick={() => cancelAxisSettings()} danger>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={isSavingAxisSettings}
                onClick={() =>
                  saveAxisSettings(axisConfigRecord.id, pendingAxis!)
                }
              >
                Save Changes
              </Button>
            </div>
          )}

          <div className="mb-24 relative">
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={() => toggleDrawer(axisConfigRecord)}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
                title="Magnify Chart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 8a1 1 0 011-1h1V6a1 1 0 012 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 01-1-1z" />
                  <path
                    fillRule="evenodd"
                    d="M2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm6-4a4 4 0 100 8 4 4 0 000-8z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {isEditing && (
              <div className="absolute top-2 left-2 z-10 bg-yellow-500 text-white px-3 py-1 rounded-full">
                Preview
              </div>
            )}

            <BarChart data={tableData} axis={displayAxis} />
          </div>
        </div>
      ),
    };
  });

  const onEdit = async (
    _targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: "add" | "remove"
  ) => {
    if (action === "add") {
      setIsDrawerOpen(true);
    } else {
      setDeleteTabKey(_targetKey as string);
      setIsDialogOpen(true);
    }
  };

  useEffect(() => {
    if (
      (!activeKey ||
        activeKey === NULL_ACTIVE_KEY ||
        (axisSettings &&
          !axisSettings.some((axis) => getAxisKey(axis) === activeKey))) &&
      axisSettings &&
      axisSettings.length > 0 &&
      !deleteTabKey
    ) {
      setActiveKey(getAxisKey(axisSettings[0]));
    } else if (!axisSettings || axisSettings.length === 0) {
      setActiveKey(NULL_ACTIVE_KEY);
    }
  }, [axisSettings, activeKey, deleteTabKey]);

  const handleAddAxisSetting = async (values: {
    name: string;
    axisName: string;
  }) => {
    const matchingDimension = tableData.dimensions?.find(
      (d) => d.name === values.axisName
    );
    const axisId = matchingDimension?.id ?? 0;

    try {
      setIsCreatingNewTab(true);
      await api.addAxisSetting(buildUpdateRequest(values.name, { id: axisId, name: values.axisName }));
      addTabForm.resetFields();

      setIsDrawerOpen(false);

      const updatedSettings = await mutate();

      if (updatedSettings && updatedSettings.length > 0) {
        const newSetting = updatedSettings.find(
          (setting) => setting.name === values.name
        );
        if (newSetting) {
          setActiveKey(getAxisKey(newSetting));
        }
      }
    } catch (error) {
      message.error(`Failed to add new axis setting: ${JSON.stringify(error)}`);
    } finally {
      setIsCreatingNewTab(false);
    }
  };

  return (
    <Skeleton loading={isLoading || isValidating}>
      <Tabs
        className="m-6"
        activeKey={activeKey}
        onChange={(activeKey) => {
          setActiveKey(activeKey ?? NULL_ACTIVE_KEY);
          setEditingTabId(null);
          setIsTabNamePopoverOpen(false);
          const axisId = getAxisIdFromKey(activeKey);
          const axisSetting = axisSettings?.find(
            (setting) => setting.id === axisId
          );
          if (axisSetting) {
            editTabNameForm.setFieldsValue({ name: axisSetting.name });
          } else {
            editTabNameForm.resetFields();
          }
        }}
        items={items}
        onEdit={onEdit}
        type="editable-card"
      />

      <Modal
        open={isDialogOpen}
        onCancel={() => {
          setIsDialogOpen(false);
          setDeleteTabKey(null);
        }}
        closable
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
        confirmLoading={isDeletingTab}
        onOk={async () => {
          const axisId = getAxisIdFromKey(deleteTabKey ?? "");
          if (axisId) {
            try {
              setIsDeletingTab(true);
              await api.deleteAxisSetting(axisId);
              if (activeKey === deleteTabKey) {
                if (axisSettings && axisSettings.length > 1) {
                  const deletedIndex = axisSettings.findIndex(
                    (axis) => getAxisKey(axis) === deleteTabKey
                  );
                  const newActiveIndex = Math.max(0, deletedIndex - 1);
                  setActiveKey(getAxisKey(axisSettings[newActiveIndex]));
                }
              }
              message.success("Axis setting deleted successfully");

              setDeleteTabKey(null);
              setIsDialogOpen(false);
              await mutate();
            } catch (error) {
              console.error("Failed to delete axis setting:", error);
              message.error("Failed to delete axis setting");
            } finally {
              setIsDeletingTab(false);
            }
          } else {
            setDeleteTabKey(null);
            setIsDialogOpen(false);
          }
        }}
      >
        <p>Are you sure you want to delete this axis setting?</p>
      </Modal>

      {isDrawerOpen && (
        <Drawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Add New Axis Setting"
          width={420}
        >
          <Form
            form={addTabForm}
            name="addAxisSetting"
            layout="vertical"
            onFinish={handleAddAxisSetting}
            autoComplete="off"
            initialValues={{
              name: "",
              axisName: dimensions?.[0] || "",
            }}
          >
            <Form.Item
              label="Tab Name"
              name="name"
              rules={[{ required: true, message: "Please input the tab name" }]}
            >
              <Input placeholder="Enter tab name" />
            </Form.Item>

            <Form.Item
              label="Axis / Criteria"
              name="axisName"
              rules={[
                { required: true, message: "Please select an axis criteria" },
              ]}
            >
              <Select
                options={dimensions?.map((d) => ({ label: d, value: d }))}
                placeholder="Select a criteria"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={isCreatingNewTab}
              >
                Create Axis Setting
              </Button>
            </Form.Item>
          </Form>
        </Drawer>
      )}
    </Skeleton>
  );
}
