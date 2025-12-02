import { useState, useEffect } from 'react';
import { ROLES } from '../data/mockData';

export default function DailyReflection({ date, user, onBack }) {
  const [reflection, setReflection] = useState({ good: '', bad: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canEdit = user.role === ROLES.PART_LEADER || user.role === ROLES.TEACHER || user.role === ROLES.ADMIN;
  const canView = [ROLES.TEACHER, ROLES.LEADER, ROLES.PART_LEADER, ROLES.ADMIN].includes(user.role);

  useEffect(() => {
    fetchReflection();
  }, [date]);

  const fetchReflection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reflections?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setReflection({ good: data.good || '', bad: data.bad || '' });
        }
      }
    } catch (err) {
      console.error('Failed to fetch reflection:', err);
      setError('Failed to load reflection');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          good: reflection.good,
          bad: reflection.bad,
          updatedBy: user.name
        }),
      });

      if (response.ok) {
        alert('Reflection saved successfully!');
      } else {
        const data = await response.json();
        alert(`Failed to save: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to save reflection:', err);
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <p className="text-red-500">You do not have permission to view this page.</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 hover:underline">Back</button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Daily Reflection for {new Date(date).toLocaleDateString()}
        </h2>
        <div className="w-20"></div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              What went well?
            </label>
            <textarea
              value={reflection.good}
              onChange={(e) => setReflection({ ...reflection, good: e.target.value })}
              disabled={!canEdit}
              className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              placeholder={canEdit ? "List the positive outcomes, achievements, and good moments..." : "No entries yet."}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-semibold text-red-600 dark:text-red-400">
              What needs improvement?
            </label>
            <textarea
              value={reflection.bad}
              onChange={(e) => setReflection({ ...reflection, bad: e.target.value })}
              disabled={!canEdit}
              className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
              placeholder={canEdit ? "List the challenges, issues, and areas for improvement..." : "No entries yet."}
            />
          </div>
        </div>
      )}

      {canEdit && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={`px-6 py-3 rounded-lg text-white font-bold shadow-lg transition flex items-center gap-2 ${
              saving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {saving ? 'Saving...' : '💾 Save Reflection'}
          </button>
        </div>
      )}
    </div>
  );
}
