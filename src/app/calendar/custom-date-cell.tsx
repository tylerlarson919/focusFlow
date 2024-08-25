import React from "react";
import { DateCellWrapperProps } from "react-big-calendar";
import { AiOutlinePlus } from "react-icons/ai";

interface CustomDateCellWrapperProps extends DateCellWrapperProps {
  onAddTask: (date: Date) => void;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

const CustomDateCellWrapper: React.FC<CustomDateCellWrapperProps> = ({
  value,
  children,
  onAddTask,
  isHovered,
  onHover,
  onLeave,
}) => {

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleMouseEnter = () => onHover();
  const handleMouseLeave = () => onLeave();

  const handleAddTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddTask(value);
  };

  return (
    <div
      className={`rbc-day-bg ${
        isToday(value) ? "bg-blue-100 rounded-full border border-blue-500" : ""
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: "relative" }}
    >
      {children}



      {/* Plus Button */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10, // Ensure it’s on top of other elements
          pointerEvents: "auto", // Make sure button can be clicked
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isHovered && (
          <button
            className="absolute top-1 left-1 text-gray-500"
            onClick={handleAddTaskClick}
            style={{
              borderRadius: "50%",
              padding: "0.5rem",
              zIndex: 1000, // Ensure it's above everything
            }}
          >
            <AiOutlinePlus />
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomDateCellWrapper;
