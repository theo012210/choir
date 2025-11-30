import { useState, useEffect } from 'react';
import { ROLES, PLANS } from './data/mockData';
import Auth from './components/Auth';
import SessionPlanner from './components/SessionPlanner';
import TaskCompletion from './components/TaskCompletion';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(ROLES.MEMBER);
  const [plans, setPlans] = useState(PLANS);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'planner' | 'taskCompletion'
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [sessionSlots, setSessionSlots] = useState({}); // Store slots by date
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [newPlan, setNewPlan] = useState({
    title: '',
    date: '',
    description: '',
    status: 'Planned',
    visibleTo: [ROLES.TEACHER, ROLES.LEADER, ROLES.PART_LEADER, ROLES.MEMBER]
  });
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('choir_dark_mode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    localStorage.setItem('choir_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const storedUser = localStorage.getItem('choir_user_session');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setCurrentRole(parsedUser.role);
    }
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setCurrentRole(loggedInUser.role);
    localStorage.setItem('choir_user_session', JSON.stringify(loggedInUser));
    fetchPlans();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('choir_user_session');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Password changed successfully!');
        setIsChangePasswordOpen(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('An error occurred while changing password');
    }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  const visiblePlans = plans.filter(plan => plan.visibleTo.includes(currentRole));
  const donePlans = visiblePlans.filter(plan => plan.status === 'Done');
  const upcomingPlans = visiblePlans.filter(plan => plan.status === 'Planned');

  const handleSavePlan = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const response = await fetch(`/api/plans/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPlan),
        });
        
        if (response.ok) {
          const updatedPlan = await response.json();
          setPlans(plans.map(p => p.id === editingId ? updatedPlan : p));
          setEditingId(null);
        }
      } else {
        const response = await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newPlan, createdBy: user.name }),
        });

        if (response.ok) {
          const createdPlan = await response.json();
          setPlans([...plans, createdPlan]);
        }
      }
      
      setIsFormOpen(false);
      setNewPlan({
        title: '',
        date: '',
        description: '',
        status: 'Planned',
        visibleTo: [ROLES.TEACHER, ROLES.LEADER, ROLES.PART_LEADER, ROLES.MEMBER]
      });
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  const handleEditPlan = (plan) => {
    setNewPlan(plan);
    setEditingId(plan.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setNewPlan({
      title: '',
      date: '',
      description: '',
      status: 'Planned',
      visibleTo: [ROLES.TEACHER, ROLES.LEADER, ROLES.PART_LEADER, ROLES.MEMBER]
    });
  };

  const handleRoleChange = (role) => {
    setNewPlan(prev => {
      const newVisibleTo = prev.visibleTo.includes(role)
        ? prev.visibleTo.filter(r => r !== role)
        : [...prev.visibleTo, role];
      return { ...prev, visibleTo: newVisibleTo };
    });
  };

  const handleMarkDone = async (planId) => {
    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plans.find(p => p.id === planId), status: 'Done' }),
      });

      if (response.ok) {
        setPlans(plans.map(plan => 
          plan.id === planId ? { ...plan, status: 'Done' } : plan
        ));
      }
    } catch (error) {
      console.error('Failed to mark plan as done:', error);
    }
  };

  const handleRevertPlan = async (planId) => {
    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plans.find(p => p.id === planId), status: 'Planned' }),
      });

      if (response.ok) {
        setPlans(plans.map(plan => 
          plan.id === planId ? { ...plan, status: 'Planned' } : plan
        ));
      }
    } catch (error) {
      console.error('Failed to revert plan:', error);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPlans(plans.filter(plan => plan.id !== planId));
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  const handleViewTasks = (plan) => {
    setSelectedPlan(plan);
    setCurrentView('taskCompletion');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdatePlan = async (updatedPlan) => {
    try {
      const response = await fetch(`/api/plans/${updatedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlan),
      });

      if (response.ok) {
        setPlans(plans.map(p => p.id === updatedPlan.id ? updatedPlan : p));
        if (selectedPlan && selectedPlan.id === updatedPlan.id) {
          setSelectedPlan(updatedPlan);
        }
      }
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  };

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    setCurrentView('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveSessionPlan = async (description) => {
    const newSessionPlan = {
      title: `Session Plan for ${selectedDate}`,
      date: selectedDate,
      description: description,
      status: 'Planned',
      visibleTo: Object.values(ROLES),
      createdBy: user.name
    };

    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSessionPlan),
      });

      if (response.ok) {
        await fetchPlans();
        // Clear the slots for this date as it is saved
        setSessionSlots(prev => {
            const newState = { ...prev };
            delete newState[selectedDate];
            return newState;
        });
        setCurrentView('dashboard');
        setSelectedDate(null);
        alert('Session plan saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save plan: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save session plan:', error);
      alert('Failed to save session plan.');
    }
  };

  const handleBackToDashboard = (slots) => {
    if (selectedDate && slots) {
      setSessionSlots(prev => ({ ...prev, [selectedDate]: slots }));
    }
    setCurrentView('dashboard');
    setSelectedDate(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-colors duration-200">
        <div>
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Choir Learning Plan</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome, {user.name} ({user.role})</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button 
            onClick={isFormOpen ? handleCancelEdit : () => setIsFormOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            {isFormOpen ? 'Close Form' : 'Add Plan'}
          </button>
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
          >
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md transition-colors duration-200">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {currentView === 'planner' ? (
        <SessionPlanner 
          date={selectedDate} 
          initialSlots={sessionSlots[selectedDate] || []}
          existingPlan={plans.find(p => p.date === selectedDate && p.title.includes('Session Plan')) || plans.find(p => p.date === selectedDate)}
          onBack={handleBackToDashboard}
          onSavePlan={handleSaveSessionPlan}
        />
      ) : currentView === 'taskCompletion' ? (
        <TaskCompletion 
          plan={selectedPlan}
          onBack={() => {
            setCurrentView('dashboard');
            setSelectedPlan(null);
          }}
          onUpdatePlan={handleUpdatePlan}
        />
      ) : (
        <>
          {isFormOpen && (
            <div className="mb-10 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in transition-colors duration-200">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{editingId ? 'Edit Plan' : 'Add New Plan'}</h2>
              <form onSubmit={handleSavePlan} className="grid gap-4 md:grid-cols-2">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newPlan.title}
                    onChange={e => setNewPlan({...newPlan, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newPlan.date}
                    onChange={e => setNewPlan({...newPlan, date: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    required
                    value={newPlan.description}
                    onChange={e => setNewPlan({...newPlan, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={newPlan.status}
                    onChange={e => setNewPlan({...newPlan, status: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visible To</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.values(ROLES).map(role => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newPlan.visibleTo.includes(role)}
                          onChange={() => handleRoleChange(role)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 mt-2 flex gap-3">
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
                  >
                    {editingId ? 'Update Plan' : 'Save Plan'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          <main className="grid md:grid-cols-2 gap-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-emerald-600">
                <span>✓</span> What We Did
              </h2>
              <div className="space-y-4">
                {donePlans.length === 0 ? (
                  <p className="text-gray-500 italic">No completed activities visible.</p>
                ) : (
                  donePlans.map(plan => (
                    <PlanCard 
                      key={plan.id} 
                      plan={plan} 
                      type="done" 
                      onEdit={handleEditPlan}
                      onDelete={handleDeletePlan}
                      onRevert={handleRevertPlan}
                    />
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-blue-600">
                <span>📅</span> Coming Plans
              </h2>
              <div className="space-y-4">
                {upcomingPlans.length === 0 ? (
                  <p className="text-gray-500 italic">No upcoming plans visible.</p>
                ) : (
                  upcomingPlans.map(plan => (
                    <PlanCard 
                      key={plan.id} 
                      plan={plan} 
                      type="upcoming" 
                      onMarkDone={handleMarkDone}
                      onEdit={handleEditPlan}
                      onDelete={handleDeletePlan}
                      onViewTasks={handleViewTasks}
                    />
                  ))
                )}
              </div>
            </section>
          </main>
          <Calendar plans={visiblePlans} onDateClick={handleDateClick} />
        </>
      )}
    </div>
  );
}
function PlanCard({ plan, type, onMarkDone, onEdit, onDelete, onViewTasks, onRevert }) {
  const isDone = type === 'done';
  const isFuture = new Date(plan.date) > new Date();

  return (
    <div className={`bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 ${isDone ? 'border-emerald-400' : 'border-blue-400'} hover:shadow-md transition-all duration-200`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{plan.title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{plan.date}</span>
          <button 
            onClick={() => onEdit(plan)}
            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            title="Edit"
          >
            ✏️
          </button>
          <button 
            onClick={() => onDelete(plan.id)}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{plan.description}</p>
      {plan.createdBy && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Added by: {plan.createdBy}</p>
      )}
      <div className="mt-3 flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {plan.visibleTo.map(role => (
            <span key={role} className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
              {role}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
            {!isDone && onViewTasks && (
                <button
                onClick={() => onViewTasks(plan)}
                className="text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 transition"
                >
                Track Tasks
                </button>
            )}
            {!isDone && (
            <button
                onClick={() => onMarkDone(plan.id)}
                className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition"
            >
                Mark Done
            </button>
            )}
            {isDone && isFuture && onRevert && (
              <button
                onClick={() => onRevert(plan.id)}
                className="text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition"
              >
                Revert
              </button>
            )}
        </div>
      </div>
    </div>
  );
}

function Calendar({ plans, onDateClick }) {
  console.log('Calendar rendering. onDateClick type:', typeof onDateClick);
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getDayStatus = (day) => {
    if (!day) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayPlans = plans.filter(p => p.date === dateStr);
    
    const hasPlanned = dayPlans.some(p => p.status === 'Planned');
    const hasDone = dayPlans.some(p => p.status === 'Done');

    if (hasPlanned && hasDone) return 'both';
    if (hasPlanned) return 'planned';
    if (hasDone) return 'done';
    return null;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <section className="mt-12 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-colors duration-200">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span>🗓️</span> Monthly Schedule
        </h2>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition text-gray-600 dark:text-gray-300">◀</button>
          <span className="text-lg font-medium min-w-[140px] text-center text-gray-800 dark:text-white">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition text-gray-600 dark:text-gray-300">▶</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const status = getDayStatus(day);
          let bgClass = 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300';
          if (status === 'planned') bgClass = 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-100 font-medium ring-2 ring-green-100 dark:ring-green-800';
          if (status === 'done') bgClass = 'bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100 font-medium ring-2 ring-orange-100 dark:ring-orange-800';
          if (status === 'both') bgClass = 'bg-gradient-to-br from-orange-200 to-green-200 dark:from-orange-900/50 dark:to-green-900/50 text-gray-900 dark:text-white font-medium';

          const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;

          return (
            <button 
              key={idx} 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Button clicked for day:', day);
                if (day) {
                  console.log('Calling onDateClick with:', dateStr);
                  onDateClick(dateStr);
                }
              }}
              className={`
                h-14 md:h-24 flex flex-col items-start justify-start p-2 rounded-lg text-sm transition-all w-full relative z-10
                ${day ? bgClass + ' cursor-pointer hover:opacity-80 hover:scale-[1.02]' : 'bg-transparent cursor-default'} 
                ${day && !status ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
              `}
              disabled={!day}
            >
              {day && <span className="text-xs opacity-70 pointer-events-none">{day}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-6 text-sm text-gray-600 dark:text-gray-400 justify-center border-t dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 dark:bg-green-900/50 rounded ring-2 ring-green-100 dark:ring-green-800"></div>
          <span>Coming Plans</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-200 dark:bg-orange-900/50 rounded ring-2 ring-orange-100 dark:ring-orange-800"></div>
          <span>What We Did</span>
        </div>
      </div>
    </section>
  );
}

export default App;
