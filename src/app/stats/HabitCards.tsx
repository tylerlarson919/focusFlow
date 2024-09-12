import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardFooter } from '@nextui-org/react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@nextui-org/dropdown";
import { createOrUpdateHabitInFirestore, getHabitLogStatus } from '../../../firebase'; // Import the function

interface Habit {
  id: string;
  name: string;
  color: string;
  habit_id: string;
  status: string;
}

interface HabitCardProps {
  habits: Habit[];
}

const HabitCards: React.FC<HabitCardProps> = ({ habits }) => {
  const [habitsState, setHabitsState] = useState<Habit[]>([]);


  
  useEffect(() => {
    const fetchHabitsStatus = async () => {
      try {
        const updatedHabits = await Promise.all(habits.map(async habit => {
          const status = await getHabitLogStatus(habit.habit_id);
          return {
            ...habit,
            status: status || 'incomplete', // Default to 'incomplete' if no log entry
          };
        }));
        console.log('Fetched statuses:', updatedHabits);
        setHabitsState(updatedHabits);
      } catch (error) {
        console.error('Error fetching habits statuses:', error);
        setHabitsState(habits.map(habit => ({ ...habit, status: 'incomplete' })));
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

    console.log(`Updating habit ${id} to status ${newStatus}`);

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
    <div className="flex flex-row gap-4 overflow-x-auto p-4">
      {habitsState.map((habit) => (
        <Card key={habit.id} isFooterBlurred radius="lg" className="border-none">
          <CardBody>
            <div style={{ color: habit.color }}>{habit.name}</div>
            <Dropdown>
              <DropdownTrigger>
                <button className="text-sm">
                  {habit.status === 'complete' ? 'Done' : 'Not Done'}
                </button>
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
          <CardFooter>
            {/* Footer content if needed */}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default HabitCards;
