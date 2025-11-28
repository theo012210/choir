import { useState, useEffect } from 'react';
import { ROLES, PLANS } from './data/mockData';
import Auth from './components/Auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(ROLES.MEMBER);
  const [plans, setPlans] = useState(PLANS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newPlan, setNewPlan] = useState({
    title: '',
    date: '',
    description: '',
    status: 'Planned',
    visibleTo: [ROLES.TEACHER, ROLES.LEADER, ROLES.PART_LEADER, ROLES.MEMBER]
  });

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

  if (!user) {
    return <Auth onLogin={handleLogin} />;
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
    const planToUpdate = plans.find(p => p.id === planId);
    if (!planToUpdate) return;

    const updatedPlanData = { ...planToUpdate, status: 'Done' };

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlanData),
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

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-900">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-md">
        <div>
          <h1 className="text-3xl font-bold text-indigo-600">Choir Learning Plan</h1>
          <p className="text-gray-500 mt-1">Welcome, {user.name} ({user.role})</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button 
            onClick={isFormOpen ? handleCancelEdit : () => setIsFormOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            {isFormOpen ? 'Close Form' : 'Add Plan'}
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {isFormOpen && (
        <div className="mb-10 bg-white p-6 rounded-xl shadow-md animate-fade-in">
          <h2 className="text-xl font-bold mb-4 text-gray-800">{editingId ? 'Edit Plan' : 'Add New Plan'}</h2>
          <form onSubmit={handleSavePlan} className="grid gap-4 md:grid-cols-2">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={newPlan.title}
                onChange={e => setNewPlan({...newPlan, title: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={newPlan.date}
                onChange={e => setNewPlan({...newPlan, date: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                required
                value={newPlan.description}
                onChange={e => setNewPlan({...newPlan, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows="3"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={newPlan.status}
                onChange={e => setNewPlan({...newPlan, status: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Planned">Planned</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Visible To</label>
              <div className="flex flex-wrap gap-3">
                {Object.values(ROLES).map(role => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPlan.visibleTo.includes(role)}
                      onChange={() => handleRoleChange(role)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{role}</span>
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
                />
              ))
            )}
          </div>
        </section>
      </main>
      <Calendar plans={visiblePlans} />
    </div>
  );
}
function PlanCard({ plan, type, onMarkDone, onEdit, onDelete }) {
  const isDone = type === 'done';
  return (
    <div className={`bg-white p-5 rounded-lg shadow-sm border-l-4 ${isDone ? 'border-emerald-400' : 'border-blue-400'} hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-800">{plan.title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{plan.date}</span>
          <button 
            onClick={() => onEdit(plan)}
            className="text-gray-400 hover:text-indigo-600 transition"
            title="Edit"
          >
            ✏️
          </button>
          <button 
            onClick={() => onDelete(plan.id)}
            className="text-gray-400 hover:text-red-600 transition"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
      <p className="text-gray-600">{plan.description}</p>
      {plan.createdBy && (
        <p className="text-xs text-gray-400 mt-1">Added by: {plan.createdBy}</p>
      )}
      <div className="mt-3 flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {plan.visibleTo.map(role => (
            <span key={role} className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              {role}
            </span>
          ))}
        </div>
        {!isDone && (
          <button
            onClick={() => onMarkDone(plan.id)}
            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition"
          >
            Mark Done
          </button>
        )}
      </div>
    </div>
  );
}

function Calendar({ plans }) {
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
    <section className="mt-12 bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <span>🗓️</span> Monthly Schedule
        </h2>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition">◀</button>
          <span className="text-lg font-medium min-w-[140px] text-center">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition">▶</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-sm font-bold text-gray-400 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const status = getDayStatus(day);
          let bgClass = 'bg-gray-50 text-gray-700';
          if (status === 'planned') bgClass = 'bg-green-200 text-green-900 font-medium ring-2 ring-green-100';
          if (status === 'done') bgClass = 'bg-orange-200 text-orange-900 font-medium ring-2 ring-orange-100';
          if (status === 'both') bgClass = 'bg-gradient-to-br from-orange-200 to-green-200 text-gray-900 font-medium';

          return (
            <div 
              key={idx} 
              className={`
                h-14 md:h-24 flex flex-col items-start justify-start p-2 rounded-lg text-sm transition-all
                ${day ? bgClass : 'bg-transparent'} 
                ${day && !status ? 'hover:bg-gray-100' : ''}
              `}
            >
              {day && <span className="text-xs opacity-70">{day}</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-6 text-sm text-gray-600 justify-center border-t pt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 rounded ring-2 ring-green-100"></div>
          <span>Coming Plans</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-200 rounded ring-2 ring-orange-100"></div>
          <span>What We Did</span>
        </div>
      </div>
    </section>
  );
}

export default App;
