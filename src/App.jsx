import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import genieLogo from './assets/genie.png';
import AdminPages from './AdminPages';

// 🔒 SECURITY FIX: Get API URL from .env
const API_URL = import.meta.env.VITE_API_URL;

// 🔒 SECURITY FIX: Add Axios Interceptor to automatically attach JWT token
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Custom Animation CSS
const animationStyles = `
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-enter {
    animation: slideInUp 0.5s ease-out forwards;
  }
  .animate-enter:nth-child(1) { animation-delay: 0.05s; }
  .animate-enter:nth-child(2) { animation-delay: 0.1s; }
  .animate-enter:nth-child(3) { animation-delay: 0.15s; }
  .animate-enter:nth-child(4) { animation-delay: 0.2s; }
  .animate-enter:nth-child(5) { animation-delay: 0.25s; }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
  
  @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes slideOutLeft { from { transform: translateX(0); } to { transform: translateX(-100%); } }
  .mobile-slide-in { animation: slideInLeft 0.3s ease-out forwards; }
  .mobile-slide-out { animation: slideOutLeft 0.3s ease-in forwards; }
  .sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 40; }
`;

// 🔒 SECURITY FIX: Add ProtectedRoute component
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('adminToken');
    const location = useLocation();

    if (!token) {
        // User is not logged in, redirect them to the login page
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children; // User is logged in, allow access to the dashboard
};

// A placeholder component for the other pages
const PagePlaceholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-enter">
    <div className="text-6xl mb-4"><i className="fa-solid fa-wrench"></i></div>
    <h2 className="text-2xl font-bold text-gray-600">{title}</h2>
    <p className="mt-2">This page is coming soon!</p>
  </div>
);

