import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 🔒 SECURITY FIX: Get API URL from .env
const API_URL = import.meta.env.VITE_API_URL;

const AdminsPage = () => { 
    const [admins, setAdmins] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ email: '', password: '', full_name: '', role: 'ADMIN' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false); // NEW: Track role

    const token = localStorage.getItem('adminToken');
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');

    // Check if user is a Super Admin (based on stored info)
    useEffect(() => {
        if (adminInfo.role !== 'SUPER_ADMIN') {
            setError('Access Denied: Only Super Admins can manage admins.');
            setLoading(false);
        } else {
            setIsSuperAdmin(true);
            fetchAdmins();
        }
    }, []);

    const fetchAdmins = async () => {
        try {
            // 🔒 SECURITY FIX
            const response = await axios.get(`${API_URL}/api/admins`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdmins(response.data);
            setError('');
        } catch (err) {
            if (err.response && err.response.status === 403) {
                setError('Access Denied: Only Super Admins can manage admins.');
            } else {
                setError('Failed to load admins. Please check if the server is running.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async () => {
        try {
            // 🔒 SECURITY FIX
            await axios.post(`${API_URL}/api/admins`, newAdmin, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAddModal(false);
            setNewAdmin({ email: '', password: '', full_name: '', role: 'ADMIN' });
            fetchAdmins();
        } catch (err) {
            // Clean error handling, no ugly alerts
            alert(err.response?.data?.error || 'Failed to add admin');
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (confirm('Are you sure you want to remove this admin?')) {
            try {
                // 🔒 SECURITY FIX
                await axios.delete(`${API_URL}/api/admins/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchAdmins();
            } catch (err) {
                alert(err.response?.data?.error || 'Failed to delete');
            }
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            // 🔒 SECURITY FIX
            await axios.put(`${API_URL}/api/admins/${id}/role`, { role: newRole }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAdmins();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update role');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // If NOT a Super Admin, show clean Access Denied message
    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <i className="fa-solid fa-shield-halved text-red-500 text-5xl mb-4"></i>
                <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                <p className="text-gray-500 mt-2">Only Super Admins can manage admins.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Admins Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage admin users and their roles</p>
                </div>
                {/* Add Admin button only shows for Super Admins */}
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-plus"></i> Add Admin
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-4 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {admins.map(admin => (
                    <div key={admin.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                    {admin.full_name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">{admin.full_name}</p>
                                    <p className="text-xs text-gray-500">{admin.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="text-red-500 hover:text-red-700"
                                title="Delete Admin"
                            >
                                <i className="fa-solid fa-trash"></i>
                            </button>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                            <p className="text-xs text-gray-500">Role</p>
                            <select
                                value={admin.role}
                                onChange={(e) => handleRoleChange(admin.id, e.target.value)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border-none cursor-pointer ${
                                    admin.role === 'SUPER_ADMIN' 
                                        ? 'bg-purple-100 text-purple-700' 
                                        : 'bg-blue-100 text-blue-700'
                                }`}
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="SUPER_ADMIN">Super Admin</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs">
                        <tr>
                            <th className="py-3 px-4">ID</th>
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Role</th>
                            <th className="py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {admins.map(admin => (
                            <tr key={admin.id}>
                                <td className="py-4 px-4">#{admin.id}</td>
                                <td className="py-4 px-4 font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                            {admin.full_name?.charAt(0) || 'A'}
                                        </div>
                                        {admin.full_name}
                                    </div>
                                </td>
                                <td className="py-4 px-4">{admin.email}</td>
                                <td className="py-4 px-4">
                                    <select
                                        value={admin.role}
                                        onChange={(e) => handleRoleChange(admin.id, e.target.value)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border-none cursor-pointer ${
                                            admin.role === 'SUPER_ADMIN' 
                                                ? 'bg-purple-100 text-purple-700' 
                                                : 'bg-blue-100 text-blue-700'
                                        }`}
                                    >
                                        <option value="ADMIN">Admin</option>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                    </select>
                                </td>
                                <td className="py-4 px-4">
                                    <button 
                                        onClick={() => handleDeleteAdmin(admin.id)}
                                        className="text-red-500 hover:text-red-700"
                                        title="Delete Admin"
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Add New Admin</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Admin Name"
                                    value={newAdmin.full_name}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input 
                                    type="email" 
                                    placeholder="admin@example.com"
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input 
                                    type="password" 
                                    placeholder="Enter password"
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={newAdmin.role}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="ADMIN">Admin</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button 
                                    onClick={handleAddAdmin}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Admin
                                </button>
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminsPage;