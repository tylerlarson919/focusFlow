import React from "react";
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
  return (
    <CustomDateCellWrapper
      date={value}
      onAddTask={onAddTask}
      {...props}
    />
  );
};

export default CalendarContainer;
