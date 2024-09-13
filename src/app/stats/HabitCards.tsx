import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardFooter, Button } from '@nextui-org/react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/dropdown";
import { createOrUpdateHabitInFirestore, getHabitLogStatus } from '../../../firebase'; // Import the function
import { subHours } from 'date-fns';

import styles from './page.module.css';

interface Habit {
  id: string;
  name: string;
  color: string;
  habit_id: string;
  status: string;
  emoji: string;
}

interface HabitCardProps {
  habits: Habit[];
}

const HabitCards: React.FC<HabitCardProps> = ({ habits }) => {
  const [habitsState, setHabitsState] = useState<Habit[]>([]);


  
  useEffect(() => {
    const fetchHabitsStatus = async () => {
      try {
        const updatedHabits = await Promise.all(
          habits.map(async habit => {
            // Ensure you're fetching the status for the right habit_id and current date
            const status = await getHabitLogStatus(habit.habit_id);
            return {
              ...habit,
              status: status || 'incomplete', // Default to 'incomplete' if no log entry
            };
          })
        );
        setHabitsState(updatedHabits);
      } catch (error) {
        console.error('Error fetching habits statuses:', error);
        setHabitsState(
          habits.map(habit => ({ ...habit, status: 'incomplete' }))
        );
      }
    };

    fetchHabitsStatus();
  }, [habits]);


  const handleStatusChange = async (id: string, newStatus: string) => {
    const updatedHabit = habitsState.find(h => h.habit_id === id);
    if (!updatedHabit) {
      console.warn('Habit not found');
      return;
    }

    try {
      await createOrUpdateHabitInFirestore({ ...updatedHabit, status: newStatus });

      // Update the local state to reflect the status change
      setHabitsState(prevHabits =>
        prevHabits.map(h =>
          h.habit_id === id ? { ...h, status: newStatus } : h
        )
      );

      console.log(`Habit ${id} status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating habit status:", error);
    }
  };

  return (
<div className={styles.gridColumns}>
{habitsState.map((habit) => (
        <Card key={habit.id}  radius="lg" className="bg-[var(--dark2)] border-none h-28 w-full mb-0">
          <CardBody  className="h-fit min-h-fit p-0 pl-3 pr-3 pt-2 pb-3 gap-1">
            <div className="flex flex-row gap-1">
              <div>
              {habit.emoji || "😀"}
              </div>
              <div 
                style={{ 
                  color: habit.color, 
                  whiteSpace: 'nowrap',  // Prevents text wrapping
                  overflow: 'hidden',    // Hides the overflowed text
                  textOverflow: 'ellipsis'  // Displays "..." when text overflows
                }}
              >
                {habit.name}
              </div>           
            </div>
            <Dropdown
            >
              <DropdownTrigger>
                <Button
                  variant="faded"
                  color={habit.status === 'complete' ? 'success' : 'default'}


                  className="text-sm w-24 h-6"
                >
                  {habit.status === 'complete' ? 'Done' : 'Not Done'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Select status"
                onAction={(action) => {
                  console.log('Dropdown action:', action);
                  handleStatusChange(habit.id, action as string); // Cast action to string
                }}
              >
                <DropdownItem key="complete">Done</DropdownItem>
                <DropdownItem key="incomplete">Not Done</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </CardBody>

        </Card>
      ))}
    </div>
  );
};

export default HabitCards;
