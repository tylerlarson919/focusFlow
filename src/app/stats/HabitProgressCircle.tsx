"use client";
import React, { useState, useEffect } from "react";
import { format, startOfWeek, addWeeks, subWeeks, eachDayOfInterval, endOfWeek } from 'date-fns';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { Tooltip } from "@nextui-org/react";

interface HabitProgressCircleProps {
  mainProgress: { date: string; percentage: number }[];
  habitsProgress: { date: string; habits: { name: string; color: string; status: string }[] }[];
  moduleType: "week";
}

const HabitProgressCircle: React.FC<HabitProgressCircleProps> = ({
  mainProgress,
  habitsProgress,
  moduleType,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    if (mainProgress.length > 0) {
      const latestDate = new Date(mainProgress[mainProgress.length - 1].date);
      setCurrentWeekStart(startOfWeek(latestDate, { weekStartsOn: 1 }));
    }
  }, [mainProgress]);

  const handlePrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const getWeekDates = (startDate: Date) => {
    const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const weekDates = getWeekDates(currentWeekStart);

  const getProgressForDate = (date: Date) => {
    const formattedDate = format(date, 'M/d/yyyy');
    return mainProgress.find((progress) => progress.date === formattedDate) || { date: formattedDate, percentage: 0 };
  };

  const getHabitsForDate = (date: Date) => {
    const formattedDate = format(date, 'M/d/yyyy');
    return habitsProgress.find((progress) => progress.date === formattedDate)?.habits || [];
  };

  const radiusHabit = 50;
  const radiusMain = 40;
  const circumferenceHabit = 2 * Math.PI * radiusHabit;
  const circumferenceMain = 2 * Math.PI * radiusMain;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center mb-4">
        <button onClick={handlePrevWeek} className="mr-2">
          <FaArrowLeft />
        </button>
        <h3 className="text-lg font-semibold">
          {format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM d')}
        </h3>
        <button onClick={handleNextWeek} className="ml-2">
          <FaArrowRight />
        </button>
      </div>
      <div className="flex space-x-4">
        {weekDates.map((date) => {
          const progress = getProgressForDate(date);
          const habits = getHabitsForDate(date);

          const taskOffset = circumferenceMain - (progress.percentage / 100) * circumferenceMain;

          

          return (
            <div key={format(date, 'M/d/yyyy')} className="relative flex items-center justify-center w-28 h-28">
              <div className="text-center text-s">
                {format(date, 'EEE,')} <br /> {format(date, 'M/d')}
            </div>

              <svg 
                className="absolute inset-0 m-auto" 
                width={radiusHabit * 2.5} 
                height={radiusHabit * 2.5} 
                viewBox={`0 0 ${radiusHabit * 2.5} ${radiusHabit * 2.5}`} 
                xmlns="http://www.w3.org/2000/svg"
              >
                {habits.map((habit, index) => {
                    const numberOfHabits = habits.length;
                    const gapSize = 12; // Gap size between segments
                    
                    // Calculate segment size based on circumference and number of gaps
                    const totalGapSize = gapSize * numberOfHabits;
                    const availableCircumference = circumferenceHabit - totalGapSize;
                    const sectionSize = availableCircumference / numberOfHabits;

                    // Calculate offset, accounting for gaps
                    const offset = -(index * (sectionSize + gapSize));

                    const strokeColor = habit.status === 'complete' ? habit.color : 'var(--dark3)';

                    return (
                    <Tooltip key={index} content={habit.name}>
                        <circle
                        cx={radiusHabit + gapSize / 2}
                        cy={radiusHabit + gapSize / 2}
                        r={radiusHabit}
                        stroke={strokeColor}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${sectionSize} ${circumferenceHabit - sectionSize}`} // Segment size and remaining length
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.5s ease" }}
                        />
                    </Tooltip>
                    );
                })}
                <circle
                    cx={radiusHabit}
                    cy={radiusHabit}
                    r={radiusMain}
                    stroke="var(--cal-purple)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumferenceMain}
                    strokeDashoffset={taskOffset}
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
                </svg>  







            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HabitProgressCircle;
