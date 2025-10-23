
import React from 'react';
import { Activity } from '../types';
import { StarIcon, EditIcon, DeleteIcon } from './icons';

interface DailyTimelineProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onToggleFlow: (activityId: string) => void;
}

const getEnergyColorClass = (energy: number): string => {
  if (energy > 0) return `border-l-energy-positive-${energy}`;
  if (energy < 0) return `border-l-energy-negative-${Math.abs(energy)}`;
  return 'border-l-energy-neutral';
};

const ActivityCard: React.FC<{ activity: Activity; onEdit: (activity: Activity) => void; onDelete: (activityId: string) => void; onToggleFlow: (activityId: string) => void; }> = ({ activity, onEdit, onDelete, onToggleFlow }) => {
  const startTime = new Date(activity.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(activity.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-4 flex items-start gap-4 border-l-4 ${getEnergyColorClass(activity.energy)} transition-all hover:shadow-lg`}>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{activity.title}</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{startTime} - {endTime}</span>
            {activity.starFlow && <StarIcon className="w-5 h-5 text-yellow-400" />}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{activity.durationMinutes} min</p>
        {activity.notes && <p className="text-gray-700 dark:text-gray-400 mt-2 text-sm italic">"{activity.notes}"</p>}
        {activity.tags && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activity.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <button onClick={() => onEdit(activity)} className="p-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><EditIcon className="w-5 h-5"/></button>
        <button onClick={() => onToggleFlow(activity.id)} className={`p-2 rounded-full transition-colors ${activity.starFlow ? 'text-yellow-500' : 'text-gray-500'} hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700`}><StarIcon className="w-5 h-5"/></button>
        <button onClick={() => onDelete(activity.id)} className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><DeleteIcon className="w-5 h-5"/></button>
      </div>
    </div>
  );
};

export const DailyTimeline: React.FC<DailyTimelineProps> = ({ activities, onEdit, onDelete, onToggleFlow }) => {
  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">No activities logged for this day.</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Click the '+' button to add your first entry!</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {activities.map(activity => (
        <ActivityCard key={activity.id} activity={activity} onEdit={onEdit} onDelete={onDelete} onToggleFlow={onToggleFlow} />
      ))}
    </div>
  );
};
