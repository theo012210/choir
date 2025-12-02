import { useState, useEffect } from 'react';

export default function TaskCompletion({ plan, onBack, onUpdatePlan }) {
  const [tasks, setTasks] = useState([]);
  const [completedIndices, setCompletedIndices] = useState(new Set());

  useEffect(() => {
    if (plan && plan.description) {
      const lines = plan.description.split('\n');
      const parsedTasks = [];
      let currentTask = null;

      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Ignore "Last edited by" line
        if (trimmedLine.startsWith('Last edited by:')) return;

        // Match time pattern: HH:MM-HH:MM followed by optional separator and description
        const match = line.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})(?::|\s)?\s*(.*)$/);
        
        if (match) {
          // If we have a previous task, push it
          if (currentTask) {
            parsedTasks.push(currentTask);
          }
          
          // Start new task
          currentTask = {
            index, // Use the line number of the start of the task as ID
            start: match[1],
            end: match[2],
            task: match[3].trim(),
            originalLine: line
          };
        } else if (currentTask) {
          // Append to current task description if it's a continuation
          currentTask.task += (currentTask.task ? ' ' : '') + trimmedLine;
        }
      });

      // Push the last task
      if (currentTask) {
        parsedTasks.push(currentTask);
      }

      setTasks(parsedTasks);
      
      if (plan.completedTasks) {
        setCompletedIndices(new Set(plan.completedTasks));
      }
    }
  }, [plan]);

  const toggleTask = (index) => {
    const newCompleted = new Set(completedIndices);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedIndices(newCompleted);
    
    // Update backend
    onUpdatePlan({
        ...plan,
        completedTasks: Array.from(newCompleted)
    });
  };

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
          {plan.title} - Task Completion
        </h2>
        <div className="w-20"></div>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div 
            key={task.index}
            className={`p-4 rounded-lg border transition-all cursor-pointer flex items-start gap-4 ${
              completedIndices.has(task.index)
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500'
            }`}
            onClick={() => toggleTask(task.index)}
          >
            <div className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 mt-1 ${
               completedIndices.has(task.index)
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-gray-300 dark:border-gray-500'
            }`}>
              {completedIndices.has(task.index) && '✓'}
            </div>
            
            <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                        {task.start} - {task.end}
                    </span>
                </div>
                <p className={`text-lg ${
                    completedIndices.has(task.index) 
                    ? 'text-gray-500 dark:text-gray-400 line-through' 
                    : 'text-gray-800 dark:text-gray-200'
                }`}>
                    {task.task}
                </p>
            </div>
          </div>
        ))}
        
        {tasks.length === 0 && (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                No tasks found in this plan. Ensure the description follows the format "HH:MM-HH:MM: Task".
            </div>
        )}
      </div>
    </div>
  );
}
