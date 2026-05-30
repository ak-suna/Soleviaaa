// // frontend/src/components/NotificationBell.jsx
// import { useState, useEffect } from "react";
// import { useNotificationContext } from "../contexts/NotificationContext";
// import { Bell, Trash2, X } from "lucide-react";
// import { useNavigate } from "react-router-dom";


// export default function NotificationBell() {
//   const {
//     notifications,
//     unreadCount,
//     connected,
//     fetchNotifications,
//     markAsRead,
//     markAllAsRead,
//     deleteNotification
//   } = useNotificationContext();
//   const [isOpen, setIsOpen] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (notifications.length === 0) {
//       fetchNotifications();
//     }
//   }, []);

//   // Enhanced click handler
//   const handleNotificationClick = (notification) => {
//     // Morning/Evening check-in notifications are not clickable
//     if (["MOOD_REMINDER_MORNING", "MOOD_REMINDER_EVENING"].includes(notification.type)) return;

//     if (!notification.read) {
//       markAsRead(notification._id);
//     }

//     // Likes/comments: go to post/comment
//     if (notification.type === "COMMUNITY_COMMENT" && notification.data?.postId) {
//     const base = notification.data.groupId
//         ? `/community/group/${notification.data.groupId}`
//         : `/community`;
//     const query = `?focus=${notification.data.postId}${notification.data.commentId ? `&comment=${notification.data.commentId}` : ""}`;
//     navigate(`${base}${query}`);
//     setIsOpen(false);
//     return;
// }
//     if (notification.type === "COMMUNITY_LIKE" && notification.data?.postId) {
//     const base = notification.data.groupId
//         ? `/community/group/${notification.data.groupId}`
//         : `/community`;
//     navigate(`${base}?focus=${notification.data.postId}`);
//     setIsOpen(false);
//     return;
//     }
//     // Group accept: go to group
//     if (notification.type === "GROUP_JOIN_APPROVED" && notification.data?.groupId) {
//       navigate(`/community/group/${notification.data.groupId}`);
//       setIsOpen(false);
//       return;
//     }
//     // Fallback: use actionUrl if present
//     if (notification.data?.actionUrl) {
//       window.location.href = notification.data.actionUrl;
//       setIsOpen(false);
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition"
//       >
//         <Bell className="w-7 h-7 text-gray-600 dark:text-gray-300" />
        
//         {unreadCount > 0 && (
//           <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
//             {unreadCount > 9 ? "9+" : unreadCount}
//           </span>
//         )}

//         <span
//           className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
//             connected ? "bg-green-500" : "bg-gray-400"
//           }`}
//           title={connected ? "Connected" : "Disconnected"}
//         />
//       </button>

//       {isOpen && (
//         <>
//           <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-y-auto">
//             <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
//               <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Notifications</h3>
//               <div className="flex gap-2 items-center">
//                 {unreadCount > 0 && (
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       markAllAsRead();
//                     }}
//                     className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
//                   >
//                     Mark all read
//                   </button>
//                 )}
//                 <button
//                   onClick={() => setIsOpen(false)}
//                   className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>
//             </div>

//             <div className="divide-y dark:divide-gray-700">
//               {notifications.length === 0 ? (
//                 <div className="p-8 text-center text-gray-500 dark:text-gray-400">
//                   <Bell size={48} className="mx-auto mb-2 opacity-30" />
//                   <p>No notifications yet</p>
//                 </div>
//               ) : (
//                 notifications.map((notification) => (
//                   <NotificationItem
//                     key={notification._id}
//                     notification={notification}
//                     onClick={() => handleNotificationClick(notification)}
//                     onDelete={() => {
//                       deleteNotification(notification._id);
//                     }}
//                   />
//                 ))
//               )}
//             </div>
//           </div>

//           {/* Backdrop */}
//           <div
//             className="fixed inset-0 z-40"
//             onClick={() => setIsOpen(false)}
//           />
//         </>
//       )}
//     </div>
//   );
// }

// function NotificationItem({ notification, onClick, onDelete }) {
//   const priorityDots = {
//     HIGH: "bg-red-500",
//     MEDIUM: "bg-yellow-500",
//     LOW: "bg-blue-500"
//   };

//   // Check-in notifications are not clickable
//   const isCheckin = ["MOOD_REMINDER_MORNING", "MOOD_REMINDER_EVENING"].includes(notification.type);

