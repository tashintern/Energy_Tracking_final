
import React, { useMemo, useState, useEffect } from 'react';
import { Activity } from '../types';
import { generateWeeklySummary } from '../services/geminiService';
import { StarIcon } from './icons';

interface AnalyticsViewProps {
  activities: Activity[];
}

const calculateAnalytics = (activities: Activity[]) => {
  const weightedActivities = activities.map(a => ({ ...a, score: a.energy * (a.durationMinutes || 1) }));
  
  const sortedByEnergy = [...weightedActivities].sort((a, b) => b.score - a.score);
  
  const energizing = sortedByEnergy.filter(a => a.energy > 0).slice(0, 5);
  const draining = sortedByEnergy.filter(a => a.energy < 0).reverse().slice(0, 5);

  const tags: Record<string, number> = {};
  activities.forEach(a => {
    a.tags.split(',').forEach(rawTag => {
      const tag = rawTag.trim();
      if (tag) {
        tags[tag] = (tags[tag] || 0) + a.durationMinutes;
      }
    });
  });
  const timePerTag = Object.entries(tags).sort((a, b) => b[1] - a[1]);
  
  const careerKeywords = ['work', 'project', 'career'];
  const careerActivities = activities.filter(a =>
    careerKeywords.some(keyword => a.tags.toLowerCase().includes(keyword))
  ).sort((a,b) => (b.energy * b.durationMinutes) - (a.energy * a.durationMinutes));

  return { energizing, draining, timePerTag, careerActivities };
};

const AnalyticsCard: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
        {children}
    </div>
);

const ActivityListItem: React.FC<{activity: Activity & {score?: number}}> = ({activity}) => (
    <li className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <span className="flex items-center gap-2">{activity.title} {activity.starFlow && <StarIcon className="w-4 h-4 text-yellow-400" />}</span>
        <span className="font-semibold text-sm">{activity.energy > 0 ? '+' : ''}{activity.energy}</span>
    </li>
);

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ activities }) => {
  const [summary, setSummary] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);

  const { energizing, draining, timePerTag, careerActivities } = useMemo(() => calculateAnalytics(activities), [activities]);

  useEffect(() => {
    if (activities.length > 0) {
      setIsLoadingSummary(true);
      generateWeeklySummary(energizing, draining)
        .then(setSummary)
        .finally(() => setIsLoadingSummary(false));
    }
  }, [energizing, draining, activities.length]);

  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">No data to analyze.</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Log some activities to see your insights!</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
        <AnalyticsCard title="AI Summary & Recommendation">
            {isLoadingSummary ? (
                <p className="text-gray-500 dark:text-gray-400 animate-pulse">Generating insights...</p>
            ) : (
                <p className="text-gray-700 dark:text-gray-300 italic">"{summary}"</p>
            )}
        </AnalyticsCard>

        <div className="grid md:grid-cols-2 gap-6">
            <AnalyticsCard title="Top 5 Energizing Activities">
                <ul>{energizing.map(a => <ActivityListItem key={a.id} activity={a}/>)}</ul>
            </AnalyticsCard>
            <AnalyticsCard title="Top 5 Draining Activities">
                <ul>{draining.map(a => <ActivityListItem key={a.id} activity={a}/>)}</ul>
            </AnalyticsCard>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <AnalyticsCard title="Time Spent Per Tag">
                <ul>
                    {timePerTag.map(([tag, minutes]) => (
                        <li key={tag} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            <span>{tag}</span>
                            <span className="font-semibold text-sm">{Math.round(minutes / 60 * 10) / 10} hours</span>
                        </li>
                    ))}
                </ul>
            </AnalyticsCard>

            <AnalyticsCard title="Career Focus">
                 <ul>{careerActivities.slice(0, 5).map(a => <ActivityListItem key={a.id} activity={a}/>)}</ul>
            </AnalyticsCard>
        </div>
    </div>
  );
};
