import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, DatePicker, Textarea, Button } from '@nextui-org/react';
import { parseDateTime, CalendarDateTime, CalendarDate, DateValue } from "@internationalized/date";
import { db } from '../../../firebase'; 
import { collection, addDoc, setDoc, deleteDoc,getDoc,updateDoc, doc } from 'firebase/firestore';
import { FaCalendar, FaTrash } from "react-icons/fa";


interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNewTaskClick: (isClicked: boolean, date: Date) => void;
    onSave: (task: Task) => void;
    initialDate?: string;
    task?: Task;
    color?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task, onNewTaskClick, initialDate }) => {
    // Convert initialDate to ISO format if provided, otherwise null
    const convertToISODate = (dateString: string) => {
        const [month, day, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`;
    };

    // Utility function to format CalendarDateTime to string
    const formatDate = (date: CalendarDateTime) => {
        return `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}T${date.hour.toString().padStart(2, '0')}:${date.minute.toString().padStart(2, '0')}`;
    };

    const [date, setDate] = useState<string | null>(
        initialDate ? formatDate(parseDateTime(convertToISODate(initialDate))) : null
    );

    // Add this state for handling the end date
    const [endDate, setEndDate] = useState<string | null>(
        task?.endDate || ''
    );

    useEffect(() => {
        if (isOpen) {
            if (task) {
                // Populate the modal with the selected task's data
                setDate(task.date || null);
                setEndDate(task.endDate || '');
                setName(task.name || '');
                setDescription(task.description || '');
                setColor(task.color || '#007bff');
            } else {
                // Reset the modal for a new task
                setDate(initialDate ? formatDate(parseDateTime(convertToISODate(initialDate))) : null);
                setEndDate('');
                setName('');
                setDescription('');
                setColor('#007bff');
            }
        }
    }, [isOpen, task, initialDate]);
    


    const [name, setName] = useState<string>(task?.name || '');
    const [description, setDescription] = useState<string>(task?.description || '');
    const [color, setColor] = useState<string>(task?.color || '#007bff'); // Default to blue
    const [showColorPicker, setShowColorPicker] = useState(false);

    
    const handleSave = async () => {
        if (date) {
            const taskToSave = {
                id: task?.id || `${Date.now()}`, // Ensure id is included
                date, // Use the date as-is
                endDate: endDate || '', // Ensure endDate is included
                name,
                description,
                status: task?.status || 'Not Started',
                color, 
            };
    
            try {
                const taskRef = doc(db, 'tasks', taskToSave.id);
                const docSnap = await getDoc(taskRef);
    
                if (docSnap.exists()) {
                    // Update existing task
                    await updateDoc(taskRef, taskToSave);
                } else {
                    // Create new task
                    await setDoc(taskRef, taskToSave); // Use setDoc to create with specific ID
                }
    
                const [year, month, day, hour, minute] = date.split(/[-T:]/);
                const jsDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
                onSave(taskToSave);
                onNewTaskClick(true, jsDate);
                onClose(); // Close the modal
            } catch (error) {
                console.error('Error saving task: ', error);
            }
        }
    };
    
    
    
    
    

    
    
    const handleDateChange = (newDate: CalendarDateTime, type: 'start' | 'end') => {
        const formattedDate = formatDate(newDate);
        if (type === 'start') {
            setDate(formattedDate);
        } else {
            setEndDate(formattedDate);
        }
    };
    

    


    return (
        <Modal size="4xl" isOpen={isOpen} onOpenChange={onClose}>
            <ModalContent>
            <ModalHeader className="items-center flex flex-row gap-3 text-3xl">
                {task && (
                    <FaTrash
                        className="text-2xl text-red-500 cursor-pointer"
                        onClick={async () => {
                            if (task) {
                                try {
                                    const sessionRef = doc(db, 'tasks', task.id);
                                    await deleteDoc(sessionRef);  // Function to delete the document
                                    onClose();  // Close the modal after deleting
                                    console.log('Task deleted successfully');
                                } catch (error) {
                                    console.error('Error deleting task:', error);
                                }
                            }
                        }}
                    />
                )}
                {task ? 'Edit Task' : 'New Task'}
                <div className="relative items-center justify-center">
                    <div 
                        className="w-6 h-6 rounded-full cursor-pointer"
                        style={{ backgroundColor: color }}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                    />
                    <div 
                        className={`absolute top-1 bottom-1 left-full ml-1 flex flex-row items-center justify-center shadow-lg z-50 transition-transform transition-opacity duration-300 ease-in-out ${showColorPicker ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'} origin-left`}
                        style={{ transformOrigin: 'left' }}
                    >
                        {['#007bff', '#28a745', '#dc3545', '#ffc107', '#6c757d'].map((clr) => (
                            <div 
                                key={clr}
                                className={`w-5 h-5 rounded-full m-1 cursor-pointer ${clr === color ? 'shadow-lg shadow-[0_0_5px_rgba(255,255,255,0.5)]' : ''}`}
                                style={{ backgroundColor: clr }}
                                onClick={() => {
                                    setColor(clr);
                                    setShowColorPicker(false);
                                }}
                            />
                        ))}
                    </div>
                </div>



            </ModalHeader>




                <ModalBody>
                    <div className='flex flex-row gap-3'>
                        <DatePicker className='w-1/2'
                            label="Start Date"
                            granularity="minute"
                            fullWidth
                            value={date ? parseDateTime(date) : null}
                            onChange={(newDate) => handleDateChange(newDate, 'start')}
                            startContent={
                                <FaCalendar className="text-1xl text-default-400 pointer-events-none flex-shrink-0" />
                            }
                        />
                        <DatePicker className='w-1/2'
                            label="End Date"
                            granularity="minute"
                            fullWidth
                            value={endDate ? parseDateTime(endDate) : null}
                            onChange={(newDate) => handleDateChange(newDate, 'end')}
                            startContent={
                                <FaCalendar className="text-1xl text-default-400 pointer-events-none flex-shrink-0" />
                            }
                        />
                    </div>
                    <Input
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth

                    />
                    <Textarea
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth

                    />
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="secondary" onPress={handleSave}>
                        Save
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default TaskModal;

interface Task {
    id: string;
    date: string;
    endDate: string;
    name: string;
    description: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
    color: string;
}