//   // Likes/comments: show user name and preview
//   let message = notification.message;
//   if (notification.type === "COMMUNITY_COMMENT" && notification.data) {
//     const name = notification.data.userName || "Someone";
//     const preview = notification.data.commentContent ? `: \"${notification.data.commentContent.slice(0, 30)}${notification.data.commentContent.length > 30 ? '...' : ''}\"` : "";
//     message = `${name} commented${preview}`;
//   }
//   if (notification.type === "COMMUNITY_LIKE" && notification.data) {
//     const name = notification.data.userName || "Someone";
//     message = `${name} liked your post`;
//   }

//   return (
//     <div
//       className={`p-4 ${isCheckin ? 'cursor-default' : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'} transition ${
//         !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
//       }`}
//       onClick={isCheckin ? undefined : onClick}
//       tabIndex={isCheckin ? -1 : 0}
//       aria-disabled={isCheckin}
//     >
//       <div className="flex items-start gap-3">
//         <div
//           className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
//             priorityDots[notification.priority] || "bg-gray-400"
//           }`}
//         />

//         <div className="flex-1 min-w-0">
//           <div className="flex items-start justify-between">
//             <h4 className="font-medium text-sm text-gray-800 dark:text-white">{notification.title}</h4>
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onDelete();
//               }}
//               className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition"
//             >
//               <Trash2 size={14} />
//             </button>
//           </div>
//           <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{message}</p>
//           <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
//             {formatTimestamp(notification.createdAt)}
//           </p>
//         </div>
//         {!notification.read && (
//           <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
//         )}
//       </div>
//     </div>
//   );
// }

// function formatTimestamp(timestamp) {
//   const date = new Date(timestamp);
//   const now = new Date();
//   const diffMs = now - date;
//   const diffMins = Math.floor(diffMs / 60000);
//   const diffHours = Math.floor(diffMs / 3600000);
//   const diffDays = Math.floor(diffMs / 86400000);

//   if (diffMins < 1) return "Just now";
//   if (diffMins < 60) return `${diffMins}m ago`;
//   if (diffHours < 24) return `${diffHours}h ago`;
//   if (diffDays < 7) return `${diffDays}d ago`;
  
