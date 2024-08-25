import React from "react";
import { FaPlus } from "react-icons/fa6";


interface CustomDateCellWrapperProps {
  date: Date; // Required prop
  onAddTask: (date: Date) => void;
}

const CustomDateCellWrapper: React.FC<CustomDateCellWrapperProps> = ({
  date,
  onAddTask,
}) => {
  const handleClick = () => {
    onAddTask(date);
  };

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

  return (
    <div className="relative h-full p-2 w-full custom-border-left">
        {isToday && (
        <div className="current-day-circle"></div>
      )}
      <button
        onClick={handleClick}
        className="custom-add-task-button"
      >
        <FaPlus className="plus-icon"/>
      </button>
    </div>
  );
};

export default CustomDateCellWrapper;
