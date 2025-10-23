import React, { useState } from 'react';
import { CloseIcon, DeleteIcon } from './icons';
import { Preset, ReminderSettings } from '../types';

interface Settings {
    googleSheetUrl: string;
    googleSheetApiKey: string;
    geminiApiKey: string;
    commonTags: string[];
}
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  presets: Preset[];
  onSavePresets: (presets: Preset[]) => void;
  reminders: ReminderSettings;
  onSaveReminders: (reminders: ReminderSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    settings, 
    onSaveSettings,
    presets,
    onSavePresets,
    reminders,
    onSaveReminders,
}) => {
  const [currentSettings, setCurrentSettings] = useState(settings);
  const [currentPresets, setCurrentPresets] = useState(presets);
  const [newPresetTitle, setNewPresetTitle] = useState('');
  const [newTag, setNewTag] = useState('');
  const [currentReminders, setCurrentReminders] = useState(reminders);


  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(currentSettings);
    onSavePresets(currentPresets);
    onSaveReminders(currentReminders);
    onClose();
  };
  
  const handleAddPreset = () => {
      if(newPresetTitle.trim()){
          setCurrentPresets([...currentPresets, {
              id: crypto.randomUUID(),
              title: newPresetTitle.trim(),
              defaultTags: '',
              defaultEnergy: 0,
          }]);
          setNewPresetTitle('');
      }
  }

  const handleDeletePreset = (id: string) => {
      setCurrentPresets(currentPresets.filter(p => p.id !== id));
  }
  
    const handleAddTag = () => {
        const trimmedTag = newTag.trim();
        if (trimmedTag && !(currentSettings.commonTags || []).includes(trimmedTag)) {
            setCurrentSettings(prev => ({
                ...prev,
                commonTags: [...(prev.commonTags || []), trimmedTag]
            }));
            setNewTag('');
        }
    };

    const handleDeleteTag = (tagToDelete: string) => {
        setCurrentSettings(prev => ({
            ...prev,
            commonTags: (prev.commonTags || []).filter(t => t !== tagToDelete)
        }));
    };


  const handleReminderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCurrentReminders(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl m-4 relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Settings</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
          <CloseIcon className="w-6 h-6" />
        </button>
        <div className="space-y-6">
            {/* Preset Activities */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                 <h3 className="text-lg font-semibold mb-2">Preset Activities</h3>
                 <div className="space-y-2 mb-2">
                    {currentPresets.map(preset => (
                        <div key={preset.id} className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded-md">
                            <span>{preset.title}</span>
                            <button onClick={() => handleDeletePreset(preset.id)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full">
                                <DeleteIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    ))}
                 </div>
                 <div className="flex gap-2 mt-2">
                     <input 
                        type="text"
                        value={newPresetTitle}
                        onChange={(e) => setNewPresetTitle(e.target.value)}
                        placeholder="Add new preset..."
                        className="flex-grow mt-1 w-full p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
                     />
                     <button onClick={handleAddPreset} className="px-4 py-2 mt-1 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">Add</button>
                 </div>
            </div>

            {/* Common Tags */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                 <h3 className="text-lg font-semibold mb-2">Common Tags</h3>
                 <div className="flex flex-wrap gap-2 mb-2">
                    {(currentSettings.commonTags || []).map(tag => (
                        <div key={tag} className="flex items-center gap-2 bg-white dark:bg-gray-700 p-2 rounded-md">
                            <span>{tag}</span>
                            <button onClick={() => handleDeleteTag(tag)} className="text-red-500">
                                <CloseIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                 </div>
                 <div className="flex gap-2 mt-2">
                     <input 
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add new tag..."
                        className="flex-grow mt-1 w-full p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
                     />
                     <button onClick={handleAddTag} className="px-4 py-2 mt-1 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">Add</button>
                 </div>
            </div>

            {/* Reminders */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-semibold mb-2">Reminders</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label htmlFor="dailyEnabled" className="text-gray-700 dark:text-gray-300">Enable daily reminder</label>
                        <div className="flex items-center gap-2">
                           <input type="time" name="dailyTime" value={currentReminders.dailyTime} onChange={handleReminderChange} disabled={!currentReminders.dailyEnabled} className="p-1 rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 disabled:opacity-50"/>
                           <input type="checkbox" id="dailyEnabled" name="dailyEnabled" checked={currentReminders.dailyEnabled} onChange={handleReminderChange} className="h-5 w-5 rounded text-blue-500 focus:ring-blue-500"/>
                        </div>
                    </div>
                     <div className="flex items-center justify-between">
                        <label htmlFor="smartEnabled" className="text-gray-700 dark:text-gray-300">Enable smart reminder</label>
                         <div className="flex items-center gap-2">
                           <span className="text-sm">After</span>
                           <input type="number" min="1" max="24" name="smartIntervalHours" value={currentReminders.smartIntervalHours} onChange={handleReminderChange} disabled={!currentReminders.smartEnabled} className="w-16 p-1 rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 disabled:opacity-50"/>
                           <span className="text-sm">hours</span>
                           <input type="checkbox" id="smartEnabled" name="smartEnabled" checked={currentReminders.smartEnabled} onChange={handleReminderChange} className="h-5 w-5 rounded text-blue-500 focus:ring-blue-500"/>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Reminders use your browser's Notification API. You may need to grant permission.</p>
            </div>


          {/* API Keys */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold mb-2">API Keys & Sync</h3>
             <div>
                <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gemini API Key (for AI Summaries)
                </label>
                <input
                type="password"
                id="geminiApiKey"
                name="geminiApiKey"
                value={currentSettings.geminiApiKey}
                onChange={(e) => setCurrentSettings({ ...currentSettings, [e.target.name]: e.target.value })}
                placeholder="Enter your Gemini API Key"
                className="mt-1 w-full p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Your key is stored only in your browser's local storage.</p>
            </div>
            
            <div className="mt-4">
                 <h4 className="font-semibold text-md mb-2">Google Sheets Sync</h4>
                 <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg mb-4">
                    <p className="font-bold">Personal Use Only</p>
                    <p className="text-sm">
                    This sync method is for personal use. Your URL and API Key are stored in your browser. For instructions on setting up the Google Apps Script, please refer to the project's `README.md` file.
                    </p>
                </div>
                <div>
                <label htmlFor="googleSheetUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Google Apps Script URL
                </label>
                <input
                    type="text"
                    id="googleSheetUrl"
                    name="googleSheetUrl"
                    value={currentSettings.googleSheetUrl}
                    onChange={(e) => setCurrentSettings({ ...currentSettings, [e.target.name]: e.target.value })}
                    placeholder="Enter your deployed script URL"
                    className="mt-1 w-full p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
                />
                </div>
                <div className="mt-2">
                <label htmlFor="googleSheetApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Secret API Key (X-API-KEY)
                </label>
                <input
                    type="password"
                    id="googleSheetApiKey"
                    name="googleSheetApiKey"
                    value={currentSettings.googleSheetApiKey}
                    onChange={(e) => setCurrentSettings({ ...currentSettings, [e.target.name]: e.target.value })}
                    placeholder="Enter your secret key"
                    className="mt-1 w-full p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
                />
                </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-6">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
          <button type="button" onClick={handleSave} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">Save Settings</button>
        </div>
      </div>
    </div>
  );
};