import React, { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, Check, XCircle, Clock } from 'lucide-react';
import { getGroupJoinRequests, approveJoinRequest, rejectJoinRequest } from '../services/communityService';
import Modal from './Modal';
import toast from 'react-hot-toast';

const JoinRequestsModal = ({ groupId, groupName, onClose, onSuccess }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null); // { id, userName }
    const [rejectReason, setRejectReason] = useState("");

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getGroupJoinRequests(groupId);
            setRequests(data.requests || []);
        } catch (error) {
            toast.error(error.message || "Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApproveClick = (requestId, userName) => {
        setSelectedRequest({ id: requestId, userName });
        setShowApproveModal(true);
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        setProcessing(selectedRequest.id);
        setShowApproveModal(false);
        try {
            await approveJoinRequest(groupId, selectedRequest.id);
            toast.success(`${selectedRequest.userName} has been added to the group!`);
            fetchRequests(); // Refresh list
            onSuccess();
        } catch (error) {
            toast.error(error.message || "Failed to approve request");
        } finally {
            setProcessing(null);
            setSelectedRequest(null);
        }
    };

    const handleRejectClick = (requestId, userName) => {
        setSelectedRequest({ id: requestId, userName });
        setRejectReason("");
        setShowRejectModal(true);
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        setProcessing(selectedRequest.id);
        setShowRejectModal(false);
        try {
            await rejectJoinRequest(groupId, selectedRequest.id, rejectReason);
            toast.success(`${selectedRequest.userName}'s request has been rejected.`);
            fetchRequests(); // Refresh list
            onSuccess();
        } catch (error) {
            toast.error(error.message || "Failed to reject request");
        } finally {
            setProcessing(null);
            setSelectedRequest(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-[40px] p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                            <span className="text-[#f4873e]">Join </span>
                            <span className="text-[#89beab]">Requests</span>
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            For: <span className="font-semibold">{groupName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f4873e]"></div>
                    </div>
                ) : requests.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12">
                        <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            No pending join requests
                        </p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                            Requests will appear here when users ask to join
                        </p>
                    </div>
                ) : (
                    /* Requests List */
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <div
                                key={request._id}
                                className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-600 hover:border-[#f4873e] dark:hover:border-orange-500 transition-all"
                            >
                                {/* User Info */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar Placeholder */}
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#f4873e] to-[#ff9e5e] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {request.userId.firstName[0]}{request.userId.lastName[0]}
                                        </div>

                                        {/* Name & Email */}
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                                                {request.userId.firstName} {request.userId.lastName}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{request.userId.email}</p>
                                        </div>
                                    </div>

                                    {/* Time Badge */}
                                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                            {formatDate(request.requestedAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Message (if provided) */}
                                {request.message && (
                                    <div className="bg-white dark:bg-gray-600 rounded-2xl p-4 mb-4">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Message:</p>
                                        <p className="text-gray-600 dark:text-gray-400">{request.message}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApproveClick(request._id, `${request.userId.firstName} ${request.userId.lastName}`)}
                                        disabled={processing === request._id}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing === request._id ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Approve
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleRejectClick(request._id, `${request.userId.firstName} ${request.userId.lastName}`)}
                                        disabled={processing === request._id}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
            {/* Approve Modal */}
            <Modal
                isOpen={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                title="Approve Join Request"
            >
                <p className="mb-4">Approve <span className="font-semibold">{selectedRequest?.userName}</span>'s request to join?</p>
                <div className="flex justify-end gap-2">
                    <button
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-500"
                        onClick={() => setShowApproveModal(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:shadow-lg"
                        onClick={handleApprove}
                        disabled={processing}
                    >
                        {processing ? "Processing..." : "Approve"}
                    </button>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title="Reject Join Request"
            >
                <label className="block text-sm font-semibold mb-2">Reason for rejection (optional)</label>
                <textarea
                    className="w-full min-h-[80px] rounded-lg border border-gray-300 dark:border-gray-600 p-2 mb-4 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Let the user know why their request was rejected..."
                />
                <div className="flex justify-end gap-2">
                    <button
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-500"
                        onClick={() => setShowRejectModal(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:shadow-lg"
                        onClick={handleReject}
                        disabled={processing}
                    >
                        {processing ? "Processing..." : "Reject"}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default JoinRequestsModal;