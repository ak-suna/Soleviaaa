import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { LayoutDashboard, Users, AlertTriangle, UserPlus, Calendar } from 'lucide-react';
import logo from '../assets/images/logo.png';

const ModeratorSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { groupId } = useParams();

    const navItems = [
        { icon: LayoutDashboard, path: `/admin/groups/${groupId}/moderator/dashboard`, label: 'Dashboard' },
        { icon: Users, path: `/admin/groups/${groupId}/moderator/members`, label: 'Members' },
        { icon: AlertTriangle, path: `/admin/groups/${groupId}/moderator/reports`, label: 'Reports' },
        { icon: UserPlus, path: `/admin/groups/${groupId}/moderator/requests`, label: 'Requests' },
        { icon: Calendar, path: `/groups/${groupId}/moderator/sessions`, label: 'Sessions' },
    ];

    return (
        <div className="hidden lg:flex fixed left-6 top-0 flex flex-col items-center w-24 h-screen z-50">
            <div
                className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center p-2 mt-4 cursor-pointer"
                onClick={() => navigate(`/admin/groups/${groupId}/moderator/dashboard`)}
            >
                <img src={logo} alt="Logo" className="w-full h-full rounded-full object-cover" />
            </div>

            <div className="flex flex-col justify-center w-[75px] h-[600px] bg-[#f9d9e3] dark:bg-gray-900 backdrop-blur-sm rounded-full shadow-sm py-8 mt-12 border-2 border-gray-200 dark:border-gray-700 transition-all">
                <nav className="flex flex-col justify-center gap-8 w-full items-center">
                    {navItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={index}
                                onClick={() => navigate(item.path)}
                                title={item.label}
                                className={`flex flex-col items-center gap-1 w-[58px] py-2 rounded-2xl transition-all duration-200 relative border-2 border-transparent text-[12px] font-semibold sidebar-accessible-btn ${isActive
                                    ? 'bg-[#FFA669] text-white shadow-sm border-orange-400 dark:border-orange-500'
                                    : 'text-gray-700 dark:text-gray-200 hover:text-white hover:bg-[#f8ba90] dark:hover:bg-orange-900/40 dark:hover:text-orange-200'
                                    }`}
                            >
                                <item.icon size={26} strokeWidth={2} />
                                <span className="text-[10px] font-semibold leading-none tracking-tight">
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

export default ModeratorSidebar;