// ==========================================
// REPORTS PAGE COMPONENT (UPGRADED)
// ==========================================
const ReportsPage = ({ bookings, loading, error }) => {
  const [reportType, setReportType] = useState('summary');
  
  const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);
  const totalBookings = bookings.length;
  
  const paidBookings = bookings.filter(b => b.payment_status === 'PAID');
  const failedBookings = bookings.filter(b => b.payment_status === 'FAILED');
  const pendingBookings = bookings.filter(b => b.payment_status === 'PENDING');

  const paidRevenue = paidBookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);
  const failedRevenue = failedBookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);
  const pendingRevenue = pendingBookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);

  const paymentStats = {
    PAID: paidBookings.length,
    PENDING: pendingBookings.length,
    FAILED: failedBookings.length,
    REFUNDED: bookings.filter(b => b.payment_status === 'REFUNDED').length,
  };
  
  const bookingStats = {
    CONFIRMED: bookings.filter(b => b.booking_status === 'CONFIRMED').length,
    PENDING: bookings.filter(b => b.booking_status === 'PENDING').length,
    COMPLETED: bookings.filter(b => b.booking_status === 'COMPLETED').length,
    CANCELLED: bookings.filter(b => b.booking_status === 'CANCELLED').length,
  };

  const handleExport = () => {
    const headers = ['ID', 'Customer', 'Email', 'Service', 'Date', 'Total', 'Payment Status', 'Booking Status'];
    const csvData = bookings.map(b => [
      b.id, b.full_name, b.email, b.service_type, 
      new Date(b.preferred_date).toLocaleDateString(),
      b.total_price, b.payment_status, b.booking_status
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clean-genie-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 font-medium bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
          <p className="text-gray-500 text-sm mt-1">Business reports and summaries</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <i className="fa-solid fa-download"></i> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-medium text-green-600 uppercase">Collected Revenue</p>
          <p className="text-2xl font-bold text-green-800 mt-1">₱ {paidRevenue.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-2">{paidBookings.length} Paid Bookings</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-medium text-red-600 uppercase">Failed Revenue</p>
          <p className="text-2xl font-bold text-red-800 mt-1">₱ {failedRevenue.toFixed(2)}</p>
          <p className="text-xs text-red-600 mt-2">{failedBookings.length} Failed Bookings</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs font-medium text-orange-600 uppercase">Pending Revenue</p>
          <p className="text-2xl font-bold text-orange-800 mt-1">₱ {pendingRevenue.toFixed(2)}</p>
          <p className="text-xs text-orange-600 mt-2">{pendingBookings.length} Pending Bookings</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-600 uppercase">Total Expected Revenue</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">₱ {totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-blue-600 mt-2">{totalBookings} Total Bookings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setReportType('summary')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${reportType === 'summary' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Summary
          </button>
          <button 
            onClick={() => setReportType('failed')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${reportType === 'failed' ? 'text-red-600 border-b-2 border-red-600 bg-red-50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Failed Payments
          </button>
          <button 
            onClick={() => setReportType('pending')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${reportType === 'pending' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pending Payments
          </button>
          <button 
            onClick={() => setReportType('paid')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${reportType === 'paid' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Paid Payments
          </button>
        </div>

        <div className="p-6">
          {reportType === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-4">Booking Status Breakdown</h4>
                <div className="space-y-3">
                  {Object.entries(bookingStats).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status === 'CONFIRMED' ? 'bg-blue-500' : status === 'COMPLETED' ? 'bg-green-500' : status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600 capitalize">{status.toLowerCase()}</span>
                      </div>
                      <span className="font-bold text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-4">Payment Status Breakdown</h4>
                <div className="space-y-3">
                  {Object.entries(paymentStats).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status === 'PAID' ? 'bg-green-500' : status === 'PENDING' ? 'bg-orange-500' : status === 'FAILED' ? 'bg-red-500' : 'bg-purple-500'}`}></div>
                        <span className="text-sm text-gray-600 capitalize">{status.toLowerCase()}</span>
                      </div>
                      <span className="font-bold text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {reportType === 'failed' && (
            <div>
              <h4 className="font-semibold text-red-600 mb-4">Failed Payments - Action Required</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-red-50 text-red-500 uppercase font-semibold text-xs">
                    <tr>
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {failedBookings.length > 0 ? failedBookings.map(b => (
                      <tr key={b.id}>
                        <td className="py-4 px-4">#{b.id}</td>
                        <td className="py-4 px-4">{b.full_name}</td>
                        <td className="py-4 px-4 font-bold text-red-600">₱ {parseFloat(b.total_price).toFixed(2)}</td>
                        <td className="py-4 px-4">{b.payment_method || 'N/A'}</td>
                        <td className="py-4 px-4">{new Date(b.preferred_date).toLocaleDateString()}</td>
                        <td className="py-4 px-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">FAILED</span></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="py-8 text-center text-gray-500">No Failed Payments!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'pending' && (
            <div>
              <h4 className="font-semibold text-orange-600 mb-4">Pending Payments - Need Verification</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-orange-50 text-orange-500 uppercase font-semibold text-xs">
                    <tr>
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingBookings.length > 0 ? pendingBookings.map(b => (
                      <tr key={b.id}>
                        <td className="py-4 px-4">#{b.id}</td>
                        <td className="py-4 px-4">{b.full_name}</td>
                        <td className="py-4 px-4 font-bold text-orange-600">₱ {parseFloat(b.total_price).toFixed(2)}</td>
                        <td className="py-4 px-4">{b.payment_method || 'N/A'}</td>
                        <td className="py-4 px-4">{new Date(b.preferred_date).toLocaleDateString()}</td>
                        <td className="py-4 px-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">PENDING</span></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="py-8 text-center text-gray-500">No Pending Payments!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'paid' && (
            <div>
              <h4 className="font-semibold text-green-600 mb-4">Paid Transactions</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-green-50 text-green-500 uppercase font-semibold text-xs">
                    <tr>
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paidBookings.length > 0 ? paidBookings.map(b => (
                      <tr key={b.id}>
                        <td className="py-4 px-4">#{b.id}</td>
                        <td className="py-4 px-4">{b.full_name}</td>
                        <td className="py-4 px-4 font-bold text-green-600">₱ {parseFloat(b.total_price).toFixed(2)}</td>
                        <td className="py-4 px-4">{b.payment_method || 'N/A'}</td>
                        <td className="py-4 px-4">{new Date(b.preferred_date).toLocaleDateString()}</td>
                        <td className="py-4 px-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">PAID</span></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="py-8 text-center text-gray-500">No Paid Transactions!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// BOOKINGS PAGE COMPONENT (UPDATED WITH STATS)
// ==========================================
const BookingsPage = ({ bookings, loading, error, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const itemsPerPage = 5;

  // 🔢 STATS CALCULATIONS
  const totalBookings = bookings.length;
  const pendingPayments = bookings.filter(b => b.payment_status === 'PENDING').length;
  const pendingConfirmations = bookings.filter(b => b.booking_status === 'PENDING').length;
  const completedBookings = bookings.filter(b => b.booking_status === 'COMPLETED').length;

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id?.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || booking.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, paymentFilter]);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const updateBookingStatus = async (bookingId, status) => {
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/api/bookings/${bookingId}/status`, { 
        booking_status: status 
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const updatePaymentStatus = async (bookingId, status) => {
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/api/bookings/${bookingId}/payment`, { 
        payment_status: status 
      });
      onRefresh();
      setShowPaymentModal(false);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error updating payment:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getBookingStatusBadge = (status) => {
    const statusMap = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      'PENDING': 'bg-orange-100 text-orange-800',
      'PAID': 'bg-green-100 text-green-800',
      'REFUNDED': 'bg-purple-100 text-purple-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 font-medium bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Bookings Management</h2>
        <p className="text-gray-500 text-sm mt-1">Manage customer bookings and payments</p>
      </div>

      {/* 🔢 NEW STATS ROW ADDED HERE */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-enter">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Bookings</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalBookings}</h3>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
            <i className="fa-regular fa-calendar-check text-lg"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Pending Payment</p>
            <h3 className="text-2xl font-bold text-orange-500">{pendingPayments}</h3>
          </div>
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
            <i className="fa-regular fa-clock text-lg"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Pending Confirmation</p>
            <h3 className="text-2xl font-bold text-yellow-500">{pendingConfirmations}</h3>
          </div>
          <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-500">
            <i className="fa-solid fa-hourglass-half text-lg"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Completed</p>
            <h3 className="text-2xl font-bold text-green-500">{completedBookings}</h3>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-500">
            <i className="fa-solid fa-circle-check text-lg"></i>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search bookings..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Booking Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors cursor-pointer"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All Payment Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
          </select>

          <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 justify-center">
            <i className="fa-solid fa-filter"></i> Apply Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Booking Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.map((booking) => (
                <tr key={booking.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-800">#{booking.id}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                        {booking.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{booking.full_name}</p>
                        <p className="text-xs text-gray-500">{booking.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">{booking.service_type}</td>
                  <td className="py-4 px-4">
                    {new Date(booking.preferred_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-4 px-4 font-bold text-gray-800">₱ {parseFloat(booking.total_price).toFixed(2)}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(booking.payment_status)}`}>
                      {booking.payment_status || 'PENDING'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBookingStatusBadge(booking.booking_status)}`}>
                      {booking.booking_status || 'PENDING'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition-colors"
                        title="View Details"
                      >
                        <i className="fa-regular fa-eye"></i>
                      </button>
                      {booking.booking_status === 'PENDING' && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                          className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-full transition-colors"
                          title="Confirm Booking"
                          disabled={actionLoading}
                        >
                          <i className="fa-solid fa-check"></i>
                        </button>
                      )}
                      {booking.booking_status === 'PENDING' && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition-colors"
                          title="Cancel Booking"
                          disabled={actionLoading}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length} results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = (totalPages <= 5) ? i + 1 : (currentPage <= 3) ? i + 1 : (currentPage >= totalPages - 2) ? totalPages - 4 + i : currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center border rounded text-sm transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDetailsModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Booking #{selectedBooking.id}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Name</p><p className="font-medium text-gray-800">{selectedBooking.full_name}</p></div>
                  <div><p className="text-xs text-gray-500">Phone</p><p className="font-medium text-gray-800">{selectedBooking.phone || 'N/A'}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-500">Email</p><p className="font-medium text-gray-800">{selectedBooking.email}</p></div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Service</p><p className="font-medium text-gray-800">{selectedBooking.service_type}</p></div>
                  <div><p className="text-xs text-gray-500">Service Address</p><p className="font-medium text-gray-800">{selectedBooking.service_address}</p></div>
                  <div><p className="text-xs text-gray-500">Area Size</p><p className="font-medium text-gray-800">{selectedBooking.area_size} m²</p></div>
                  <div><p className="text-xs text-gray-500">Preferred Date</p><p className="font-medium text-gray-800">{new Date(selectedBooking.preferred_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                  <div><p className="text-xs text-gray-500">Preferred Time</p><p className="font-medium text-gray-800">{selectedBooking.preferred_time}</p></div>
                  {selectedBooking.notes && <div className="col-span-2"><p className="text-xs text-gray-500">Notes</p><p className="font-medium text-gray-800">{selectedBooking.notes}</p></div>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Total Amount</p><p className="text-lg font-bold text-gray-800">₱ {parseFloat(selectedBooking.total_price).toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-500">Price per sqm</p><p className="font-medium text-gray-800">₱ {parseFloat(selectedBooking.price_per_sqm).toFixed(2)}/m²</p></div>
                  <div><p className="text-xs text-gray-500">Payment Method</p><p className="font-medium text-gray-800">{selectedBooking.payment_method || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Payment Status</p><span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(selectedBooking.payment_status)}`}>{selectedBooking.payment_status || 'PENDING'}</span></div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Status Management</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs text-gray-500">Booking Status</p><span className={`px-3 py-1 rounded-full text-xs font-medium ${getBookingStatusBadge(selectedBooking.booking_status)}`}>{selectedBooking.booking_status || 'PENDING'}</span></div>
                    <div className="flex gap-2">
                      {selectedBooking.booking_status === 'PENDING' && (
                        <>
                          <button onClick={() => updateBookingStatus(selectedBooking.id, 'CONFIRMED')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors" disabled={actionLoading}>Confirm Booking</button>
                          <button onClick={() => updateBookingStatus(selectedBooking.id, 'CANCELLED')} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors" disabled={actionLoading}>Cancel</button>
                        </>
                      )}
                      {selectedBooking.booking_status === 'CONFIRMED' && <button onClick={() => updateBookingStatus(selectedBooking.id, 'COMPLETED')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors" disabled={actionLoading}>Mark as Completed</button>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <div><p className="text-xs text-gray-500">Payment Status</p><span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(selectedBooking.payment_status)}`}>{selectedBooking.payment_status || 'PENDING'}</span></div>
                    <button onClick={() => { setShowPaymentModal(true); setShowDetailsModal(false); }} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">View Payment</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Verification Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowPaymentModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Verify Payment - Booking #{selectedBooking.id}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Payment Details:</p>
                <p className="text-lg font-bold text-gray-800">₱ {parseFloat(selectedBooking.total_price).toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">Method: {selectedBooking.payment_method}</p>
                <p className="text-sm text-gray-500">Reference: {selectedBooking.payment_reference || 'N/A'}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verify Payment Status</label>
                  <div className="flex gap-2">
                    <button onClick={() => updatePaymentStatus(selectedBooking.id, 'PAID')} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors" disabled={actionLoading}><i className="fa-solid fa-check mr-2"></i>Mark as Paid</button>
                    <button onClick={() => updatePaymentStatus(selectedBooking.id, 'FAILED')} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors" disabled={actionLoading}><i className="fa-solid fa-xmark mr-2"></i>Mark as Failed</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  
  const [adminInfo, setAdminInfo] = useState(() => {
    const info = localStorage.getItem('adminInfo');
    return info ? JSON.parse(info) : { full_name: 'Admin User', email: 'admin@cleangenie.com', role: 'SUPER_ADMIN' };
  });

  const itemsPerPage = 5;
  const navigate = useNavigate();
  const location = useLocation();

  const lineChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const barChartRef = useRef(null);
  const chartInstances = useRef([]);

  // LOGOUT FUNCTION
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    window.location.href = '/login';
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/bookings`);
      setBookings(response.data);
      setError(null);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Failed to load data. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
  const collectedRevenue = bookings.filter(b => b.payment_status === 'PAID').reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);
  const pendingBookings = bookings.filter(b => b.booking_status === 'PENDING').length;
  const completedBookings = bookings.filter(b => b.booking_status === 'COMPLETED').length;
  const failedBookings = bookings.filter(b => b.payment_status === 'FAILED').length;
  const pendingPayments = bookings.filter(b => b.payment_status === 'PENDING').length;

  const filteredBookings = bookings.filter((booking) => {
    return (
      booking.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (loading || !window.Chart) return;
    chartInstances.current.forEach(instance => instance.destroy());
    chartInstances.current = [];

    const ctxLine = lineChartRef.current?.getContext('2d');
    const ctxDoughnut = doughnutChartRef.current?.getContext('2d');
    const ctxBar = barChartRef.current?.getContext('2d');

    const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

    if (ctxLine) {
      chartInstances.current.push(new window.Chart(ctxLine, {
        type: 'line',
        data: {
          labels: ['May 1', 'May 6', 'May 11', 'May 16', 'May 21', 'May 26', 'May 31'],
          datasets: [{ label: 'Bookings', data: [10, 20, 15, 30, 25, 40, 30], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderWidth: 2, tension: 0.4, fill: true }]
        }, options: commonOptions
      }));
    }

    if (ctxDoughnut) {
      chartInstances.current.push(new window.Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
          labels: ['Post-Construction', 'Deep Cleaning', 'Move In/Out', 'Home/Office'],
          datasets: [{ data: [82, 64, 30, 18], backgroundColor: ['#3b82f6', '#2dd4bf', '#fdba74', '#a78bfa'], borderWidth: 0, hoverOffset: 8 }]
        }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
      }));
    }

    if (ctxBar) {
      chartInstances.current.push(new window.Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: ['May 1', 'May 5', 'May 9', 'May 13', 'May 17', 'May 21', 'May 25', 'May 29'],
          datasets: [{ label: 'Revenue', data: [15000, 25000, 18000, 35000, 28000, 45000, 32000, 40000], backgroundColor: '#3b82f6', borderRadius: 4 }]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: function(value) { return '₱' + value/1000 + 'k'; } } } } }
      }));
    }

    return () => { chartInstances.current.forEach(instance => instance.destroy()); chartInstances.current = []; };
  }, [loading, bookings]);

  const updateBookingStatus = async (bookingId, status) => {
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/api/bookings/${bookingId}/status`, { 
        booking_status: status 
      });
      fetchBookings();
      setShowDetailsModal(false);
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const updatePaymentStatus = async (bookingId, status) => {
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/api/bookings/${bookingId}/payment`, { 
        payment_status: status 
      });
      fetchBookings();
      setShowPaymentModal(false);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error updating payment:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getBookingStatusBadge = (status) => {
    const statusMap = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      'PENDING': 'bg-orange-100 text-orange-800',
      'PAID': 'bg-green-100 text-green-800',
      'REFUNDED': 'bg-purple-100 text-purple-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3 border-b border-gray-700/50 hover:bg-sidebar-hover transition-colors cursor-pointer">
        <div className="bg-transparent">
          <img 
            src={genieLogo} 
            alt="Clean Genie" 
            className="w-12 h-12 object-contain transition-transform hover:scale-110"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight tracking-wide">CLEAN GENIE</h1>
          <p className="text-[10px] text-gray-400 tracking-wider uppercase">Cleaning Co</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Main</p>
          <Link 
            to="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${location.pathname === '/' ? 'bg-primary text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'}`}
          >
            <i className="fa-solid fa-house w-5 text-center"></i><span className="font-medium">Dashboard</span>
          </Link>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Bookings</p>
          <nav className="space-y-1">
            {['All Bookings', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((item) => {
              const badge = item === 'Pending' ? 24 : item === 'Confirmed' ? 89 : item === 'Completed' ? 156 : item === 'Cancelled' ? 4 : null;
              const path = item === 'All Bookings' ? '/bookings' : `/bookings/${item.toLowerCase().replace(' ', '-')}`;
              return (
                <Link 
                  to={path} 
                  key={item} 
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-colors duration-200 ${location.pathname === path ? 'bg-sidebar-hover text-white' : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <i className={`w-5 text-center fa-${item === 'All Bookings' ? 'regular fa-calendar' : item === 'Pending' ? 'regular fa-clock' : item === 'Confirmed' ? 'regular fa-circle-check' : item === 'Completed' ? 'fa-solid fa-check-double' : 'fa-regular fa-circle-xmark'}`}></i>
                    <span className="text-sm">{item}</span>
                  </div>
                  {badge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item === 'Cancelled' ? 'bg-red-500' : item === 'Pending' ? 'bg-orange-500' : 'bg-blue-500'}`}>{badge}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Management</p>
          <nav className="space-y-1">
            <Link to="/customers" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-sidebar-hover hover:text-white rounded-lg cursor-pointer transition-colors duration-200"><i className="fa-regular fa-user w-5 text-center"></i><span className="text-sm">Customers</span></Link>
            {adminInfo.role === 'SUPER_ADMIN' && (
              <Link to="/admins" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-sidebar-hover hover:text-white rounded-lg cursor-pointer transition-colors duration-200"><i className="fa-solid fa-shield-halved w-5 text-center"></i><span className="text-sm">Admins</span></Link>
            )}
          </nav>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Reports</p>
          <nav className="space-y-1">
            <Link to="/reports" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-sidebar-hover hover:text-white rounded-lg cursor-pointer transition-colors duration-200"><i className="fa-solid fa-file-lines w-5 text-center"></i><span className="text-sm">Reports</span></Link>
            <Link to="/analytics" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-sidebar-hover hover:text-white rounded-lg cursor-pointer transition-colors duration-200"><i className="fa-solid fa-chart-column w-5 text-center"></i><span className="text-sm">Analytics</span></Link>
          </nav>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Settings</p>
          <nav className="space-y-1">
            <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-sidebar-hover hover:text-white rounded-lg cursor-pointer transition-colors duration-200"><i className="fa-solid fa-gear w-5 text-center"></i><span className="text-sm">Settings</span></Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-sidebar-hover hover:text-white rounded-lg cursor-pointer transition-colors duration-200"
            >
              <i className="fa-solid fa-right-from-bracket w-5 text-center"></i>
              <span className="text-sm">Logout</span>
            </button>
          </nav>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-700/50">
        <div className="bg-gray-800 p-4 rounded-xl text-center relative overflow-hidden group hover:bg-gray-700 transition-colors duration-300">
          <i className="fa-solid fa-gear absolute top-2 right-2 text-gray-600 text-xs animate-spin-slow"></i>
          <div className="mb-3"><h4 className="font-semibold text-sm">Keep your business</h4><h4 className="font-semibold text-sm">running smoothly.</h4></div>
          <button className="w-full bg-slate-700 group-hover:bg-slate-600 text-white text-xs font-medium py-2 rounded-lg transition-all duration-300 hover:scale-[1.02]">View Reports</button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      <style>{animationStyles}</style>
      
      <aside className={`bg-sidebar text-white flex-col h-full fixed left-0 top-0 z-50 shadow-2xl transition-all duration-300 hidden lg:flex ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        {isSidebarCollapsed ? (
          <div className="p-6 flex justify-center border-b border-gray-700/50">
            <img src={genieLogo} alt="Clean Genie" className="w-10 h-10 object-contain" />
          </div>
        ) : (
          <div className="p-6 flex items-center gap-3 border-b border-gray-700/50 hover:bg-sidebar-hover transition-colors cursor-pointer">
            <img src={genieLogo} alt="Clean Genie" className="w-12 h-12 object-contain transition-transform hover:scale-110" />
            <div>
              <h1 className="text-xl font-bold leading-tight tracking-wide">CLEAN GENIE</h1>
              <p className="text-[10px] text-gray-400 tracking-wider uppercase">Cleaning Co</p>
            </div>
          </div>
        )}
        
        <div className={`flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar ${isSidebarCollapsed ? 'px-2' : ''}`}>
          <div>
            {!isSidebarCollapsed && <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Main</p>}
            <Link 
              to="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${location.pathname === '/' ? 'bg-primary text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? 'Dashboard' : ''}
            >
              <i className="fa-solid fa-house w-5 text-center"></i>
              {!isSidebarCollapsed && <span className="font-medium">Dashboard</span>}
            </Link>
          </div>

          <div>
            {!isSidebarCollapsed && <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Bookings</p>}
            <nav className="space-y-1">
              {['All Bookings', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((item) => {
                const badge = item === 'Pending' ? 24 : item === 'Confirmed' ? 89 : item === 'Completed' ? 156 : item === 'Cancelled' ? 4 : null;
                const path = item === 'All Bookings' ? '/bookings' : `/bookings/${item.toLowerCase().replace(' ', '-')}`;
                return (
                  <Link 
                    to={path} 
                    key={item} 
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-colors duration-200 ${location.pathname === path ? 'bg-sidebar-hover text-white' : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    title={isSidebarCollapsed ? item : ''}
                  >
                    <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                      <i className={`w-5 text-center fa-${item === 'All Bookings' ? 'regular fa-calendar' : item === 'Pending' ? 'regular fa-clock' : item === 'Confirmed' ? 'regular fa-circle-check' : item === 'Completed' ? 'fa-solid fa-check-double' : 'fa-regular fa-circle-xmark'}`}></i>
                      {!isSidebarCollapsed && <span className="text-sm">{item}</span>}
                    </div>
                    {!isSidebarCollapsed && badge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item === 'Cancelled' ? 'bg-red-500' : item === 'Pending' ? 'bg-orange-500' : 'bg-blue-500'}`}>{badge}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            {!isSidebarCollapsed && <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Management</p>}
            <nav className="space-y-1">
              <Link to="/customers" className={`flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-sidebar-hover hover:text-white rounded-lg cursor-pointer transition-colors duration-200 ${isSidebarCollapsed ? 'justify-center' : ''}`} title={isSidebarCollapsed ? 'Customers' : ''}>
                <i className="fa-regular fa-user w-5 text-center"></i>
                {!isSidebarCollapsed && <span className="text-sm">Customers</span>}
              </Link>
              {adminInfo.role === 'SUPER_ADMIN' && (
                <Link to="/admins" className={`flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-sidebar-hover hover:text-white rounded-lg cursor-pointer transition-colors duration-200 ${isSidebarCollapsed ? 'justify-center' : ''}`} title={isSidebarCollapsed ? 'Admins' : ''}>
                  <i className="fa-solid fa-shield-halved w-5 text-center"></i>
                  {!isSidebarCollapsed && <span className="text-sm">Admins</span>}
                </Link>
              )}
            </nav>
          </div>

          <div>
            {!isSidebarCollapsed && <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Reports</p>}
            <nav className="space-y-1">
              <Link to="/reports" className={`flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-sidebar-hover hover:text-white rounded-lg cursor-pointer transition-colors duration-200 ${isSidebarCollapsed ? 'justify-center' : ''}`} title={isSidebarCollapsed ? 'Reports' : ''}>
                <i className="fa-solid fa-file-lines w-5 text-center"></i>
                {!isSidebarCollapsed && <span className="text-sm">Reports</span>}
              </Link>
              <Link to="/analytics" className={`flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-sidebar-hover hover:text-white rounded-lg cursor-pointer transition-colors duration-200 ${isSidebarCollapsed ? 'justify-center' : ''}`} title={isSidebarCollapsed ? 'Analytics' : ''}>
                <i className="fa-solid fa-chart-column w-5 text-center"></i>
                {!isSidebarCollapsed && <span className="text-sm">Analytics</span>}
              </Link>
            </nav>
          </div>

          <div>
            {!isSidebarCollapsed && <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Settings</p>}
            <nav className="space-y-1">
              <Link to="/settings" className={`flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-sidebar-hover hover:text-white rounded-lg cursor-pointer transition-colors duration-200 ${isSidebarCollapsed ? 'justify-center' : ''}`} title={isSidebarCollapsed ? 'Settings' : ''}>
                <i className="fa-solid fa-gear w-5 text-center"></i>
                {!isSidebarCollapsed && <span className="text-sm">Settings</span>}
              </Link>
              <button 
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-sidebar-hover hover:text-white rounded-lg cursor-pointer transition-colors duration-200 ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={isSidebarCollapsed ? 'Logout' : ''}
              >
                <i className="fa-solid fa-right-from-bracket w-5 text-center"></i>
                {!isSidebarCollapsed && <span className="text-sm">Logout</span>}
              </button>
            </nav>
          </div>
        </div>
        
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-gray-700/50">
            <div className="bg-gray-800 p-4 rounded-xl text-center relative overflow-hidden group hover:bg-gray-700 transition-colors duration-300">
              <i className="fa-solid fa-gear absolute top-2 right-2 text-gray-600 text-xs animate-spin-slow"></i>
              <div className="mb-3"><h4 className="font-semibold text-sm">Keep your business</h4><h4 className="font-semibold text-sm">running smoothly.</h4></div>
              <button className="w-full bg-slate-700 group-hover:bg-slate-600 text-white text-xs font-medium py-2 rounded-lg transition-all duration-300 hover:scale-[1.02]">View Reports</button>
            </div>
          </div>
        )}
      </aside>

      {/* 📱 FIXED MOBILE SIDEBAR SCROLLING HERE */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="sidebar-overlay lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <aside className={`w-64 bg-sidebar text-white flex flex-col h-full fixed left-0 top-0 z-50 shadow-2xl lg:hidden mobile-slide-in overflow-hidden`}>
            <div className="flex justify-end p-4 shrink-0">
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <SidebarContent />
            </div>
          </aside>
        </>
      )}

      <main className={`flex-1 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ${isMobileMenuOpen ? 'ml-64' : 'ml-0'} flex flex-col h-screen overflow-hidden transition-all duration-300`}>
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              className="text-gray-500 hover:text-gray-700 lg:hidden transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
            
            <button 
              className="text-gray-500 hover:text-gray-700 hidden lg:block transition-colors"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars-staggered' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer group">
              <i className="fa-regular fa-bell text-xl text-gray-500 group-hover:text-blue-500 transition-colors"></i>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">2</span>
            </div>
            
            <div className="flex items-center gap-3 border-l pl-6 border-gray-200 relative">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}>
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold hover:bg-blue-200 transition-colors">
                  {adminInfo.full_name?.charAt(0) || 'A'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-700">{adminInfo.full_name}</p>
                  <p className="text-xs text-gray-500">{adminInfo.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</p>
                </div>
                <i className="fa-solid fa-chevron-down text-xs text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"></i>
              </div>

              {adminDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{adminInfo.full_name}</p>
                    <p className="text-xs text-gray-500 break-all">{adminInfo.email}</p>
                  </div>
                  <button 
                    onClick={() => navigate('/settings')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <i className="fa-solid fa-gear mr-2 text-gray-400"></i> Settings
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <i className="fa-solid fa-right-from-bracket mr-2"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-enter">
                    <div><h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2><p className="text-gray-500 text-sm mt-1">Here's what's happening with your cleaning business today.</p></div>
                    <div className="bg-white border border-gray-200 rounded-lg p-2 px-4 flex items-center gap-2 text-sm text-gray-600 shadow-sm hover:shadow-md transition-shadow cursor-pointer"><i className="fa-regular fa-calendar text-gray-400"></i><span>May 1, 2026 - May 31, 2026</span></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group animate-enter">
                      <div className="flex justify-between items-start">
                        <div><p className="text-sm font-medium text-gray-500 mb-1">Total Bookings</p><h3 className="text-2xl font-bold text-gray-800">{totalBookings}</h3></div>
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><i className="fa-regular fa-calendar-check text-lg"></i></div>
                      </div>
                      <p className="text-xs text-green-600 font-medium mt-4 flex items-center gap-1"><i className="fa-solid fa-arrow-up"></i> {completedBookings} Completed</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group animate-enter">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Collected Revenue</p>
                          <h3 className="text-2xl font-bold text-green-600">₱ {collectedRevenue.toFixed(2)}</h3>
                        </div>
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform"><i className="fa-solid fa-coins text-lg"></i></div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Collection Rate</span>
                          <span className="font-bold text-green-600">{totalRevenue > 0 ? ((collectedRevenue / totalRevenue) * 100).toFixed(1) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-green-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (collectedRevenue / totalRevenue) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group animate-enter">
                      <div className="flex justify-between items-start">
                        <div><p className="text-sm font-medium text-gray-500 mb-1">Pending Payments</p><h3 className="text-2xl font-bold text-orange-500">{pendingPayments}</h3></div>
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform"><i className="fa-regular fa-clock text-lg"></i></div>
                      </div>
                      <p className="text-xs text-orange-600 font-medium mt-4">₱ {bookings.filter(b => b.payment_status === 'PENDING').reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0).toFixed(2)} to verify</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group animate-enter">
                      <div className="flex justify-between items-start">
                        <div><p className="text-sm font-medium text-gray-500 mb-1">Failed Payments</p><h3 className="text-2xl font-bold text-red-500">{failedBookings}</h3></div>
                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform"><i className="fa-solid fa-circle-xmark text-lg"></i></div>
                      </div>
                      <p className="text-xs text-red-600 font-medium mt-4">₱ {bookings.filter(b => b.payment_status === 'FAILED').reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0).toFixed(2)} lost</p>
                    </div>
                  </div>

                  {adminInfo.role === 'SUPER_ADMIN' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-enter">
                      <div className="flex flex-wrap gap-3">
                        <Link to="/bookings" className="flex-1 min-w-[150px] bg-blue-50 text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors text-center"><i className="fa-solid fa-plus mr-2"></i> New Booking</Link>
                        <Link to="/admins" className="flex-1 min-w-[150px] bg-purple-50 text-purple-600 px-4 py-3 rounded-lg hover:bg-purple-100 transition-colors text-center"><i className="fa-solid fa-shield-halved mr-2"></i> Manage Admins</Link>
                        <Link to="/reports" className="flex-1 min-w-[150px] bg-green-50 text-green-600 px-4 py-3 rounded-lg hover:bg-green-100 transition-colors text-center"><i className="fa-solid fa-file-lines mr-2"></i> View Reports</Link>
                        <Link to="/customers" className="flex-1 min-w-[150px] bg-orange-50 text-orange-600 px-4 py-3 rounded-lg hover:bg-orange-100 transition-colors text-center"><i className="fa-solid fa-users mr-2"></i> Customers</Link>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-enter">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-72"><h3 className="font-semibold text-gray-800 mb-4">Bookings Overview</h3><canvas ref={lineChartRef} className="h-[80%] w-full"></canvas></div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-72"><h3 className="font-semibold text-gray-800 mb-4">Top Services</h3><canvas ref={doughnutChartRef} className="h-[80%] w-full mx-auto"></canvas></div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-72"><h3 className="font-semibold text-gray-800 mb-4">Revenue Overview</h3><canvas ref={barChartRef} className="h-[80%] w-full"></canvas></div>
                  </div>

                  {(failedBookings > 0 || pendingPayments > 0) && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-enter">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-800">⚠️ Needs Attention</h3>
                        <Link to="/bookings" className="text-sm text-blue-600 hover:underline">View All</Link>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs">
                            <tr><th className="py-3 px-4">ID</th><th className="py-3 px-4">Customer</th><th className="py-3 px-4">Amount</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-center">Action</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {bookings.filter(b => b.payment_status === 'FAILED' || b.payment_status === 'PENDING').slice(0, 4).map(b => (
                              <tr key={b.id} className="hover:bg-gray-50">
                                <td className="py-4 px-4">#{b.id}</td>
                                <td className="py-4 px-4">{b.full_name}</td>
                                <td className="py-4 px-4 font-bold">₱ {parseFloat(b.total_price).toFixed(2)}</td>
                                <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${b.payment_status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{b.payment_status}</span></td>
                                <td className="py-4 px-4 text-center">
                                  <button onClick={() => { setSelectedBooking(b); setShowDetailsModal(true); }} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition-colors" title="View Details"><i className="fa-regular fa-eye"></i></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-enter">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                      <h3 className="font-bold text-lg text-gray-800">Recent Bookings</h3>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                          <input type="text" placeholder="Search bookings..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2"><i className="fa-solid fa-filter"></i> Filter</button>
                      </div>
                    </div>
                    
                    {loading && <div className="text-center py-8 text-gray-400 animate-pulse">Loading bookings...</div>}
                    {error && <div className="text-center py-8 text-red-500 font-medium bg-red-50 rounded-lg">{error}</div>}
                    
                    {!loading && !error && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                          <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs rounded-lg">
                            <tr><th className="py-3 px-4 rounded-l-lg">ID</th><th className="py-3 px-4">Customer</th><th className="py-3 px-4">Email</th><th className="py-3 px-4">Service</th><th className="py-3 px-4">Area</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Total Price</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 rounded-r-lg text-center">Actions</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {currentItems.map((booking) => {
                              const status = booking.payment_status || 'PENDING';
                              return (
                                <tr key={booking.id} className="group hover:bg-blue-50/50 transition-colors duration-200">
                                  <td className="py-4 px-4 font-medium text-gray-800">#{booking.id}</td>
                                  <td className="py-4 px-4 flex items-center gap-3"><div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 group-hover:bg-blue-200 transition-colors">{booking.full_name?.charAt(0) || 'U'}</div><span className="font-medium text-gray-800">{booking.full_name}</span></td>
                                  <td className="py-4 px-4">{booking.email}</td>
                                  <td className="py-4 px-4">{booking.service_type}</td>
                                  <td className="py-4 px-4">{booking.area_size} m²</td>
                                  <td className="py-4 px-4">{new Date(booking.preferred_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                  <td className="py-4 px-4 font-bold text-gray-800">₱ {parseFloat(booking.total_price).toFixed(2)}</td>
                                  <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${status === 'PAID' ? 'bg-green-100 text-green-700' : status === 'FAILED' ? 'bg-red-100 text-red-700' : status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{status}</span></td>
                                  <td className="py-4 px-4 text-center">
                                    <button onClick={() => { setSelectedBooking(booking); setShowDetailsModal(true); }} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-all duration-200" title="View Details"><i className="fa-regular fa-eye"></i></button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        
                        {/* PAGINATION RESTORED */}
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-100 gap-4">
                          <p className="text-sm text-gray-500">Showing {filteredBookings.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length} results</p>
                          {filteredBookings.length > itemsPerPage && (
                            <div className="flex items-center gap-1">
                              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum = (totalPages <= 5) ? i + 1 : (currentPage <= 3) ? i + 1 : (currentPage >= totalPages - 2) ? totalPages - 4 + i : currentPage - 2 + i;
                                return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 flex items-center justify-center border rounded text-sm transition-colors ${currentPage === pageNum ? 'bg-primary text-white border-primary shadow-md shadow-blue-500/20' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{pageNum}</button>;
                              })}
                              {totalPages > 5 && currentPage < totalPages - 2 && <span className="px-1 text-gray-400">...</span>}
                              {totalPages > 5 && currentPage < totalPages - 2 && <button onClick={() => setCurrentPage(totalPages)} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors text-sm">{totalPages}</button>}
                              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><i className="fa-solid fa-chevron-right text-xs"></i></button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/bookings" element={ <ProtectedRoute><BookingsPage bookings={bookings} loading={loading} error={error} onRefresh={fetchBookings} /></ProtectedRoute> } />
            <Route path="/bookings/pending" element={ <ProtectedRoute><BookingsPage bookings={bookings.filter(b => b.booking_status === 'PENDING')} loading={loading} error={error} onRefresh={fetchBookings} /></ProtectedRoute> } />
            <Route path="/bookings/confirmed" element={ <ProtectedRoute><BookingsPage bookings={bookings.filter(b => b.booking_status === 'CONFIRMED')} loading={loading} error={error} onRefresh={fetchBookings} /></ProtectedRoute> } />
            <Route path="/bookings/completed" element={ <ProtectedRoute><BookingsPage bookings={bookings.filter(b => b.booking_status === 'COMPLETED')} loading={loading} error={error} onRefresh={fetchBookings} /></ProtectedRoute> } />
            <Route path="/bookings/cancelled" element={ <ProtectedRoute><BookingsPage bookings={bookings.filter(b => b.booking_status === 'CANCELLED')} loading={loading} error={error} onRefresh={fetchBookings} /></ProtectedRoute> } />
            
            <Route path="/services" element={<ProtectedRoute><PagePlaceholder title="Services" /></ProtectedRoute>} />
            <Route path="/areas" element={<ProtectedRoute><PagePlaceholder title="Areas" /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><PagePlaceholder title="Customers" /></ProtectedRoute>} />
            
            {adminInfo.role === 'SUPER_ADMIN' ? (
              <Route path="/admins" element={<ProtectedRoute><AdminPages /></ProtectedRoute>} />
            ) : (
              <Route path="/admins" element={<ProtectedRoute><PagePlaceholder title="Access Denied" /></ProtectedRoute>} />
            )}
            
            <Route path="/reports" element={ <ProtectedRoute><ReportsPage bookings={bookings} loading={loading} error={error} /></ProtectedRoute> } />
            <Route path="/analytics" element={<ProtectedRoute><PagePlaceholder title="Analytics" /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><PagePlaceholder title="Settings" /></ProtectedRoute>} />
            <Route path="/logout" element={<PagePlaceholder title="Logging out..." />} />
          </Routes>
        </div>
      </main>

      {/* GLOBAL DASHBOARD BOOKING DETAILS MODAL */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDetailsModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Booking #{selectedBooking.id}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Name</p><p className="font-medium text-gray-800">{selectedBooking.full_name}</p></div>
                  <div><p className="text-xs text-gray-500">Phone</p><p className="font-medium text-gray-800">{selectedBooking.phone || 'N/A'}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-500">Email</p><p className="font-medium text-gray-800">{selectedBooking.email}</p></div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Service</p><p className="font-medium text-gray-800">{selectedBooking.service_type}</p></div>
                  <div><p className="text-xs text-gray-500">Service Address</p><p className="font-medium text-gray-800">{selectedBooking.service_address}</p></div>
                  <div><p className="text-xs text-gray-500">Area Size</p><p className="font-medium text-gray-800">{selectedBooking.area_size} m²</p></div>
                  <div><p className="text-xs text-gray-500">Preferred Date</p><p className="font-medium text-gray-800">{new Date(selectedBooking.preferred_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                  <div><p className="text-xs text-gray-500">Preferred Time</p><p className="font-medium text-gray-800">{selectedBooking.preferred_time}</p></div>
                  {selectedBooking.notes && <div className="col-span-2"><p className="text-xs text-gray-500">Notes</p><p className="font-medium text-gray-800">{selectedBooking.notes}</p></div>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Total Amount</p><p className="text-lg font-bold text-gray-800">₱ {parseFloat(selectedBooking.total_price).toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-500">Price per sqm</p><p className="font-medium text-gray-800">₱ {parseFloat(selectedBooking.price_per_sqm).toFixed(2)}/m²</p></div>
                  <div><p className="text-xs text-gray-500">Payment Method</p><p className="font-medium text-gray-800">{selectedBooking.payment_method || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Payment Status</p><span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(selectedBooking.payment_status)}`}>{selectedBooking.payment_status || 'PENDING'}</span></div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Status Management</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs text-gray-500">Booking Status</p><span className={`px-3 py-1 rounded-full text-xs font-medium ${getBookingStatusBadge(selectedBooking.booking_status)}`}>{selectedBooking.booking_status || 'PENDING'}</span></div>
                    <div className="flex gap-2">
                      {selectedBooking.booking_status === 'PENDING' && (
                        <>
                          <button onClick={() => updateBookingStatus(selectedBooking.id, 'CONFIRMED')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors" disabled={actionLoading}>Confirm Booking</button>
                          <button onClick={() => updateBookingStatus(selectedBooking.id, 'CANCELLED')} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors" disabled={actionLoading}>Cancel</button>
                        </>
                      )}
                      {selectedBooking.booking_status === 'CONFIRMED' && <button onClick={() => updateBookingStatus(selectedBooking.id, 'COMPLETED')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors" disabled={actionLoading}>Mark as Completed</button>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <div><p className="text-xs text-gray-500">Payment Status</p><span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(selectedBooking.payment_status)}`}>{selectedBooking.payment_status || 'PENDING'}</span></div>
                    <button onClick={() => { setShowPaymentModal(true); setShowDetailsModal(false); }} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">View Payment</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL PAYMENT VERIFICATION MODAL */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowPaymentModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Verify Payment - Booking #{selectedBooking.id}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Payment Details:</p>
                <p className="text-lg font-bold text-gray-800">₱ {parseFloat(selectedBooking.total_price).toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">Method: {selectedBooking.payment_method}</p>
                <p className="text-sm text-gray-500">Reference: {selectedBooking.payment_reference || 'N/A'}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verify Payment Status</label>
                  <div className="flex gap-2">
                    <button onClick={() => updatePaymentStatus(selectedBooking.id, 'PAID')} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors" disabled={actionLoading}><i className="fa-solid fa-check mr-2"></i>Mark as Paid</button>
                    <button onClick={() => updatePaymentStatus(selectedBooking.id, 'FAILED')} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors" disabled={actionLoading}><i className="fa-solid fa-xmark mr-2"></i>Mark as Failed</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;