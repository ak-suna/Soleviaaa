import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, CheckSquare, Target, BarChart2, Users } from 'lucide-react';
import logo from '../assets/images/logo.png';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, path: '/user/dashboard', label: 'Dashboard' },
    { icon: BookOpen, path: '/journal', label: 'Journal' },
    { icon: CheckSquare, path: '/tasks', label: 'Habits' },
    { icon: Target, path: '/goals', label: 'Goals' },
    { icon: BarChart2, path: '/analytics', label: 'Analytics' },
    { icon: Users, path: '/community', label: 'Community' },
  ];

  const handleLogoClick = () => {
    navigate('/user/dashboard');
  };

  return (
    <div className="hidden lg:flex fixed left-6 top-0 flex-col items-center w-24 text-base h-screen z-50 transition-all sidebar-accessible">
      {/* Logo at the top */}
      <div
        className="w-20 h-20 rounded-full bg-white dark:bg-gray-900 shadow-lg flex items-center justify-center p-2 mt-4 cursor-pointer border-2 border-gray-200 dark:border-gray-700 transition-all"
        onClick={handleLogoClick}
      >
        <img
          src={logo}
          alt="Logo"
          className="w-12 h-12 dark:invert dark:brightness-90"
        />
      </div>

      {/* Navigation container */}
      <div className="flex flex-col justify-center w-[75px] h-[600px] bg-[#f9d9e3] dark:bg-gray-900 backdrop-blur-sm rounded-full shadow-sm py-8 mt-12 border-2 border-gray-200 dark:border-gray-700 transition-all">
        <nav className="flex flex-col justify-center gap-6 w-full items-center">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 w-[58px] py-2 rounded-2xl transition-all duration-200 relative border-2 border-transparent text-[12px] font-semibold sidebar-accessible-btn ${isActive
                  ? 'bg-[#FFA669] text-white shadow-sm border-orange-400 dark:border-orange-500'
                  : 'text-gray-700 dark:text-gray-200 hover:text-white hover:bg-[#f8ba90] dark:hover:bg-orange-900/40 dark:hover:text-orange-200'
                  }`}
                title={item.label}
              >
                <item.icon className="w-6 h-6" strokeWidth={2} />
                <span className="font-semibold leading-none tracking-tight w-full text-center">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -right-1 top-1 w-2 h-2 bg-[#FFA669] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;