//   return date.toLocaleDateString();
// }
// frontend/src/components/NotificationBell.jsx
// frontend/src/components/NotificationBell.jsx
import { useState, useEffect } from "react";
import { useNotificationContext } from "../contexts/NotificationContext";
import { Bell, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { respondToModeratorInvitation } from "../services/communityService";
import { showError, showSuccess } from "../utils/uiFeedback";


export default function NotificationBell({ filterTypes = [] }) {
  const {
    notifications,
    connected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (notifications.length === 0) {
      fetchNotifications();
    }
  }, [fetchNotifications, notifications.length]);

  // Filter out any notification types passed via filterTypes prop
  const visibleNotifications = filterTypes.length > 0
    ? notifications.filter(n => !filterTypes.includes(n.type))
    : notifications;

  // Recalculate unread count based on visible notifications only
  const visibleUnreadCount = visibleNotifications.filter(n => !n.read).length;
  const NON_CLICKABLE_TYPES = new Set([
    "MOOD_REMINDER_MORNING",
    "MOOD_REMINDER_EVENING",
    "STREAK_ACHIEVED",
    "STREAK_AT_RISK",
    "GROUP_MODERATOR_INVITATION"
  ]);

  const handleModeratorInvitationResponse = async (notification, action) => {
    const groupId = notification.data?.groupId;
    if (!groupId) {
      showError("Invalid invitation — missing group info.");
      return;
    }

    setRespondingId(`${notification._id}-${action}`);
    try {
      const result = await respondToModeratorInvitation(groupId, action);
      showSuccess(result.message || (action === "accept" ? "You are now a moderator!" : "Invitation declined"));
      if (!notification.read) {
        await markAsRead(notification._id);
      }
      await fetchNotifications();
    } catch (err) {
      showError(err.message || "Failed to respond to invitation");
    } finally {
      setRespondingId(null);
    }
  };

  // Enhanced click handler
  const handleNotificationClick = (notification) => {
    // Morning/Evening check-in notifications are not clickable
    if (NON_CLICKABLE_TYPES.has(notification.type)) return;

    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Likes/comments: go to post/comment
    if (notification.type === "COMMUNITY_COMMENT" && notification.data?.postId) {
    const base = notification.data.groupId
        ? `/community/group/${notification.data.groupId}`
        : `/community`;
    const query = `?focus=${notification.data.postId}${notification.data.commentId ? `&comment=${notification.data.commentId}` : ""}`;
    navigate(`${base}${query}`);
    setIsOpen(false);
    return;
}
    if (notification.type === "COMMUNITY_LIKE" && notification.data?.postId) {
    const base = notification.data.groupId
        ? `/community/group/${notification.data.groupId}`
        : `/community`;
    navigate(`${base}?focus=${notification.data.postId}`);
    setIsOpen(false);
    return;
    }
    // Group accept: go to group
    if (notification.type === "GROUP_JOIN_APPROVED" && notification.data?.groupId) {
      navigate(`/community/group/${notification.data.groupId}`);
      setIsOpen(false);
      return;
    }
    if (notification.type === "GROUP_MODERATOR_ASSIGNED" && notification.data?.groupId) {
      navigate(`/admin/groups/${notification.data.groupId}/moderator/dashboard`);
      setIsOpen(false);
      return;
    }
    if (
      (notification.type === "GROUP_MODERATOR_ACCEPTED" || notification.type === "GROUP_MODERATOR_DECLINED") &&
      notification.data?.groupId
    ) {
      navigate(`/admin/groups/${notification.data.groupId}/moderator/dashboard`);
      setIsOpen(false);
      return;
    }
    // Fallback: use actionUrl if present
    if (notification.data?.actionUrl) {
      const actionUrl = notification.data.actionUrl;
      if (typeof actionUrl === "string" && actionUrl.startsWith("/")) {
        navigate(actionUrl);
      } else if (typeof actionUrl === "string" && /^https?:\/\//.test(actionUrl)) {
        window.location.href = actionUrl;
      }
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition"
      >
        <Bell className="w-7 h-7 text-gray-600 dark:text-gray-300" />
        
        {visibleUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {visibleUnreadCount > 9 ? "9+" : visibleUnreadCount}
          </span>
        )}

        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            connected ? "bg-green-500" : "bg-gray-400"
          }`}
          title={connected ? "Connected" : "Disconnected"}
        />
      </button>

      {isOpen && (
        <>
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Notifications</h3>
              <div className="flex gap-2 items-center">
                {visibleUnreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="divide-y dark:divide-gray-700">
              {visibleNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell size={48} className="mx-auto mb-2 opacity-30" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                visibleNotifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onDelete={() => {
                      deleteNotification(notification._id);
                    }}
                    onModeratorResponse={handleModeratorInvitationResponse}
                    respondingId={respondingId}
                  />
                ))
              )}
            </div>
          </div>

          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
}

function NotificationItem({ notification, onClick, onDelete, onModeratorResponse, respondingId }) {
  const priorityDots = {
    HIGH: "bg-red-500",
    MEDIUM: "bg-yellow-500",
    LOW: "bg-blue-500"
  };

  const isCheckin = [
    "MOOD_REMINDER_MORNING",
    "MOOD_REMINDER_EVENING",
    "STREAK_ACHIEVED",
    "STREAK_AT_RISK"
  ].includes(notification.type);

  const isModeratorInvite =
    notification.type === "GROUP_MODERATOR_INVITATION" &&
    notification.data?.invitationStatus !== "accepted" &&
    notification.data?.invitationStatus !== "declined";

  const isNonClickable = isCheckin || isModeratorInvite;

  // Likes/comments: show user name and preview
  let message = notification.message;
  if (notification.type === "COMMUNITY_COMMENT" && notification.data) {
    const name = notification.data.userName || "Someone";
    const preview = notification.data.commentContent ? `: "${notification.data.commentContent.slice(0, 30)}${notification.data.commentContent.length > 30 ? '...' : ''}"` : "";
    message = `${name} commented${preview}`;
  }
  if (notification.type === "COMMUNITY_LIKE" && notification.data) {
    const name = notification.data.userName || "Someone";
    message = `${name} liked your post`;
  }

  return (
    <div
      className={`p-4 ${isNonClickable ? 'cursor-default' : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'} transition ${
        !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
      onClick={isNonClickable ? undefined : onClick}
      tabIndex={isNonClickable ? -1 : 0}
      aria-disabled={isNonClickable}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
            priorityDots[notification.priority] || "bg-gray-400"
          }`}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="font-normal text-sm text-gray-800 dark:text-white">{notification.title}</h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <p className="text-sm font-normal text-gray-600 dark:text-gray-300 mt-1">{message}</p>
          {isModeratorInvite && (
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onModeratorResponse(notification, "accept");
                }}
                disabled={!!respondingId}
                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#89beab] text-white hover:bg-[#6fa893] disabled:opacity-50"
              >
                {respondingId === `${notification._id}-accept` ? "Accepting..." : "Accept"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onModeratorResponse(notification, "decline");
                }}
                disabled={!!respondingId}
                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
              >
                {respondingId === `${notification._id}-decline` ? "Declining..." : "Decline"}
              </button>
            </div>
          )}
          <p className="text-xs font-normal text-gray-400 dark:text-gray-500 mt-2">
            {formatTimestamp(notification.createdAt)}
          </p>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}