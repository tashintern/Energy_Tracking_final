
import React from 'react';

interface OnboardingModalProps {
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <h1 className="text-3xl font-bold mb-4 text-center text-blue-600 dark:text-blue-400">Welcome to EnergyMap!</h1>
        <p className="text-lg text-center text-gray-700 dark:text-gray-300 mb-6">
          Discover what fuels you and what drains you.
        </p>

        <div className="space-y-6 text-gray-800 dark:text-gray-200">
          <div>
            <h2 className="text-xl font-semibold mb-2">What is an Energy Map?</h2>
            <p>
              It's a simple tool to log your daily activities and rate how they affect your energy level. By tracking this over a week, you can visualize patterns, identify activities that put you in a state of "flow", and make small adjustments to build a more energizing life.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">How to Interpret Your Weekly Map</h2>
            <p>
              Your weekly chart shows bars for each day. Bars extending upwards represent <span className="font-semibold text-green-600 dark:text-green-400">energizing activities</span>, while bars extending downwards show <span className="font-semibold text-red-600 dark:text-red-400">draining ones</span>. The height of the bar reflects the total impact (energy level × duration). Look for days with high positive energy and identify what caused them. Similarly, notice what contributes to your most draining days.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
            <ol className="list-decimal list-inside space-y-2 pl-4">
              <li>
                <strong>Add Activities:</strong> Use the <span className="inline-flex items-center justify-center bg-blue-500 text-white rounded-full w-6 h-6 font-bold">+</span> button to log an activity. You can use the timer or enter times manually.
              </li>
              <li>
                <strong>Rate Your Energy:</strong> On a scale from -5 (very draining) to +5 (very energizing), how did the activity make you feel?
              </li>
              <li>
                <strong>Mark Flow States:</strong> If you were fully immersed and lost track of time, mark it as a <span className="text-yellow-500 font-semibold">Flow Activity</span> with the star icon.
              </li>
              <li>
                <strong>Review & Analyze:</strong> Check your Weekly Chart and Analytics views at the end of the week to find powerful insights.
              </li>
            </ol>
          </div>

           <div>
            <h2 className="text-xl font-semibold mb-2">Optional: Sync to Google Sheets</h2>
            <p>
              You can persist your data to a Google Sheet. This requires setting up a simple Google Apps Script. Instructions can be found in the project's README file. Once set up, enter the URL and API Key in the Settings (<span className="inline-block align-middle">⚙️</span>) menu.
            </p>
          </div>

        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
};
