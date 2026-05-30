import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, MoreVertical, Flag, Trash2, Send } from 'lucide-react';
import { addReaction, addComment, deletePost, deleteComment } from "../services/communityService";
import jwtDecode from "jwt-decode";
import ReportModal from "./ReportModal";
import { useNavigate } from 'react-router-dom';
import { showError, confirmAction } from "../utils/uiFeedback";

const PostCard = ({ post, onUpdate, onDelete }) => {
    console.log("POST DATA RECEIVED:", post);
    const queryClient = useQueryClient();
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [showOptions, setShowOptions] = useState(false);
    const [reportConfig, setReportConfig] = useState(null);
    const [submittingComment, setSubmittingComment] = useState(false);


    // Get current user ID from token
    const token = localStorage.getItem("token");
    const currentUserId = token ? jwtDecode(token).id : null;
    const isOwnPost = post.userId?._id === currentUserId;

    // Helper: Is this an auto-generated completion post?
    const isAutoCompletionPost = Array.isArray(post.tags) && post.tags.some(tag => tag.startsWith("auto-complete-"));
    const navigate = useNavigate();
    // Open Journal page with comment content pre-filled
    const handleSaveCommentToJournal = (comment) => {
        navigate('/journal', {
            state: {
                fromComment: true,
                commentContent: comment.content,
                commentTags: ["group-task", "auto-complete"]
            }
        });
    };

    // Category colors and icons
    const categoryStyles = {
        wellbeing: { bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-300", icon: "💚" },
        habits: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300", icon: "✅" },
        journaling: { bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-700 dark:text-purple-300", icon: "📝" },
        gratitude: { bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-700 dark:text-yellow-300", icon: "🙏" },
        mindfulness: { bg: "bg-indigo-100 dark:bg-indigo-900", text: "text-indigo-700 dark:text-indigo-300", icon: "🧘" },
        fitness: { bg: "bg-red-100 dark:bg-red-900", text: "text-red-700 dark:text-red-300", icon: "💪" },
        other: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300", icon: "✨" }
    };

    const categoryStyle = categoryStyles[post.category] || categoryStyles.other;

    const handleReaction = async (emoji) => {
        try {
            const result = await addReaction(post._id, emoji);
            onUpdate(result.post);
        } catch (error) {
            console.error("Error adding reaction:", error);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        try {
            const result = await addComment(post._id, commentText);
            queryClient.invalidateQueries({ queryKey: ["community"] });
            onUpdate(result.post);
            setCommentText("");
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeletePost = async () => {
        const confirmed = await confirmAction("Are you sure you want to delete this post?", { confirmText: "Delete" });
        if (!confirmed) return;
        try {
            await deletePost(post._id);
            onDelete(post._id);
        } catch (error) {
            console.error("Error deleting post:", error);
            showError("Failed to delete post");
        }
    };

    const handleDeleteComment = async (commentId) => {
        const confirmed = await confirmAction("Are you sure you want to delete this comment?", { confirmText: "Delete" });
        if (!confirmed) return;
        try {
            await deleteComment(post._id, commentId);
            const updatedPost = { ...post };
            updatedPost.comments = updatedPost.comments.filter(c => c._id !== commentId);
            onUpdate(updatedPost);
        } catch (error) {
            console.error("Error deleting comment:", error);
            showError("Failed to delete comment");
        }
    };

    const userReaction = post.reactions?.find(r => r.userId === currentUserId);

    const reactionCounts = {};
    post.reactions?.forEach(r => {
        reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const isUrl = (value) => /^https?:\/\/[^\s]+$/.test(value);
    const renderLineWithLinks = (line) => {
        const parts = line.split(urlRegex);
        return parts.map((part, index) => {
            if (isUrl(part)) {
                return (
                    <a
                        key={`${part}-${index}`}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 underline break-all"
                    >
                        {part}
                    </a>
                );
            }
            return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
        });
    };

    const normalizeStructuredSessionContent = (content = "") => {
        if (!content.includes("# Group Session Is Live")) return content;

        // Fallback: older/flattened posts may store all headings in one line.
        // Convert inline heading markers into real line breaks for proper rendering.
        return content
            .replace(/\s+##\s+/g, "\n## ")
            .replace(/^\s*#\s+/g, "# ");
    };

    const renderPostContent = (content = "") => {
        const normalizedContent = normalizeStructuredSessionContent(content);
        const lines = normalizedContent.split("\n");
        const rendered = [];

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            const nextLine = lines[index + 1] || "";

            if (line.startsWith("# ")) {
                rendered.push(
                    <h3 key={`line-${index}`} className="text-lg font-bold text-gray-900 dark:text-white mt-2 mb-1">
                        {renderLineWithLinks(line.slice(2))}
                    </h3>
                );
                continue;
            }

            if (line.startsWith("## ")) {
                rendered.push(
                    <h4 key={`line-${index}`} className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-1 uppercase tracking-wide">
                        {renderLineWithLinks(line.slice(3))}
                    </h4>
                );

                const heading = line.slice(3).trim().toLowerCase();
                if (heading === "meeting link" && isUrl(nextLine.trim())) {
                    const url = nextLine.trim();
                    rendered.push(
                        <div key={`join-${index}`} className="mb-1">
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                            >
                                Join Meeting
                            </a>
                        </div>
                    );
                    rendered.push(
                        <a
                            key={`url-${index}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 underline break-all text-sm"
                        >
                            {url}
                        </a>
                    );
                    index += 1;
                }
                continue;
            }

            if (!line.trim()) {
                rendered.push(<div key={`line-${index}`} className="h-2" />);
                continue;
            }

            rendered.push(
                <p key={`line-${index}`} className="text-gray-800 dark:text-gray-200 text-left">
                    {renderLineWithLinks(line)}
                </p>
            );
        }

        return rendered;
    };

    return (
        <>
            {reportConfig && (
                <ReportModal
                    targetId={reportConfig.targetId}
                    targetType={reportConfig.targetType}
                    onClose={() => setReportConfig(null)}
                />
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="text-left">
                            <p className="font-semibold text-gray-900 dark:text-white text-left">
                                {post.userId?.firstName} {post.userId?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                                {formatDate(post.createdAt)}
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>

                        {showOptions && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                {isOwnPost ? (
                                    <button
                                        onClick={handleDeletePost}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 font-medium"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Post
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setReportConfig({ targetId: post._id, targetType: 'post' });
                                            setShowOptions(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                    >
                                        <Flag className="w-4 h-4" />
                                        Report Post
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Badge */}
                <div className="mb-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}>
                        <span>{categoryStyle.icon}</span>
                        {post.category}
                    </span>
                </div>

                {/* Text Content */}
                <div className="mb-4 whitespace-pre-wrap text-left">
                    {renderPostContent(post.content)}
                </div>

                {/* Post Image Render */}
                {post.image && (
                    <div className="mb-4 rounded-2xl overflow-hidden border ... max-w-md mx-auto">                        <img
                        src={post.image}
                        alt="Post attachment"
                        className="w-full h-auto" onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/600x400?text=Image+Unavailable';
                        }}
                    />
                    </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="text-[10px] uppercase tracking-wider font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Reactions Display (Summary) */}
                {Object.keys(reactionCounts).length > 0 && (
                    <div className="flex gap-2 mb-3">
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <span
                                key={emoji}
                                className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded-full flex items-center gap-1"
                            >
                                {emoji} <span className="font-medium">{count}</span>
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        {["❤️", "😆", "😢", "🤩", "😡"].map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                className={`text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${userReaction?.emoji === emoji ? 'bg-orange-50 dark:bg-orange-900/20 scale-110' : ''
                                    }`}
                                title={`React with ${emoji}`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#f4873e] transition-colors"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{post.comments?.length || 0} Comments</span>
                    </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="mt-4 space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Write a thoughtful comment..."
                                className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#89beab] text-sm"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={submittingComment || !commentText.trim()}
                                className="p-2 rounded-xl bg-[#89beab] text-white hover:bg-[#f4873e] transition-colors disabled:opacity-50"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {post.comments?.map(comment => (
                                <div key={comment._id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 uppercase">
                                        {comment.userId?.firstName?.[0]}{comment.userId?.lastName?.[0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-gray-100 dark:bg-gray-700/50 rounded-2xl p-3">
                                            <p className="font-bold text-xs text-gray-900 dark:text-white">
                                                {comment.userId?.firstName} {comment.userId?.lastName}
                                            </p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                {comment.content}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 px-2">
                                            <span className="text-[10px] text-gray-400">
                                                {formatDate(comment.createdAt)}
                                            </span>
                                            {comment.userId?._id === currentUserId ? (
                                                <button
                                                    onClick={() => handleDeleteComment(comment._id)}
                                                    className="text-[10px] text-red-400 hover:text-red-600 font-medium"
                                                >
                                                    Delete
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setReportConfig({ targetId: comment._id, targetType: 'comment' })}
                                                    className="text-[10px] text-gray-400 hover:text-red-500 font-medium"
                                                >
                                                    Report
                                                </button>
                                            )}
                                            {/* Save to Journal button for auto-complete posts */}
                                            {isAutoCompletionPost && comment.userId?._id === currentUserId && (
                                                <button
                                                    onClick={() => handleSaveCommentToJournal(comment)}
                                                    className="text-[10px] text-blue-400 hover:text-blue-600 font-medium"
                                                >
                                                    Save to my Journal
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default PostCard;