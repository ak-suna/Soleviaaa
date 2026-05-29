import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../services/auth";
import { AlertTriangle, Eye, X, CheckCircle, Menu } from 'lucide-react';
import DataTable from "../components/DataTable";
import AdminSidebar from "../components/AdminSidebar";
import MobileMenu from "../components/MobileMenu";
import { showError, showSuccess } from "../utils/uiFeedback";
// import NotificationBell from '../components/NotificationBell';
import config from "../config";

const AdminReportsPage = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [selectedReport, setSelectedReport] = useState(null);
    const [viewingContent, setViewingContent] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);



    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${config.BACKEND_URL}/api/reports?status=${filter}`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setReports(data.reports || []);
        } catch (err) {
            showError(err.message || "Failed to load reports");
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const updateReportStatus = async (reportId, status, action, notes) => {
        try {
            const response = await fetch(
                `${config.BACKEND_URL}/api/reports/${reportId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`
                    },
                    body: JSON.stringify({ status, action, adminNotes: notes })
                }
            );

            if (!response.ok) throw new Error("Failed to update report");

            showSuccess("Report updated successfully");
            setSelectedReport(null);
            fetchReports();
        } catch (err) {
            showError(err.message || "Failed to update report");
        }
    };

    const getReasonEmoji = (reason) => {
        const emojiMap = {
            spam: "🚫",
            harassment: "😠",
            "inappropriate-content": "⚠️",
            misinformation: "❌",
            "hate-speech": "💔",
            "self-harm": "🆘",
            violence: "⚔️",
            other: "📝"
        };
        return emojiMap[reason] || "📝";
    };

    const getStatusColor = (status) => {
        const colorMap = {
            pending: "from-yellow-500 to-yellow-600",
            "under-review": "from-blue-500 to-blue-600",
            resolved: "from-green-500 to-green-600",
            dismissed: "from-gray-500 to-gray-600"
        };
        return colorMap[status] || "from-gray-500 to-gray-600";
    };

    const reportColumns = [
        {
            key: 'reportType',
            label: 'Type',
            sortable: true,
            render: (value) => (
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm font-bold">
                    {value}
                </span>
            )
        },
        {
            key: 'reason',
            label: 'Reason',
            sortable: true,
            render: (value) => (
                <div className="flex items-center gap-2">
                    <span className="text-xl">{getReasonEmoji(value)}</span>
                    <span className="text-gray-900 dark:text-white">{value}</span>
                </div>
            )
        },
        {
            key: 'reportedBy',
            label: 'Reported By',
            accessor: (row) => row.reportedBy?.email || 'N/A',
            render: (value, row) => (
                <div>
                    <div className="text-gray-900 dark:text-white font-medium">
                        {row.reportedBy?.firstName} {row.reportedBy?.lastName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {row.reportedBy?.email}
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (value) => (
                <span className={`px-3 py-1 bg-gradient-to-r ${getStatusColor(value)} text-white rounded-full text-sm font-bold`}>
                    {value}
                </span>
            )
        },
        {
            key: 'createdAt',
            label: 'Date',
            sortable: true,
            render: (value) => (
                <span className="text-gray-600 dark:text-gray-400">
                    {new Date(value).toLocaleDateString()}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Action',
            render: (value, row) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReport(row);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
                >
                    <Eye className="w-4 h-4" />
                    Review
                </button>
            )
        }
    ];

    return (
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

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3" style={{ fontFamily: "Brasika" }}>
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                        Reports Management
                    </h2>
                    <div className="px-6 py-3 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full">
                        <span className="text-red-900 dark:text-red-300 font-bold">
                            Total Reports: {reports.length}
                        </span>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-3 mb-6 flex-wrap overflow-x-auto">
                    {["pending", "under-review", "resolved", "dismissed", "all"].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`
                                px-6 py-3 rounded-full font-bold transition-all
                                ${filter === status
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
                                }
                            `}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                        </button>
                    ))}
                </div>

                {/* Reports DataTable */}
                <DataTable
                    columns={reportColumns}
                    data={reports}
                    loading={loading}
                    searchable={true}
                    searchPlaceholder="Search reports..."
                    itemsPerPage={10}
                    emptyMessage="No reports found"
                    onRowClick={(report) => setSelectedReport(report)}
                />

                {/* Report Detail Modal */}
                {selectedReport && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
                        <div className="bg-white dark:bg-gray-800 rounded-[40px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                                    Report Details
                                </h3>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-3xl p-6 mb-6">
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">Type:</span>
                                        <span className="text-gray-900 dark:text-white">{selectedReport.reportType}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">Reason:</span>
                                        <span className="text-gray-900 dark:text-white">
                                            {getReasonEmoji(selectedReport.reason)} {selectedReport.reason}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">Description:</span>
                                        <span className="text-gray-900 dark:text-white">{selectedReport.description || "N/A"}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">Reported By:</span>
                                        <span className="text-gray-900 dark:text-white">{selectedReport.reportedBy?.email}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">Date:</span>
                                        <span className="text-gray-900 dark:text-white">{new Date(selectedReport.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedReport.targetDetails && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-3xl p-6 mb-6 border-2 border-yellow-200 dark:border-yellow-800">
                                    <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-3">Reported Content:</h4>
                                    {selectedReport.reportType === "post" && (
                                        <div className="space-y-2">
                                            <p className="text-gray-900 dark:text-white">
                                                <span className="font-bold">Author:</span> {selectedReport.targetDetails.userId?.firstName}
                                            </p>
                                            <p className="text-gray-900 dark:text-white">
                                                <span className="font-bold">Content:</span> {selectedReport.targetDetails.content}
                                            </p>
                                        </div>
                                    )}
                                    {selectedReport.reportType === "user" && (
                                        <div className="space-y-2">
                                            <p className="text-gray-900 dark:text-white">
                                                <span className="font-bold">Name:</span> {selectedReport.targetDetails.firstName} {selectedReport.targetDetails.lastName}
                                            </p>
                                            <p className="text-gray-900 dark:text-white">
                                                <span className="font-bold">Email:</span> {selectedReport.targetDetails.email}
                                            </p>
                                        </div>
                                    )}
                                    {selectedReport.reportType === "comment" && (
                                        <div className="space-y-2">
                                            <p className="text-gray-900 dark:text-white">
                                                <span className="font-bold">Author:</span> {selectedReport.targetDetails.userId?.firstName}
                                            </p>
                                            <p className="text-gray-900 dark:text-white">
                                                <span className="font-bold">Comment:</span> {selectedReport.targetDetails.content}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                {(selectedReport.reportType === "post" || selectedReport.reportType === "comment") && (
                                    <button
                                        onClick={() => updateReportStatus(selectedReport._id, "resolved", "content-removed", "Content removed due to policy violation")}
                                        className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                        Remove Content
                                    </button>
                                )}
                                {selectedReport.reportType === "user" && (
                                    <button
                                        onClick={() => updateReportStatus(selectedReport._id, "resolved", "user-suspended", "User disabled due to policy violation")}
                                        className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                        Disable User
                                    </button>
                                )}
                                <button
                                    onClick={() => updateReportStatus(selectedReport._id, "resolved", "warning", "User warned")}
                                    className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
                                >
                                    <AlertTriangle className="w-5 h-5" />
                                    Warn User
                                </button>
                                <button
                                    onClick={() => updateReportStatus(selectedReport._id, "dismissed", "none", "No policy violation found")}
                                    className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#89beab] to-[#6fa893] text-white rounded-full font-bold hover:shadow-lg transition-all"
                                >
                                    Close
                                </button>
                                {(selectedReport.reportType === "post" || selectedReport.reportType === "comment") && (
                                    <button
                                        onClick={() => setViewingContent(true)}
                                        className="flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-full font-bold hover:shadow-lg transition-all col-span-2 mt-2"
                                    >
                                        <Eye className="w-5 h-5" />
                                        View Original Content
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Original Content Modal */}
                {viewingContent && selectedReport && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setViewingContent(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-[40px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setViewingContent(false)}
                                className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </button>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2" style={{ fontFamily: "Brasika" }}>
                                Original Content
                            </h3>
                            
                            {/* Render Post or Comment */}
                            {selectedReport.reportType === "post" && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-3xl border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f8ba90] to-[#f4873e] flex items-center justify-center text-white font-bold">
                                            {selectedReport.targetDetails?.userId?.firstName?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                {selectedReport.targetDetails?.userId?.firstName} {selectedReport.targetDetails?.userId?.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500">{new Date(selectedReport.targetDetails?.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-4">
                                        {selectedReport.targetDetails?.content}
                                    </p>
                                    {selectedReport.targetDetails?.image && (
                                        <img src={selectedReport.targetDetails.image} alt="Post Attachment" className="w-full max-h-[400px] object-contain rounded-2xl bg-gray-100 dark:bg-gray-900 mt-4" />
                                    )}
                                </div>
                            )}
                            
                            {selectedReport.reportType === "comment" && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-3xl border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#89beab] to-[#6fa893] flex items-center justify-center text-white text-xs font-bold">
                                            {selectedReport.targetDetails?.userId?.firstName?.[0] || '?'}
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {selectedReport.targetDetails?.userId?.firstName} {selectedReport.targetDetails?.userId?.lastName}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                            {new Date(selectedReport.targetDetails?.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="ml-11">
                                        <p className="text-gray-800 dark:text-gray-200">
                                            {selectedReport.targetDetails?.content}
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            <button
                                onClick={() => setViewingContent(false)}
                                className="mt-6 w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Back to Report
                            </button>
                        </div>
                    </div>
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
    );
};

export default AdminReportsPage;