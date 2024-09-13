"use client";
import React, { useState, useEffect } from "react";
import { format, startOfWeek, addWeeks, subWeeks, eachDayOfInterval, endOfWeek, startOfDay, addDays, subDays } from 'date-fns';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { Tooltip } from "@nextui-org/react";
import Styles from './page.module.css';


interface HabitProgressCircleProps {
  mainProgress: { date: string; percentage: number }[];
  habitsProgress: { date: string; habits: { name: string; color: string; status: string }[] }[];
  moduleType: "week" | "day";
}

const HabitProgressCircle: React.FC<HabitProgressCircleProps> = ({
  mainProgress,
  habitsProgress,
  moduleType,
}) => {
  const getUTC4Date = () => {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() / 60; // Get current UTC offset in hours
    const utc4Offset = +4; // UTC-4
    const difference = utcOffset - utc4Offset; 
  
    
    now.setHours(now.getHours() + difference); // Adjust the current time to UTC-4
    return now;
  };
  
  const [currentDate, setCurrentDate] = useState(() => 
    moduleType === "week" 
      ? startOfWeek(getUTC4Date(), { weekStartsOn: 1 }) 
      : startOfDay(getUTC4Date())
  );

  useEffect(() => {
    if (mainProgress.length > 0) {
      const latestDate = new Date(mainProgress[mainProgress.length - 1].date);
      
      // Check if the latest date is different from the current date before updating
      const formattedLatestDate = format(latestDate, 'M/d/yyyy');

      const formattedCurrentDate = format(currentDate, 'M/d/yyyy');

      if (formattedLatestDate !== formattedCurrentDate) {
        setCurrentDate(moduleType === "week" ? startOfWeek(currentDate, { weekStartsOn: 1 }) : currentDate);
      }
    }
  }, [mainProgress, moduleType]);
  

  const handlePrev = () => {
    if (moduleType === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (moduleType === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const getWeekDates = (startDate: Date) => {
    const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const weekDates = getWeekDates(currentDate);

  const getProgressForDate = (date: Date) => {
    const formattedDate = format(date, 'M/d/yyyy'); // Ensure format matches the stored date format
    return mainProgress.find((progress) => progress.date === formattedDate) || { date: formattedDate, percentage: 0 };
  };
  
  const getHabitsForDate = (date: Date) => {
    const formattedDate = format(date, 'M/d/yyyy'); // Ensure format matches the stored date format
    return habitsProgress.find((progress) => progress.date === formattedDate)?.habits || [];
  };
  

  const radiusHabit = 60;
  const radiusMain = 45;
  const circumferenceHabit = 2 * Math.PI * radiusHabit;
  const circumferenceMain = 2 * Math.PI * radiusMain;

  return (
    <div className="flex flex-col items-center w-full h-full gap-4 pt-4">
      {moduleType === "week" && (
        <div className="flex items-center">
          <button onClick={handlePrev} className="mr-2">
            <FaArrowLeft />
          </button>
          <h3 className="text-base font-semibold text-center">
            {format(currentDate, 'MMM d')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')}
          </h3>
          <button onClick={handleNext} className="ml-2">
            <FaArrowRight />
          </button>
        </div>
      )}
      {moduleType === "day" && (
        <div className="flex items-center">
          <button onClick={handlePrev} className="mr-2">
            <FaArrowLeft />
          </button>
          <h3 className="text-base font-semibold text-center">
            {format(currentDate, 'eee, MMM d')}
          </h3>
          <button onClick={handleNext} className="ml-2">
            <FaArrowRight />
          </button>
        </div>
      )}
      <div className={Styles.weekGrids}>
        {(moduleType === "week" ? weekDates : [currentDate]).map((date) => {
          const progress = getProgressForDate(date);
          const habits = getHabitsForDate(date);

          const taskOffset = circumferenceMain - (progress.percentage / 100) * circumferenceMain;

          return (
            <div key={format(date, 'M/d/yyyy')} className={`relative flex flex-col items-center w-40 h-32 justify-center`}>
              {/* Date Text */}
              <div className="text-center text-s">
                {moduleType === "week" ? (
                  <>
                    {format(date, 'EEE,')} <br /> {format(date, 'M/d')}
                  </>
                ) : (
                  <>
                    {format(date, 'MMM d')}
                  </>
                )}
              </div>

              {/* Circles Container */}
              <div className="absolute flex items-center justify-center mt">
                <svg
                  className="relative"
                  width={radiusHabit * 2 + 20} // Slight padding for avoiding cut-off
                  height={radiusHabit * 2 + 20}
                  viewBox={`0 0 ${radiusHabit * 2 + 20} ${radiusHabit * 2 + 20}`}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Habit Circles */}
                  {habits.map((habit, index) => {
                    const numberOfHabits = habits.length;
                    const gapSize = 12;
                    const totalGapSize = gapSize * numberOfHabits;
                    const availableCircumference = circumferenceHabit - totalGapSize;
                    const sectionSize = availableCircumference / numberOfHabits;
                    const offset = -(index * (sectionSize + gapSize));
                    const animatedOffset = -(index * (sectionSize + gapSize) - 20); // Adjust this value as needed for sliding effect

                    const strokeColor = habit.status === 'complete' ? habit.color : 'var(--dark3)';

                    return (
                      <g key={index} className="habit-group">
                        <Tooltip content={habit.name}>
                          <circle
                            cx={radiusHabit + 10}
                            cy={radiusHabit + 10}
                            r={radiusHabit}
                            stroke={strokeColor}
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={`${sectionSize} ${circumferenceHabit - sectionSize}`}
                            strokeDashoffset={animatedOffset}
                            strokeLinecap="round"
                            style={{
                              transition: "stroke-dashoffset 0.5s ease, stroke-dasharray 0.5s ease",
                              pointerEvents: 'visibleStroke'
                            }}
                          />
                        </Tooltip>
                      </g>
                    );
                  })}

                  {/* Outer Circle */}
                  <g className="main-progress-group">
                    <Tooltip content={`Progress: ${progress.percentage}%`}>
                      <circle
                        cx={radiusHabit + 10}
                        cy={radiusHabit + 10}
                        r={radiusMain}
                        stroke="var(--dark3)"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumferenceMain}
                        strokeDashoffset="0"
                        style={{ transition: "stroke-dasharray 0.5s ease", pointerEvents: 'visibleStroke' }} // Ensure hover only triggers on the stroke
                      />
                    </Tooltip>
                  </g>

                  {/* Progress Circle */}
                  <g className="main-progress-group">
                    <Tooltip content={`Progress: ${progress.percentage}%`}>
                      <circle
                        cx={radiusHabit + 10}
                        cy={radiusHabit + 10}
                        r={radiusMain}
                        stroke="var(--cal-purple)"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${(progress.percentage / 100) * circumferenceMain} ${circumferenceMain}`}
                        strokeLinecap={progress.percentage > 0 && progress.percentage < 100 ? "round" : "butt"} // Round edges only between 1 and 99
                        strokeDashoffset="0"
                        style={{ transition: "stroke-dasharray 0.5s ease", pointerEvents: 'visibleStroke' }} // Ensure hover only triggers on the stroke
                      />
                    </Tooltip>
                  </g>
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HabitProgressCircle;
