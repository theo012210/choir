import { useState, useEffect } from 'react';

export default function AdminPortal({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        alert('User deleted successfully.');
      } else {
        const data = await response.json();
        alert(`Failed to delete user: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('An error occurred while deleting the user.');
    }
  };

  const handleResetPassword = async (userId, userName) => {
    const newPassword = window.prompt(`Enter new password for user "${userName}":`);
    if (!newPassword) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        alert(`Password for "${userName}" has been reset successfully.`);
      } else {
        const data = await response.json();
        alert(`Failed to reset password: ${data.error}`);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('An error occurred while resetting the password.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Admin Portal - User Management
        </h2>
        <div className="w-20"></div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Role</th>
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="p-3 text-gray-800 dark:text-gray-200">{user.name}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => handleResetPassword(user.id, user.name)}
                      className="text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      className="text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-gray-500 dark:text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
