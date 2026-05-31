import React, { useState, useEffect, useCallback } from 'react';
import { X, Trophy, AlertCircle } from 'lucide-react';
import { getModeratorCandidates, assignModerator } from '../services/communityService';
import { showError, showSuccess, confirmAction } from "../utils/uiFeedback";


const ModeratorCandidatesModal = ({ groupId, groupName, onClose, onSuccess }) => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [promoting, setPromoting] = useState(null);

    const fetchCandidates = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getModeratorCandidates(groupId);
            setCandidates(data.candidates || []);
        } catch (error) {
            showError(error.message || "Failed to fetch candidates");
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchCandidates();
    }, [fetchCandidates]);

    const handlePromote = async (userId, firstName, lastName) => {
        const confirmed = await confirmAction(
            `Send a moderator invitation to ${firstName} ${lastName}? They must accept before becoming moderator.`,
            { confirmText: "Send invitation" }
        );
        if (!confirmed) return;
        setPromoting(userId);
        try {
            await assignModerator(groupId, userId);
            showSuccess(`Invitation sent to ${firstName} ${lastName}`);
            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            showError(error.message || "Failed to send moderator invitation");
        } finally {
            setPromoting(null);
        }
    };

    const getPointsColor = (points, requiredPoints) => {
        if (points >= requiredPoints) return 'from-green-500 to-green-600';
        if (points >= requiredPoints * 0.7) return 'from-yellow-500 to-yellow-600';
        return 'from-gray-500 to-gray-600';
    };

    const getPointsLabel = (points, requiredPoints) => {
        if (points >= requiredPoints) return 'Eligible';
        if (points >= requiredPoints * 0.7) return 'Almost Eligible';
        return 'Needs More Points';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-[40px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                            <span className="text-[#89beab]">Assign </span>
                            <span className="text-[#f4873e]">Moderator</span>
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

                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold">
                            Candidates must have at least <b>{candidates[0]?.requiredPoints ?? 20} points</b>, 10+ days in group, and no violations.
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Points are earned by group activity. Violations disqualify candidates.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#89beab]"></div>
                    </div>
                ) : candidates.length === 0 ? (
                    <div className="text-center py-12">
                        <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            No eligible candidates yet. Members need more activity!
                        </p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                            Minimum: 10 days in group, {candidates[0]?.requiredPoints ?? 20} points, no violations
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {candidates.map((candidate) => (
                            <div
                                key={candidate.userId}
                                className={`
                                    bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 
                                    rounded-3xl p-6 border-2 transition-all
                                    ${candidate.eligible
                                        ? 'border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600'
                                        : 'border-gray-200 dark:border-gray-600 opacity-70'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                                            {candidate.user.firstName} {candidate.user.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{candidate.user.email}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getPointsColor(candidate.points || 0, candidate.requiredPoints || 20)} text-white`}>
                                                Points: {candidate.points || 0} / {candidate.requiredPoints || 20}
                                            </span>
                                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                Days in group: {candidate.metrics?.daysInGroup || 0}
                                            </span>
                                        </div>
                                        <span className={`
                                            inline-block px-3 py-1 rounded-full text-xs font-bold mt-2
                                            ${candidate.eligible
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                            }
                                        `}>
                                            {candidate.eligible ? '✓ Eligible' : getPointsLabel(candidate.points, candidate.requiredPoints)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handlePromote(candidate.user._id || candidate.userId, candidate.user.firstName, candidate.user.lastName)}
                                        disabled={!candidate.eligible || promoting === (candidate.user._id || candidate.userId)}
                                        className={`
                                            px-6 py-3 rounded-full font-bold transition-all
                                            ${candidate.eligible
                                                ? 'bg-gradient-to-r from-[#89beab] to-[#6fa893] text-white hover:shadow-lg'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        {promoting === (candidate.user._id || candidate.userId) ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Sending...
                                            </div>
                                        ) : (
                                            'Invite as Moderator'
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModeratorCandidatesModal;