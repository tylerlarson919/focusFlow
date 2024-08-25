import React, { useState } from "react";
import CustomDateCellWrapper from "./custom-date-cell";
import { DateCellWrapperProps } from "react-big-calendar";

interface CalendarContainerProps extends DateCellWrapperProps {
  onAddTask: (date: Date) => void;
}

const CalendarContainer: React.FC<CalendarContainerProps> = ({
  value,
  onAddTask,
  ...props
}) => {
  const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);

  const handleMouseEnter = (date: Date) => {
    setHoveredCellId(date.toISOString());
  };

  const handleMouseLeave = () => {
    setHoveredCellId(null);
  };

  return (
    <CustomDateCellWrapper
      value={value}
      onAddTask={onAddTask}
      isHovered={hoveredCellId === value.toISOString()}
      onHover={() => handleMouseEnter(value)}
      onLeave={handleMouseLeave}
      range={[]} // Replace with actual range if needed
      children={props.children} // Pass children if needed
    />
  );
};

export default CalendarContainer;
