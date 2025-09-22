import React, { useState } from "react";
import { Modal } from "antd";

interface TableTextProps {
  text: string;
}

const TableText: React.FC<TableTextProps> = ({ text }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const truncatedText = text.length > 14 ? text.slice(0, 14) + "..." : text;

  const handleClick = () => {
    if (text.length > 14) {
      setIsModalVisible(true);
    }
  };

  return (
    <>
      <div
        className="table-text"
        onClick={handleClick}
        style={{ cursor: text.length > 14 ? "pointer" : "default" }}
      >
        {truncatedText}
      </div>

      <Modal
        open={isModalVisible}
        title="Полный текст"
        centered
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <p>{text}</p>
      </Modal>
    </>
  );
};

export default TableText;
