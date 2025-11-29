import { useState, useEffect } from 'react';

export default function SessionPlanner({ date, onBack }) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');

  // Generate 5-minute intervals
  const generateSlots = () => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const newSlots = [];

    let current = start;
    while (current < end) {
      const next = new Date(current.getTime() + 5 * 60000);
      newSlots.push({
        id: current.toTimeString().slice(0, 5),
        start: current.toTimeString().slice(0, 5),
        end: next.toTimeString().slice(0, 5),
        task: '',
        isCombined: false
      });
      current = next;
    }
    setSlots(newSlots);
    setSelectedSlots(new Set());
  };

  const toggleSlotSelection = (id) => {
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSlots(newSelected);
  };

  const handleCombine = () => {
    if (selectedSlots.size === 0) return;
    setIsEditing(true);
    setTaskDescription('');
  };

  const saveTask = () => {
    const selectedIds = Array.from(selectedSlots).sort();
    if (selectedIds.length === 0) return;

    // Find the range of slots to merge
    const firstId = selectedIds[0];
    const lastId = selectedIds[selectedIds.length - 1];
    
    // Create a new combined slot or update existing ones
    // For simplicity, we'll just update the first slot to span the whole duration and hide/remove the others
    // But keeping the grid structure might be better.
    // Let's just update the 'task' field for all selected slots and mark them as part of a group?
    // Or better: merge them in the UI.
    
    // Let's try a simpler approach: Update the task for all selected slots.
    // If we want to "combine", we might want to show them as one block.
    
    const updatedSlots = slots.map(slot => {
      if (selectedSlots.has(slot.id)) {
        return { ...slot, task: taskDescription, isCombined: true, groupId: firstId };
      }
      return slot;
    });

    setSlots(updatedSlots);
    setIsEditing(false);
    setSelectedSlots(new Set());
  };

  // Helper to group slots for rendering
  const groupedSlots = [];
  let currentGroup = null;

  slots.forEach(slot => {
    if (slot.isCombined && slot.task) {
      if (currentGroup && currentGroup.groupId === slot.groupId) {
        currentGroup.end = slot.end;
        currentGroup.slots.push(slot);
      } else {
        if (currentGroup) groupedSlots.push(currentGroup);
        currentGroup = {
          ...slot,
          type: 'combined',
          slots: [slot]
        };
      }
    } else {
      if (currentGroup) {
        groupedSlots.push(currentGroup);
        currentGroup = null;
      }
      groupedSlots.push({ ...slot, type: 'single' });
    }
  });
  if (currentGroup) groupedSlots.push(currentGroup);


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
          Plan Session for {new Date(date).toLocaleDateString()}
        </h2>
        <div className="w-20"></div> {/* Spacer */}
      </div>

      <div className="flex flex-wrap gap-4 mb-8 items-end bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
          />
        </div>
        <button
          onClick={generateSlots}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Generate Slots
        </button>
      </div>

      {slots.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Timeline</h3>
            <button
              onClick={handleCombine}
              disabled={selectedSlots.size === 0}
              className={`px-4 py-2 rounded-lg transition ${
                selectedSlots.size > 0 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Combine & Add Task
            </button>
          </div>

          {isEditing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Add Task Details</h3>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="What are we doing in this time block?"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md mb-4 h-32"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={saveTask}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
            {groupedSlots.map((group, idx) => (
              <div 
                key={idx}
                className={`border-b dark:border-gray-700 last:border-b-0 transition-colors ${
                  group.type === 'single' 
                    ? selectedSlots.has(group.id) 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30' 
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    : 'bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                {group.type === 'single' ? (
                  <div 
                    onClick={() => toggleSlotSelection(group.id)}
                    className="flex p-3 cursor-pointer items-center gap-4"
                  >
                    <div className="w-24 font-mono text-sm text-gray-500 dark:text-gray-400 shrink-0">
                      {group.start} - {group.end}
                    </div>
                    <div className="flex-grow text-gray-400 italic text-sm">
                      Empty slot
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selectedSlots.has(group.id)
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedSlots.has(group.id) && '✓'}
                    </div>
                  </div>
                ) : (
                  <div className="flex p-4 items-start gap-4 relative group">
                     <div className="w-24 font-mono text-sm text-gray-500 dark:text-gray-400 shrink-0 pt-1">
                      {group.start} - {group.end}
                    </div>
                    <div className="flex-grow">
                      <p className="text-gray-800 dark:text-gray-200 font-medium">{group.task}</p>
                      <p className="text-xs text-gray-500 mt-1">{group.slots.length * 5} minutes</p>
                    </div>
                    <button 
                      onClick={() => {
                        // Ungroup logic
                        const newSlots = slots.map(s => {
                          if (s.groupId === group.groupId) {
                            return { ...s, task: '', isCombined: false, groupId: null };
                          }
                          return s;
                        });
                        setSlots(newSlots);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm px-2 py-1"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
