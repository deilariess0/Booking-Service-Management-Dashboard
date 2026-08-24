import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import genieLogo from '../assets/genie.png';

const LoginPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // 🔒 SECURITY FIX: Get values from .env
    const API_URL = import.meta.env.VITE_API_URL;
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // 🔒 NEW: Redirect to dashboard if already logged in
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            navigate('/');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Email/Password Login & Signup
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 🔒 SECURITY FIX: Use API_URL variable
            const url = isSignUp ? `${API_URL}/api/auth/register` : `${API_URL}/api/auth/login`;
            const payload = isSignUp ? formData : { email: formData.email, password: formData.password };
            const response = await axios.post(url, payload);
            
            localStorage.setItem('adminToken', response.data.token);
            localStorage.setItem('adminInfo', JSON.stringify(response.data.admin));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    // Google Login
    const handleGoogleLogin = async (credential) => {
        try {
            // 🔒 SECURITY FIX: Use API_URL variable
            const response = await axios.post(`${API_URL}/api/auth/google`, { credential });
            localStorage.setItem('adminToken', response.data.token);
            localStorage.setItem('adminInfo', JSON.stringify(response.data.admin));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Google login failed');
        }
    };

    // Load Google Script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => {
            if (window.google && window.google.accounts) {
                window.google.accounts.id.initialize({
                    // 🔒 SECURITY FIX: Use GOOGLE_CLIENT_ID variable
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleLogin
                });
                window.google.accounts.id.renderButton(
                    document.getElementById('google-signin-button'),
                    { theme: 'outline', size: 'large', width: '100%' }
                );
            }
        };
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
            
            {/* Decorative Background Blobs */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl"></div>

            {/* Main Container */}
            <div className="relative w-full max-w-5xl bg-white/60 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
                
                {/* LEFT SIDE - Branding (Hidden on mobile, shown on lg+) */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500/90 to-indigo-600/90 p-12 flex-col justify-between relative overflow-hidden">
                    {/* Decorative pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full"></div>
                        <div className="absolute bottom-20 right-10 w-32 h-32 bg-white rounded-full"></div>
                        <div className="absolute top-1/2 left-1/2 w-56 h-56 bg-white rounded-full"></div>
                    </div>

                    <div className="relative z-10">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-12">
                            <img src={genieLogo} alt="Clean Genie" className="w-14 h-14 object-contain bg-white rounded-2xl p-2" />
                            <div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight">CLEAN GENIE</h1>
                                <p className="text-xs text-blue-100 uppercase tracking-widest">Cleaning Co</p>
                            </div>
                        </div>

                        {/* Heading */}
                        <div className="mb-10">
                            <h2 className="text-5xl font-extrabold text-white leading-tight mb-4">
                                Welcome Back,<br />
                                <span className="text-yellow-300">Admin!</span>
                            </h2>
                            <p className="text-blue-100 text-lg leading-relaxed max-w-md">
                                Manage bookings, customers, services, and keep your cleaning business running smoothly.
                            </p>
                        </div>

                        {/* Feature List */}
                        <div className="space-y-5">
                            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <div className="bg-white/20 p-2.5 rounded-lg">
                                    <i className="fa-solid fa-chart-column text-white text-xl"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Real-time Overview</h4>
                                    <p className="text-blue-100 text-sm">Track bookings, revenue, and performance.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <div className="bg-white/20 p-2.5 rounded-lg">
                                    <i className="fa-solid fa-users text-white text-xl"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Customer Management</h4>
                                    <p className="text-blue-100 text-sm">Manage customers and their service history.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <div className="bg-white/20 p-2.5 rounded-lg">
                                    <i className="fa-solid fa-shield-halved text-white text-xl"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Secure & Reliable</h4>
                                    <p className="text-blue-100 text-sm">Your data is protected with top-level security.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Quote */}
                    <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                        <div className="flex gap-3">
                            <i className="fa-solid fa-quote-left text-yellow-300 text-2xl"></i>
                            <div>
                                <p className="text-white italic">Clean homes. Happy clients.<br />Better business every day.</p>
                                <p className="text-blue-100 text-sm mt-2">— Clean Genie Team</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - Login Form (Always visible) */}
                <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white/80 backdrop-blur-xl">
                    <div className="max-w-md w-full mx-auto">
                        
                        {/* Mobile Logo (Only shows on mobile) */}
                        <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                            <img src={genieLogo} alt="Clean Genie" className="w-12 h-12 object-contain" />
                            <div>
                                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">CLEAN GENIE</h1>
                                <p className="text-xs text-gray-500 uppercase tracking-widest">Cleaning Co</p>
                            </div>
                        </div>

                        {/* Header Icon */}
                        <div className="text-center mb-6 sm:mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                                <i className="fa-solid fa-lock text-white text-2xl"></i>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {isSignUp ? 'Create Account' : 'Welcome Back'}
                            </h2>
                            <p className="text-gray-500 mt-2 text-sm sm:text-base">
                                {isSignUp ? 'Sign up to access the dashboard' : 'Sign in to continue to your dashboard'}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
                                {error}
                            </div>
                        )}

                        {/* Google Button */}
                        <div className="border border-gray-200 rounded-xl p-3 flex items-center justify-center mb-5 hover:bg-gray-50 transition-colors">
                            <div id="google-signin-button" className="w-full"></div>
                        </div>

                        {/* Divider */}
                        <div className="relative mb-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 bg-white text-gray-400 font-medium">OR</span>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                            {isSignUp && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <i className="fa-regular fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                        <input 
                                            type="text" 
                                            name="full_name" 
                                            value={formData.full_name} 
                                            onChange={handleChange} 
                                            placeholder="Admin User"
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all text-gray-900 placeholder-gray-400"
                                            required 
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <i className="fa-regular fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        placeholder="Enter your email"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all text-gray-900 placeholder-gray-400"
                                        required 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        name="password" 
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        placeholder="Enter your password"
                                        className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all text-gray-900 placeholder-gray-400"
                                        required 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)} 
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <i className="fa-regular fa-eye-slash"></i> : <i className="fa-regular fa-eye"></i>}
                                    </button>
                                </div>
                            </div>

                            {!isSignUp && (
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                                        <span className="text-sm text-gray-600">Remember me</span>
                                    </label>
                                    <a href="#" className="text-sm text-blue-600 font-medium hover:underline">Forgot password?</a>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl hover:opacity-90 transition-all font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        {isSignUp ? 'Create Account' : 'Sign In'}
                                        <i className="fa-solid fa-arrow-right"></i>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Switch between Login/Signup */}
                        <div className="text-center mt-6">
                            <p className="text-gray-500 text-sm">
                                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                                <button 
                                    onClick={() => setIsSignUp(!isSignUp)} 
                                    className="text-blue-600 font-semibold hover:underline ml-1"
                                >
                                    {isSignUp ? 'Sign In' : 'Contact Super Admin'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;