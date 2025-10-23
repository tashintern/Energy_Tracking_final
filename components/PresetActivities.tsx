import React from 'react';
import { Preset } from '../types';
import { PlayIcon } from './icons';

interface PresetActivitiesProps {
  presets: Preset[];
  onStartPreset: (preset: Preset) => void;
}

export const PresetActivities: React.FC<PresetActivitiesProps> = ({ presets, onStartPreset }) => {
  if (presets.length === 0) {
    return null; // Don't render if no presets
  }

  return (
    <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Quick Start</h3>
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset.id}
            onClick={() => onStartPreset(preset)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            aria-label={`Start tracking ${preset.title}`}
          >
            <PlayIcon className="w-4 h-4" />
            <span>{preset.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
