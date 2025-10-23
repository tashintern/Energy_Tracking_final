
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Activity, ChartData, ChartWeighting } from '../types';
import { StarIcon } from './icons';

interface WeeklyChartProps {
  activities: Activity[];
  weighting: ChartWeighting;
  onWeightingChange: (weighting: ChartWeighting) => void;
}

const processChartData = (activities: Activity[], weighting: ChartWeighting): ChartData[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekData: ChartData[] = days.map(day => ({ day, positive: 0, negative: 0, flowActivities: [] }));

  activities.forEach(activity => {
    const dayIndex = new Date(activity.startTime).getDay();
    const dayData = weekData[dayIndex];

    const value = weighting === 'duration' 
      ? activity.durationMinutes * activity.energy 
      : activity.energy;
    
    if (value > 0) {
      dayData.positive += value;
    } else {
      dayData.negative += value;
    }
    if (activity.starFlow) {
      dayData.flowActivities.push(activity);
    }
  });
  
  // For average weighting, we need to divide by count
  if(weighting === 'average') {
      days.forEach((day, index) => {
          const actsOnDay = activities.filter(a => new Date(a.startTime).getDay() === index);
          const positiveActs = actsOnDay.filter(a => a.energy > 0);
          const negativeActs = actsOnDay.filter(a => a.energy < 0);
          if(positiveActs.length > 0) weekData[index].positive /= positiveActs.length;
          if(negativeActs.length > 0) weekData[index].negative /= negativeActs.length;
      });
  }

  return weekData;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as ChartData;
        const positiveValue = payload.find((p: any) => p.dataKey === 'positive')?.value || 0;
        const negativeValue = payload.find((p: any) => p.dataKey === 'negative')?.value || 0;

        return (
            <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                <p className="font-bold text-gray-800 dark:text-gray-100">{label}</p>
                <p className="text-green-500">Energizing: {positiveValue.toFixed(1)}</p>
                <p className="text-red-500">Draining: {Math.abs(negativeValue).toFixed(1)}</p>
                {data.flowActivities.length > 0 && (
                     <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p className="font-semibold text-sm flex items-center gap-1 text-yellow-500">
                            <StarIcon className="w-4 h-4" /> Flow Activities:
                        </p>
                        <ul className="list-disc list-inside text-xs">
                           {data.flowActivities.map(act => <li key={act.id}>{act.title}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ activities, weighting, onWeightingChange }) => {
  const chartData = processChartData(activities, weighting);

  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Not enough data for the weekly chart.</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Log some activities to see your energy map!</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Weekly Energy Map</h2>
        <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
            <button onClick={() => onWeightingChange('duration')} className={`px-3 py-1 text-sm font-medium rounded-md ${weighting === 'duration' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}>By Duration</button>
            <button onClick={() => onWeightingChange('average')} className={`px-3 py-1 text-sm font-medium rounded-md ${weighting === 'average' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}>By Average</button>
        </div>
      </div>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} stackOffset="sign">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}/>
            <Legend />
            <ReferenceLine y={0} stroke="#888" strokeWidth={2}/>
            <Bar dataKey="positive" name="Energizing" stackId="stack" fill="#22c55e">
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.positive > 0 ? '#22c55e' : 'transparent'} />
                ))}
            </Bar>
            <Bar dataKey="negative" name="Draining" stackId="stack" fill="#ef4444">
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.negative < 0 ? '#ef4444' : 'transparent'} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
