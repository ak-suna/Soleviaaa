import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, Trash2, MoreVertical, Flag, UserX } from "lucide-react";
import { addComment, addReaction, deleteComment } from "../services/communityService";
import { jwtDecode } from "jwt-decode";
import { useEffect, useRef } from "react";
import ReportModal from "./ReportModal";
import { showError, confirmAction } from "../utils/uiFeedback";
const REACTION_EMOJIS = ["❤️", "😆", "😢", "🤩", "😡"];



const CommunityFeed = ({ posts, getCategoryColor, highlightCommentId, commentRef, singlePostMode, focusPostId }) => {
    const queryClient = useQueryClient();
    const [expandedComments, setExpandedComments] = useState({});
    const [commentText, setCommentText] = useState({});
    const [submittingComment, setSubmittingComment] = useState({});
    const [reportConfig, setReportConfig] = useState(null);
    const [showOptions, setShowOptions] = useState({});

    const token = localStorage.getItem("token");
    const currentUserId = token ? jwtDecode(token).id : null;

    const toggleComments = (postId) => {
        setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
    };

    const handleReaction = async (postId, emoji) => {
        try {
            await addReaction(postId, emoji);
            queryClient.invalidateQueries({ queryKey: ["community"] });
        } catch (error) {
            console.error("Error adding reaction:", error);
        }
    };

    const handleAddComment = async (postId) => {
        const text = (commentText[postId] || "").trim();
        if (!text) return;

        setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
        try {
            await addComment(postId, text);
            setCommentText((prev) => ({ ...prev, [postId]: "" }));
            queryClient.invalidateQueries({ queryKey: ["community"] });
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        const confirmed = await confirmAction("Are you sure you want to delete this comment?", { confirmText: "Delete" });
        if (!confirmed) return;
        try {
            await deleteComment(postId, commentId);
            queryClient.invalidateQueries({ queryKey: ["community"] });
        } catch (error) {
            console.error("Error deleting comment:", error);
            showError("Failed to delete comment");
        }
    };

    const reactionCounts = (post) => {
        const counts = {};
        (post.reactions || []).forEach((r) => {
            const emoji = r.emoji;
            counts[emoji] = (counts[emoji] || 0) + 1;
        });
        return counts;
    };

    const userReaction = (post) => {
        return (post.reactions || []).find((r) => String(r.userId) === String(currentUserId));
    };

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

    const isUrl = (value) => /^https?:\/\/[^\s]+$/i.test(value || "");
    const normalizeStructuredSessionContent = (content = "") => {
        if (!content.includes("# Group Session Is Live")) return content;
        return content.replace(/\s+##\s+/g, "\n## ").replace(/^\s*#\s+/, "# ");
    };
    const renderLineWithLinks = (line) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
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
    const renderPostContent = (content = "") => {
        const lines = normalizeStructuredSessionContent(content).split("\n");
        const rendered = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const nextLine = lines[i + 1] || "";

            if (line.startsWith("# ")) {
                rendered.push(
                    <h3 key={`main-${i}`} className="text-lg font-bold text-gray-900 dark:text-white mt-2 mb-1">
                        {renderLineWithLinks(line.slice(2))}
                    </h3>
                );
                continue;
            }

            if (line.startsWith("## ")) {
                rendered.push(
                    <h4 key={`sub-${i}`} className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wide">
                        {renderLineWithLinks(line.slice(3))}
                    </h4>
                );

                const heading = line.slice(3).trim().toLowerCase();
                if (heading === "meeting link" && isUrl(nextLine.trim())) {
                    const url = nextLine.trim();
                    rendered.push(
                        <a
                            key={`join-${i}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition mb-1"
                        >
                            Join Meeting
                        </a>
                    );
                    rendered.push(
                        <div key={`link-container-${i}`} className="mt-1">
                            <a
                                key={`url-${i}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline break-all text-sm"
                            >
                                {url}
                            </a>
                        </div>
                    );
                    i += 1;
                }
                continue;
            }

            if (!line.trim()) {
                rendered.push(<div key={`space-${i}`} className="h-2" />);
                continue;
            }

            rendered.push(
                <p key={`line-${i}`} className="text-gray-700 dark:text-gray-300 text-left">
                    {renderLineWithLinks(line)}
                </p>
            );
        }

        return rendered;
    };

    // Ref for focusing post
    const focusRef = useRef(null);
    const localCommentRef = useRef(null);
    const resolvedCommentRef = commentRef || localCommentRef;

    // add below the existing focusRef useEffect
    useEffect(() => {
        if (highlightCommentId && focusPostId) {
            setExpandedComments(prev => ({ ...prev, [focusPostId]: true }));
        }
    }, [highlightCommentId, focusPostId]);

    useEffect(() => {
        if (highlightCommentId && resolvedCommentRef.current) {
            const timeout = setTimeout(() => {
                resolvedCommentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [highlightCommentId, expandedComments, resolvedCommentRef]);

    return (
        <div className="space-y-4 bg-white dark:bg-gray-900 p-2 rounded-2xl relative">
            {reportConfig && (
                <ReportModal
                    targetId={reportConfig.targetId}
                    targetType={reportConfig.targetType}
                    onClose={() => setReportConfig(null)}
                />
            )}
            {posts.map((post) => {
                // DEBUG LOG: Check if image exists in the post data
                // console.log(`Post ${post._id} data:`, post);

                const counts = reactionCounts(post);
                const userReact = userReaction(post);
                const comments = post.comments || [];
                const isExpanded = expandedComments[post._id];
                const text = commentText[post._id] || "";
                const submitting = submittingComment[post._id];

                const isFocus = focusPostId && String(post._id) === String(focusPostId);

                return (
                    <div
                        key={post._id}
                        ref={isFocus ? focusRef : undefined}
                        className={`bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-600 hover:border-[#f4873e] transition-all ${isFocus ? "ring-4 ring-[#f4873e]" : ""}`}
                    >
                        {/* Post Header + Caption */}
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#f4873e] to-[#ff9e5e] rounded-full flex items-center justify-center text-white font-bold">
                                {post.userId?.firstName?.[0]}
                                {post.userId?.lastName?.[0]}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-left">
                                            {post.userId?.firstName} {post.userId?.lastName}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-left">
                                            {formatDate(post.createdAt)}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(
                                            post.category
                                        )}`}
                                    >
                                        {post.category}
                                    </span>
                                    {/* Delete Post Button or Options */}
                                    {String(post.userId?._id) === String(currentUserId) ? (
                                        <button
                                            onClick={async () => {
                                                const confirmed = await confirmAction("Are you sure you want to delete this post?", { confirmText: "Delete" });
                                                if (!confirmed) return;
                                                try {
                                                    const { deletePost } = await import("../services/communityService");
                                                    await deletePost(post._id);
                                                    queryClient.invalidateQueries({ queryKey: ["community"] });
                                                } catch (err) {
                                                    showError("Failed to delete post");
                                                }
                                            }}
                                            className="ml-auto p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                            title="Delete Post"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    ) : (
                                        <div className="relative ml-auto">
                                            <button
                                                onClick={() => setShowOptions(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                                                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {showOptions[post._id] && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                                    <button
                                                        onClick={() => {
                                                            setReportConfig({ targetId: post._id, targetType: 'post' });
                                                            setShowOptions(prev => ({ ...prev, [post._id]: false }));
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                                    >
                                                        <Flag className="w-4 h-4" />
                                                        Report Post
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setReportConfig({ targetId: post.userId?._id, targetType: 'user' });
                                                            setShowOptions(prev => ({ ...prev, [post._id]: false }));
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                        Report User
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="mb-4 text-left mt-1 whitespace-pre-wrap">
                                    {renderPostContent(post.content)}
                                </div>
                            </div>
                        </div>

                        {/* --- IMAGE SECTION START --- */}
                        {post.image && (
                            <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                                <img
                                    src={post.image}
                                    alt="Post attachment"
                                    className="w-full h-auto max-h-[500px] object-contain block mx-auto"
                                    loading="lazy"
                                    onError={(e) => {
                                        console.error("Image failed to load:", post.image);
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                        {/* --- IMAGE SECTION END --- */}

                        {/* Reactions */}
                        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-3">
                            <div className="flex items-center gap-1">
                                {REACTION_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(post._id, emoji)}
                                        className={`text-lg hover:scale-125 transition-transform ${userReact?.emoji === emoji ? "scale-125" : ""
                                            }`}
                                        title={`React with ${emoji}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                                {Object.keys(counts).length > 0 && (
                                    <span className="text-xs ml-1 text-gray-500 dark:text-gray-400">
                                        {Object.entries(counts)
                                            .map(([e, c]) => `${e} ${c}`)
                                            .join(" ")}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => toggleComments(post._id)}
                                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#89beab] transition-colors ml-auto"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-sm">{comments.length}</span>
                            </button>
                        </div>

                        {/* Comment Section */}
                        {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={text}
                                        onChange={(e) =>
                                            setCommentText((prev) => ({
                                                ...prev,
                                                [post._id]: e.target.value
                                            }))
                                        }
                                        placeholder="Write a comment..."
                                        className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#89beab]"
                                        onKeyDown={(e) =>
                                            e.key === "Enter" && handleAddComment(post._id)
                                        }
                                    />
                                    <button
                                        onClick={() => handleAddComment(post._id)}
                                        disabled={submitting || !text.trim()}
                                        className="p-2 rounded-full bg-[#89beab] text-white hover:bg-[#f4873e] transition-colors disabled:opacity-50"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {comments.map((comment) => {
                                        const isHighlight = highlightCommentId && String(comment._id) === String(highlightCommentId);
                                        return (
                                            <div
                                                key={comment._id}
                                                className={`flex gap-3 ${isHighlight ? "ring-2 ring-[#f4873e]" : ""}`}
                                                ref={isHighlight ? resolvedCommentRef : undefined}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#89beab] to-[#f4873e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                    {comment.userId?.firstName?.[0]}
                                                    {comment.userId?.lastName?.[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-gray-100 dark:bg-gray-600 rounded-lg p-3">
                                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                                            {comment.userId?.firstName}{" "}
                                                            {comment.userId?.lastName}
                                                        </p>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                            {comment.content}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 px-3">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatDate(comment.createdAt)}
                                                        </span>
                                                        {String(comment.userId?._id) === String(currentUserId) ? (
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteComment(
                                                                        post._id,
                                                                        comment._id
                                                                    )
                                                                }
                                                                className="text-xs text-red-600 hover:underline"
                                                            >
                                                                Delete
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setReportConfig({ targetId: comment._id, targetType: 'comment' })}
                                                                className="text-xs text-gray-400 hover:text-red-500 font-medium"
                                                            >
                                                                Report
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CommunityFeed;