import React from 'react';
import { X, Home, CheckSquare, BookOpen, Users, BarChart3, Settings, LayoutDashboard, User as UserIcon, Trophy, AlertTriangle, UserPlus, Calendar, Target } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileMenu = ({ isOpen, onClose, type = 'user', groupId }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const userNavItems = [
        { icon: Home, label: 'Dashboard', path: '/user/dashboard' },
        { icon: CheckSquare, label: 'Habits', path: '/tasks' },
        { icon: Target, label: 'Goals', path: '/goals' },
        { icon: BookOpen, label: 'Journal', path: '/journal' },
        { icon: Users, label: 'Community', path: '/community' },
        { icon: BarChart3, label: 'Analytics', path: '/analytics' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const adminNavItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: UserIcon, label: 'Users', path: '/admin/users' },
        { icon: Trophy, label: 'Challenges', path: '/admin/challenges' },
        { icon: Users, label: 'Groups', path: '/admin/groups' },
        { icon: AlertTriangle, label: 'Reports', path: '/admin/reports' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    const moderatorNavItems = groupId ? [
        { icon: LayoutDashboard, label: 'Dashboard', path: `/admin/groups/${groupId}/moderator/dashboard` },
        { icon: Users, label: 'Members', path: `/admin/groups/${groupId}/moderator/members` },
        { icon: AlertTriangle, label: 'Reports', path: `/admin/groups/${groupId}/moderator/reports` },
        { icon: UserPlus, label: 'Requests', path: `/admin/groups/${groupId}/moderator/requests` },
        { icon: Calendar, label: 'Sessions', path: `/groups/${groupId}/moderator/sessions` },
    ] : [];

    const navItems = type === 'admin' ? adminNavItems : type === 'moderator' ? moderatorNavItems : userNavItems;

    const handleNavigate = (path) => {
        navigate(path);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Menu Panel */}
            <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Brasika' }}>
                        Menu
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive
                                        ? 'bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white shadow-md'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            navigate('/login');
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium"
                    >
                        <X className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;
