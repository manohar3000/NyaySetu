import React, { useState } from 'react';
import { LayoutDashboard, FileText, Calendar, Clock, User } from 'lucide-react';
import DocumentSummarizer from '../components/document/DocumentSummarizer';
import AppointmentScheduler from '../components/appointment/AppointmentScheduler';

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'appointments'>('documents');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if user is authenticated (you would typically get this from your auth context)
  const isAuthenticated = !!localStorage.getItem('token');

  // If not authenticated, redirect to login (you would typically use a router for this)
  if (!isAuthenticated) {
    // In a real app, you would use your router to redirect
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-indigo-800 text-white transition-all duration-300 ease-in-out overflow-hidden`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">LawAI</h1>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md hover:bg-indigo-700"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16m-7 6h7" 
              />
            </svg>
          </button>
        </div>
        
        <nav className="mt-8">
          <button
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'documents'
                ? 'bg-indigo-900 text-white'
                : 'text-indigo-200 hover:bg-indigo-700'
            }`}
          >
            <FileText className="w-5 h-5 mr-3" />
            {sidebarOpen && <span>Document Summarizer</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('appointments')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'appointments'
                ? 'bg-indigo-900 text-white'
                : 'text-indigo-200 hover:bg-indigo-700'
            }`}
          >
            <Calendar className="w-5 h-5 mr-3" />
            {sidebarOpen && <span>Appointments</span>}
          </button>
          
          {/* Add more navigation items as needed */}
          <div className="border-t border-indigo-700 mt-4 pt-4">
            <button
              className="w-full flex items-center px-6 py-3 text-sm font-medium text-indigo-200 hover:bg-indigo-700"
            >
              <User className="w-5 h-5 mr-3" />
              {sidebarOpen && <span>My Profile</span>}
            </button>
          </div>
        </nav>
        
        <div className="absolute bottom-0 w-full p-4">
          <div className="flex items-center text-xs text-indigo-300">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            {sidebarOpen && <span>Connected</span>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {activeTab === 'documents' ? 'Document Summarizer' : 'Appointment Scheduler'}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <div className="relative">
                <button className="flex items-center space-x-2 focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                    U
                  </div>
                  {sidebarOpen && <span className="text-sm font-medium">User</span>}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'documents' ? (
              <DocumentSummarizer />
            ) : (
              <AppointmentScheduler />
            )}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} LawAI. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;
