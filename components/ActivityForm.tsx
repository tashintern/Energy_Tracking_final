import React, { useState, useEffect, useRef } from 'react';
import { Activity } from '../types';
import { CloseIcon, PlayIcon, StopIcon } from './icons';

interface ActivityFormProps {
  onSave: (activity: Activity) => void;
  onClose: () => void;
  activityToEdit?: (Activity | Partial<Activity> & { _startTimer?: boolean }) | null;
  commonTags: string[];
}

const EnergySelector: React.FC<{ value: number; onChange: (value: number) => void }> = ({ value, onChange }) => {
  const energies = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  const getColor = (energy: number) => {
    if (energy > 0) return `bg-energy-positive-${energy}`;
    if (energy < 0) return `bg-energy-negative-${Math.abs(energy)}`;
    return 'bg-energy-neutral';
  };

  return (
    <div className="flex justify-between items-center my-4">
      {energies.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onChange(e)}
          className={`w-8 h-8 rounded-full text-white text-xs font-bold transition-transform transform hover:scale-110 ${getColor(e)} ${value === e ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
};

const formatElapsedTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};


export const ActivityForm: React.FC<ActivityFormProps> = ({ onSave, onClose, activityToEdit, commonTags }) => {
  const [activity, setActivity] = useState<Partial<Activity> & { _startTimer?: boolean }>(
    activityToEdit || {
      title: '',
      energy: 0,
      tags: '',
      starFlow: false,
      notes: ''
    }
  );
  
  const [isTiming, setIsTiming] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (activityToEdit) {
      setActivity(activityToEdit);
       if ('_startTimer' in activityToEdit && activityToEdit._startTimer) {
        if(!isTiming) {
           toggleTimer();
        }
      }
    }
     return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activityToEdit]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setActivity(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setActivity(prev => ({ ...prev, [name]: checked }));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const date = new Date(field === 'startTime' ? activity.startTime || Date.now() : activity.endTime || Date.now());
    const [hours, minutes] = value.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    setActivity(prev => ({...prev, [field]: date.toISOString()}));
  };

  const formatTimeForInput = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  const toggleTimer = () => {
    if (isTiming) {
      // Stop timer
      setIsTiming(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setActivity(prev => ({
        ...prev,
        endTime: new Date().toISOString()
      }));
    } else {
      // Start timer
      const newStartTime = activity.startTime || new Date().toISOString();
      setIsTiming(true);
      setActivity(prev => ({
        ...prev,
        startTime: newStartTime,
        endTime: undefined
      }));
      startTimeRef.current = new Date(newStartTime).getTime();
      timerRef.current = window.setInterval(() => {
        if(startTimeRef.current) {
            const elapsed = Date.now() - startTimeRef.current;
            setElapsedTime(formatElapsedTime(elapsed));
        }
      }, 1000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.title || !activity.startTime || !activity.endTime) {
        alert('Please fill in a title, start time, and end time.');
        return;
    }
    const durationMinutes = Math.round((new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()) / 60000);
    
    const { _startTimer, ...restOfActivity } = activity;

    const finalActivity: Activity = {
        id: restOfActivity.id || crypto.randomUUID(),
        createdAt: restOfActivity.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
        ...restOfActivity,
        title: restOfActivity.title!,
        startTime: restOfActivity.startTime,
        endTime: restOfActivity.endTime,
        durationMinutes: durationMinutes > 0 ? durationMinutes : 0,
        energy: restOfActivity.energy || 0,
        tags: restOfActivity.tags || '',
        starFlow: restOfActivity.starFlow || false,
        notes: restOfActivity.notes || ''
    };
    onSave(finalActivity);
  };
  
  const quickAddTag = (tag: string) => {
    setActivity(prev => {
        const tags = prev.tags ? prev.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        if (!tags.includes(tag)) {
            tags.push(tag);
        }
        return {...prev, tags: tags.join(', ')};
    });
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md m-4 relative max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">{activityToEdit && activityToEdit.id ? 'Edit Activity' : 'Add Activity'}</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            <CloseIcon className="w-6 h-6" />
        </button>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            value={activity.title}
            onChange={handleInputChange}
            placeholder="What are you doing?"
            className="w-full p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            required
          />

          <div className="flex flex-col items-center gap-2">
             {isTiming && (
                <div className="text-center my-2 p-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-full">
                    <p className="text-4xl font-mono font-bold text-gray-800 dark:text-gray-100">{elapsedTime}</p>
                </div>
            )}
            <button
              type="button"
              onClick={toggleTimer}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-md text-white font-semibold transition-colors ${isTiming ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isTiming ? <><StopIcon className="w-5 h-5"/> Stop Timer</> : <><PlayIcon className="w-5 h-5"/> Start Timer</>}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
              <input type="time" value={formatTimeForInput(activity.startTime)} onChange={(e) => handleTimeChange('startTime', e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600" required/>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
              <input type="time" value={formatTimeForInput(activity.endTime)} onChange={(e) => handleTimeChange('endTime', e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600" required/>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Energy Level</label>
            <EnergySelector value={activity.energy || 0} onChange={(e) => setActivity(prev => ({...prev, energy: e}))} />
          </div>
          
          <input
            type="text"
            name="tags"
            value={activity.tags}
            onChange={handleInputChange}
            placeholder="Tags (e.g., work, project x, focus)"
            className="w-full p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
          />
           <div className="flex flex-wrap gap-2">
               {commonTags.map(tag => (
                   <button 
                    key={tag} 
                    type="button" 
                    onClick={() => quickAddTag(tag)} 
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                        {tag}
                    </button>
               ))}
            </div>


          <textarea
            name="notes"
            value={activity.notes}
            onChange={handleInputChange}
            placeholder="Notes..."
            rows={3}
            className="w-full p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
          ></textarea>
          
          <div className="flex items-center justify-between">
            <label htmlFor="starFlow" className="flex items-center gap-2 cursor-pointer text-yellow-500">
              <input
                type="checkbox"
                id="starFlow"
                name="starFlow"
                checked={!!activity.starFlow}
                onChange={handleCheckboxChange}
                className="h-5 w-5 rounded text-yellow-500 focus:ring-yellow-500 border-gray-300"
              />
              Mark as Flow Activity
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
            <button type="submit" className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};
