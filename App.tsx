import React, { useState, useEffect, useCallback } from 'react';
import { Activity, View, ChartWeighting, Preset, ReminderSettings } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { ActivityForm } from './components/ActivityForm';
import { DailyTimeline } from './components/DailyTimeline';
import { WeeklyChart } from './components/WeeklyChart';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { syncActivityToSheet } from './services/googleSheetsService';
import { PlusIcon, SettingsIcon, ChartIcon, ListIcon, AnalyticsIcon } from './components/icons';
import { PresetActivities } from './components/PresetActivities';

const App: React.FC = () => {
  const [activities, setActivities] = useLocalStorage<Activity[]>('activities', []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<Activity | Partial<Activity> & { _startTimer?: boolean } | null>(null);
  const [currentView, setCurrentView] = useState<View>('timeline');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [chartWeighting, setChartWeighting] = useLocalStorage<ChartWeighting>('chartWeighting', 'duration');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useLocalStorage('settings', {
    googleSheetUrl: '',
    googleSheetApiKey: '',
    geminiApiKey: '',
    commonTags: ['work', 'project', 'learning', 'health', 'personal']
  });

  const [presets, setPresets] = useLocalStorage<Preset[]>('presets', [
    { id: crypto.randomUUID(), title: 'Deep Work', defaultTags: 'work, focus', defaultEnergy: 4},
    { id: crypto.randomUUID(), title: 'Team Meeting', defaultTags: 'work, communication', defaultEnergy: 1},
    { id: crypto.randomUUID(), title: 'Workout', defaultTags: 'health, exercise', defaultEnergy: 5},
  ]);
  const [reminders, setReminders] = useLocalStorage<ReminderSettings>('reminders', {
      dailyEnabled: false,
      dailyTime: '21:00',
      smartEnabled: false,
      smartIntervalHours: 4,
  });

  const [showOnboarding, setShowOnboarding] = useLocalStorage('showOnboarding', true);

  // Effect to handle browser notifications for reminders
  useEffect(() => {
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    const checkReminders = () => {
        // Daily Reminder
        if (reminders.dailyEnabled && reminders.dailyTime) {
            const [hours, minutes] = reminders.dailyTime.split(':').map(Number);
            const now = new Date();
            if (now.getHours() === hours && now.getMinutes() === minutes) {
                const lastNotified = localStorage.getItem('lastDailyNotification');
                const today = now.toDateString();
                if (lastNotified !== today) {
                    new Notification('EnergyMap Reminder', { body: "Don't forget to log your activities for the day!" });
                    localStorage.setItem('lastDailyNotification', today);
                }
            }
        }

        // Smart Reminder
        if (reminders.smartEnabled && reminders.smartIntervalHours > 0 && activities.length > 0) {
            const lastActivity = activities[0]; // Assumes sorted descending
            const lastActivityTime = new Date(lastActivity.endTime || lastActivity.startTime).getTime();
            const hoursSince = (Date.now() - lastActivityTime) / (1000 * 60 * 60);

            if (hoursSince >= reminders.smartIntervalHours) {
                 const lastNotified = parseInt(localStorage.getItem('lastSmartNotification') || '0', 10);
                 if (Date.now() - lastNotified > reminders.smartIntervalHours * 60 * 60 * 1000) {
                     new Notification('EnergyMap Reminder', { body: `It's been a while! Time to log a new activity?` });
                    localStorage.setItem('lastSmartNotification', String(Date.now()));
                 }
            }
        }
    };
    
    const intervalId = setInterval(checkReminders, 60000);
    return () => clearInterval(intervalId);
  }, [reminders, activities]);

  // Set Gemini API key on process.env for the service to use
  useEffect(() => {
    if (settings.geminiApiKey) {
      process.env.API_KEY = settings.geminiApiKey;
    }
  }, [settings.geminiApiKey]);

  const handleSaveActivity = (activity: Activity) => {
    setActivities(prev => {
      const index = prev.findIndex(a => a.id === activity.id);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = activity;
        return updated;
      }
      return [...prev, activity].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    });
    setIsFormOpen(false);
    setActivityToEdit(null);
  };

  const handleOpenForm = (activity?: Activity) => {
    setActivityToEdit(activity || null);
    setIsFormOpen(true);
  };
  
  const handleDeleteActivity = (activityId: string) => {
    setActivities(prev => prev.filter(a => a.id !== activityId));
  };

  const handleToggleFlow = (activityId: string) => {
    setActivities(prev => prev.map(a => a.id === activityId ? {...a, starFlow: !a.starFlow, updatedAt: new Date().toISOString(), synced: false } : a));
  }
  
  const handleStartPresetActivity = (preset: Preset) => {
    const newActivity: Partial<Activity> & { _startTimer: boolean } = {
        title: preset.title,
        tags: preset.defaultTags,
        energy: preset.defaultEnergy,
        starFlow: false,
        notes: '',
        startTime: new Date().toISOString(),
        _startTimer: true,
    };
    setActivityToEdit(newActivity);
    setIsFormOpen(true);
  };

  const syncUnsyncedActivities = useCallback(async () => {
    if (!settings.googleSheetUrl || !settings.googleSheetApiKey) return;
    const unsynced = activities.filter(a => !a.synced);
    if (unsynced.length === 0) return;
    
    console.log(`Attempting to sync ${unsynced.length} activities...`);
    
    const newActivities = [...activities];
    for (const activity of unsynced) {
        const success = await syncActivityToSheet(activity, settings.googleSheetUrl, settings.googleSheetApiKey);
        if (success) {
            const index = newActivities.findIndex(a => a.id === activity.id);
            if (index > -1) {
                newActivities[index] = { ...newActivities[index], synced: true };
            }
        }
    }
    setActivities(newActivities);
  }, [activities, settings.googleSheetUrl, settings.googleSheetApiKey, setActivities]);
  
  useEffect(() => {
    const interval = setInterval(() => {
        syncUnsyncedActivities();
    }, 30000); // try to sync every 30 seconds
    return () => clearInterval(interval);
  }, [syncUnsyncedActivities]);


  const getWeekActivities = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return activities.filter(a => {
        const actDate = new Date(a.startTime);
        return actDate >= startOfWeek && actDate < endOfWeek;
    });
  }

  const filteredActivities = activities.filter(a => {
    const actDate = new Date(a.startTime);
    return actDate.toDateString() === selectedDate.toDateString();
  });

  const changeDate = (offset: number) => {
    setSelectedDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + offset);
        return newDate;
    });
  }
  
  const renderView = () => {
    switch(currentView) {
        case 'weekly':
            return <WeeklyChart activities={getWeekActivities(selectedDate)} weighting={chartWeighting} onWeightingChange={setChartWeighting}/>;
        case 'analytics':
            return <AnalyticsView activities={getWeekActivities(selectedDate)} />;
        case 'timeline':
        default:
            return <DailyTimeline activities={filteredActivities} onEdit={handleOpenForm} onDelete={handleDeleteActivity} onToggleFlow={handleToggleFlow} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">EnergyMap</h1>
            <div className="flex items-center gap-2">
                 <nav className="hidden md:flex items-center gap-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                    <button onClick={() => setCurrentView('timeline')} className={`px-3 py-1 text-sm font-medium rounded-md flex items-center gap-1.5 ${currentView === 'timeline' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}><ListIcon className="w-4 h-4"/>Timeline</button>
                    <button onClick={() => setCurrentView('weekly')} className={`px-3 py-1 text-sm font-medium rounded-md flex items-center gap-1.5 ${currentView === 'weekly' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}><ChartIcon className="w-4 h-4"/>Weekly</button>
                    <button onClick={() => setCurrentView('analytics')} className={`px-3 py-1 text-sm font-medium rounded-md flex items-center gap-1.5 ${currentView === 'analytics' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}><AnalyticsIcon className="w-4 h-4"/>Analytics</button>
                </nav>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><SettingsIcon className="w-6 h-6"/></button>
            </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 pb-24">
        {currentView === 'timeline' && (
            <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
                <button onClick={() => changeDate(-1)} className="px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">&lt; Prev</button>
                <h2 className="text-xl font-semibold text-center">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</h2>
                <button onClick={() => changeDate(1)} className="px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">Next &gt;</button>
            </div>
        )}
        {currentView === 'timeline' && <PresetActivities presets={presets} onStartPreset={handleStartPresetActivity} />}
        {renderView()}
      </main>

       <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-t-lg border-t dark:border-gray-700 flex justify-around items-center p-2 z-40">
            <button onClick={() => setCurrentView('timeline')} className={`flex flex-col items-center p-2 rounded-lg ${currentView === 'timeline' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}><ListIcon className="w-6 h-6"/><span className="text-xs">Timeline</span></button>
            <button onClick={() => setCurrentView('weekly')} className={`flex flex-col items-center p-2 rounded-lg ${currentView === 'weekly' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}><ChartIcon className="w-6 h-6"/><span className="text-xs">Weekly</span></button>
            <button onClick={() => setCurrentView('analytics')} className={`flex flex-col items-center p-2 rounded-lg ${currentView === 'analytics' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}><AnalyticsIcon className="w-6 h-6"/><span className="text-xs">Analytics</span></button>
      </nav>

      {isFormOpen && <ActivityForm onSave={handleSaveActivity} onClose={() => {setIsFormOpen(false); setActivityToEdit(null);}} activityToEdit={activityToEdit} commonTags={settings.commonTags || []} />}
      <button onClick={() => handleOpenForm()} className="fixed bottom-20 md:bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 z-40">
        <PlusIcon className="w-8 h-8"/>
      </button>

      {isSettingsOpen && 
        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            settings={settings} 
            onSaveSettings={setSettings}
            presets={presets}
            onSavePresets={setPresets}
            reminders={reminders}
            onSaveReminders={setReminders}
        />}
    </div>
  );
};

export default App;