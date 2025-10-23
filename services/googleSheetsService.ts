import { Activity } from '../types';

export const syncActivityToSheet = async (
  activity: Activity,
  sheetUrl: string,
  apiKey: string
): Promise<boolean> => {
  if (!sheetUrl || !apiKey) {
    console.warn("Google Sheets URL or API Key is not configured.");
    return false;
  }

  // Restructure the payload to include the API key and nest the activity data.
  // This helps avoid a CORS preflight request which causes "Failed to fetch" errors.
  const payload = {
    apiKey: apiKey,
    activity: {
      ...activity,
      date: new Date(activity.startTime).toLocaleDateString(),
      start_time: new Date(activity.startTime).toLocaleTimeString(),
      end_time: new Date(activity.endTime).toLocaleTimeString(),
      duration_minutes: activity.durationMinutes,
      star_flow: activity.starFlow,
      created_at: activity.createdAt,
      updated_at: activity.updatedAt,
      device_id: 'web-client',
      source: 'EnergyMap-WebApp',
    }
  };

  try {
    const response = await fetch(sheetUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        // Explicitly set Content-Type to text/plain to avoid a CORS preflight request.
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
      // THIS IS THE KEY FIX: Google Apps Script doPost returns a 302 redirect.
      // 'manual' redirect mode prevents fetch from following it, which avoids the CORS error.
      // The response will be of type 'opaque', which we treat as a success.
      redirect: 'manual',
    });
    
    // For a successful request with `redirect: 'manual'`, the response type will be 'opaque'.
    // We can't read the body, but we can assume the data was sent successfully.
    if (response.ok || response.type === 'opaque' || response.status === 200) {
      console.log('Successfully synced activity:', activity.title);
      return true;
    } else {
      const errorText = await response.text();
      console.error('Failed to sync activity:', activity.title, 'Status:', response.status, 'Error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Network error while syncing activity:', activity.title, error);
    return false;
  }
};