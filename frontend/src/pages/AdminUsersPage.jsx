import React, { useState, useEffect } from "react";
import { getToken } from "../services/auth";
import { Users, Menu } from 'lucide-react';
import AdminSidebar from "../components/AdminSidebar";
import MobileMenu from "../components/MobileMenu";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import config from "../config";

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    // Modal state for disabling user
    const [disableModal, setDisableModal] = useState({ open: false, userId: null, currentStatus: false });
    const [disableReason, setDisableReason] = useState("");
    // Notification state
    const [notification, setNotification] = useState({ open: false, message: "", type: "success" });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = (userId, currentStatus) => {
        if (currentStatus) {
            // Enable directly with confirm modal
            setDisableModal({ open: true, userId, currentStatus });
            setDisableReason("");
        } else {
            // Open modal for reason
            setDisableModal({ open: true, userId, currentStatus });
            setDisableReason("");
        }
    };

    const handleDisableUser = async (userId, currentStatus, reason) => {
        const action = currentStatus ? "enable" : "disable";
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/admin/users/${userId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ disabled: !currentStatus, reason }),
            });
            if (!response.ok) throw new Error(`Failed to ${action} user`);
            fetchUsers();
            setNotification({ open: true, message: `User ${action === "enable" ? "enabled" : "disabled"} successfully.`, type: "success" });
        } catch (err) {
            setNotification({ open: true, message: err.message, type: "error" });
        }
        setDisableModal({ open: false, userId: null, currentStatus: false });
        setDisableReason("");
    };

    const changeRole = async (userId, newRole) => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) throw new Error("Failed to update role");
            fetchUsers();
            setNotification({ open: true, message: "Role updated successfully.", type: "success" });
        } catch (err) {
            setNotification({ open: true, message: err.message, type: "error" });
        }
    };

    const userColumns = [
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            accessor: (row) => `${row.firstName} ${row.lastName}`,
            render: (value) => (
                <span className="text-gray-900 dark:text-white font-medium">{value}</span>
            )
        },
        {
            key: 'email',
            label: 'Email',
            sortable: true,
            render: (value) => (
                <span className="text-gray-600 dark:text-gray-400">{value}</span>
            )
        },
        {
            key: 'role',
            label: 'Role',
            sortable: true,
            render: (value, row) => (
                <select
                    value={value}
                    onChange={(e) => {
                        e.stopPropagation();
                        changeRole(row._id, e.target.value);
                    }}
                    disabled={row.disabled}
                    className="px-4 py-2 rounded-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-[#f4873e] disabled:opacity-50 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            )
        },
        {
            key: 'disabled',
            label: 'Status',
            sortable: true,
            render: (value) => (
                <span className={`
                    px-4 py-2 rounded-full text-sm font-bold inline-block
                    ${value
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }
                `}>
                    {value ? "🔴 Disabled" : "🟢 Active"}
                </span>
            )
        },
        {
            key: 'isVerified',
            label: 'Verified',
            sortable: true,
            render: (value) => (
                <span className="text-2xl">{value ? "✅" : "❌"}</span>
            )
        },
        {
            key: 'phone',
            label: 'Phone',
            render: (value) => (
                <span className="text-gray-600 dark:text-gray-400">{value || "N/A"}</span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (value, row) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleUserStatus(row._id, row.disabled);
                    }}
                    className={`
                        px-5 py-2 rounded-full font-bold text-white transition-all hover:shadow-lg
                        ${row.disabled
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        }
                    `}
                >
                    {row.disabled ? "✅ Enable" : "🚫 Disable"}
                </button>
            )
        }
    ];

    return (
        <>
        {/* Notification Snackbar */}
        {notification.open && (
            <div
                className={`fixed top-8 left-1/2 z-50 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg font-semibold text-lg transition-all
                    ${notification.type === "success"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }
                `}
                style={{ minWidth: 280, textAlign: "center" }}
                onClick={() => setNotification({ ...notification, open: false })}
            >
                {notification.message}
            </div>
        )}
        <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setShowMobileMenu(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-700"
            >
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            {/* LEFT SIDEBAR */}
            <AdminSidebar />
            <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} type="admin" />

            {/* MAIN CENTER PANEL */}
            <div className="flex-1 lg:ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] p-4 lg:p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] relative max-h-[775px] overflow-y-auto">

                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3" style={{ fontFamily: "Brasika" }}>
                    <Users className="w-7 h-7 text-[#f4873e]" />
                    User Management
                </h2>

                {error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
                    </div>
                ) : (
                    <DataTable
                        columns={userColumns}
                        data={users}
                        loading={loading}
                        searchable={true}
                        searchPlaceholder="Search users by name, email..."
                        itemsPerPage={10}
                        emptyMessage="No users found"
                    />
                )}
            </div>

            {/* Top Right Navigation */}
            {/* <div className="absolute top-6 right-6 flex items-center gap-6">
                    <NotificationBell />
                    <button
                        onClick={() => navigate('/settings')}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg"
                    >
                        <Menu className="w-7 h-7 text-gray-600 dark:text-gray-300" />
                    </button>
                </div> */}
        </div>
        {/* Disable Reason Modal */}
        <Modal
            isOpen={disableModal.open}
            onClose={() => setDisableModal({ open: false, userId: null, currentStatus: false })}
            title={disableModal.currentStatus ? "Enable User" : "Disable User"}
        >
            <form
                onSubmit={e => {
                    e.preventDefault();
                    if (!disableModal.currentStatus && !disableReason.trim()) {
                        setNotification({ open: true, message: "A reason is required to disable a user.", type: "error" });
                        return;
                    }
                    handleDisableUser(disableModal.userId, disableModal.currentStatus, disableReason);
                }}
            >
                {!disableModal.currentStatus && (
                    <>
                        <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Reason for disabling:</label>
                        <textarea
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4873e]"
                            rows={3}
                            value={disableReason}
                            onChange={e => setDisableReason(e.target.value)}
                            placeholder="Enter reason..."
                            required
                        />
                    </>
                )}
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
                        onClick={() => setDisableModal({ open: false, userId: null, currentStatus: false })}
                    >Cancel</button>
                    <button
                        type="submit"
                        className={`px-6 py-2 rounded-lg font-bold text-white ${disableModal.currentStatus ? "bg-green-500 hover:bg-green-600" : "bg-[#f4873e] hover:bg-[#f8ba90]"}`}
                    >{disableModal.currentStatus ? "Enable" : "Disable"}</button>
                </div>
            </form>
        </Modal>
        </>
    );
};

export default AdminUsersPage;