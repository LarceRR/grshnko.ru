// components/SheduledPostFilter.tsx
import React, { useState } from "react";
import { Input, Select, Button, DatePicker, Space, Modal } from "antd";
import dayjs from "dayjs";
import { searchScheduledPosts } from "../../api/sheduledPosts";
import { STATUS_MAP } from "../../types/sheduledPost";
import { Filter } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const { RangePicker } = DatePicker;

interface SheduledPostFilterProps {
  userId?: string;
  onFilter: (filteredPosts: any[]) => void;
}

const SheduledPostFilter: React.FC<SheduledPostFilterProps> = ({
  userId,
  onFilter,
}) => {
  const [filters, setFilters] = useState({
    chatId: "",
    text: "",
    status: "",
    timestampFrom: "",
    timestampTo: "",
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const queryClient = useQueryClient();

  const handleChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRangeChange = (_: any, dateStrings: [string, string]) => {
    handleChange("timestampFrom", dateStrings[0]);
    handleChange("timestampTo", dateStrings[1]);
  };

  const handleApply = async () => {
    try {
      const filteredPosts = await searchScheduledPosts({
        userId,
        chatId: filters.chatId || undefined,
        text: filters.text || undefined,
        status: filters.status || undefined,
        timestampFrom: filters.timestampFrom || undefined,
        timestampTo: filters.timestampTo || undefined,
      });
      onFilter(filteredPosts);
      setIsModalVisible(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setFilters({
      chatId: "",
      text: "",
      status: "",
      timestampFrom: "",
      timestampTo: "",
    });
    onFilter([]);
    queryClient.invalidateQueries({
      queryKey: ["getScheduledPosts", userId],
    });
    setIsModalVisible(false);
  };

  const renderFilters = () => (
    <Space className="filters">
      <Input
        placeholder="Канал"
        value={filters.chatId}
        onChange={(e) => handleChange("chatId", e.target.value)}
        width={"100%"}
      />
      <Input
        placeholder="Текст"
        value={filters.text}
        onChange={(e) => handleChange("text", e.target.value)}
        width={"100%"}
      />
      <Select
        placeholder="Статус"
        style={{ width: "100%" }}
        value={filters.status || undefined}
        onChange={(val) => handleChange("status", val)}
        allowClear
      >
        {Object.entries(STATUS_MAP).map(([key, { label }]) => (
          <Select.Option key={key} value={key}>
            {label}
          </Select.Option>
        ))}
      </Select>
      <RangePicker
        showTime
        value={
          filters.timestampFrom && filters.timestampTo
            ? [dayjs(filters.timestampFrom), dayjs(filters.timestampTo)]
            : undefined
        }
        onChange={handleRangeChange}
        width={"100%"}
      />
      <Button
        type="primary"
        onClick={handleApply}
        style={{
          backgroundColor: "var(--button-primary-bg)",
          border: "unset",
          color: "white",
          width: "100%",
          marginTop: "24px",
        }}
      >
        Применить
      </Button>
      <Button
        onClick={handleReset}
        style={{
          border: "1px solid var(--button-primary-bg)",
          backgroundColor: "unset",
          width: "100%",
        }}
      >
        Сбросить
      </Button>
    </Space>
  );

  return (
    <>
      {/* Кнопка открытия фильтров */}
      <Button
        type="text"
        onClick={() => setIsModalVisible(true)}
        className="filter-button"
      >
        <span>Фильтры</span>
        <Filter size={24} color="var(--text-color)" />
      </Button>

      <Modal
        title="Фильтры"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {renderFilters()}
      </Modal>
    </>
  );
};

export default SheduledPostFilter;
