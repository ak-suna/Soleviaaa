import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getMyPeerConnections,
  getPeerMessages,
  sendPeerMessage,
  savePeerMeetingLink,
  deletePeerConnection,
} from "../services/communityService";
import { jwtDecode } from "jwt-decode";
import { ArrowLeft, Clock, Check, Send, Link, Calendar, UserMinus } from "lucide-react";
import { io } from "socket.io-client";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import config from "../config";
// import NotificationBell from "../components/NotificationBell";
// import { Settings } from "lucide-react";

const BACKEND_URL = config.BACKEND_URL;

const AVATAR_COLORS = [
  ["#f8ba90", "#f4873e"],
  ["#a8d5c4", "#89beab"],
  ["#85B7EB", "#378ADD"],
  ["#F4C0D1", "#D4537E"],
  ["#C0DD97", "#639922"],
];

const getOtherPerson = (conn, currentUserId) => {
  const isRequester =
    conn.requesterId?._id === currentUserId || conn.requesterId === currentUserId;
  return isRequester ? conn.recipientId : conn.requesterId;
};

const getDisplayName = (person) =>
  person?.firstName ? `${person.firstName} ${person.lastName}` : "Member";

const Avatar = ({ name, colorIdx, size = 36 }) => {
  const [from, to] = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: size * 0.38,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
};

const GroupChatPage = () => {
  const { groupId, connectionId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUserId = token ? jwtDecode(token).id : null;

  const [connections, setConnections] = useState([]);
  const [activeId, setActiveId] = useState(connectionId || null);
  const [messagesMap, setMessagesMap] = useState({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showMeetingLink, setShowMeetingLink] = useState(false);
  const [meetingLinkInput, setMeetingLinkInput] = useState("");
  const [linkSaved, setLinkSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setMeetingAlert] = useState(null); // { connectionId, link }
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [toast, setToast] = useState(null);

  const bottomRef = useRef(null);
  const activeIdRef = useRef(activeId);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  useEffect(() => {
    setLoading(true);
    getMyPeerConnections(groupId)
      .then((data) => {
        const conns = data.connections || [];
        setConnections(conns);
        const target = connectionId
          ? conns.find((c) => c._id === connectionId)
          : conns[0];
        if (target) {
          setActiveId(target._id);
          setMeetingLinkInput(target.calendlyLink || "");
          getPeerMessages(target._id).then((d) => {
            setMessagesMap((prev) => ({ ...prev, [target._id]: d.messages || [] }));
          });
        }
      })
      .finally(() => setLoading(false));
  }, [groupId, connectionId]);

  useEffect(() => {
    const tok = localStorage.getItem("token");
    const socket = io(BACKEND_URL, {
      auth: { token: tok },
      transports: ["websocket", "polling"],
    });
    socket.on("peer-message", ({ connectionId: cId, message }) => {
      setMessagesMap((prev) => ({
        ...prev,
        [cId]: [...(prev[cId] || []), message],
      }));
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const tok = localStorage.getItem("token");
    const socket = io(BACKEND_URL, {
      auth: { token: tok },
      transports: ["websocket", "polling"],
    });

    socket.on("peer-message", ({ connectionId: cId, message }) => {
      setMessagesMap((prev) => ({
        ...prev,
        [cId]: [...(prev[cId] || []), message],
      }));
    });

    // ✅ NEW: listen for meeting scheduled
    socket.on("peer-meeting-scheduled", ({ connectionId: cId, link }) => {
      // Only show alert if this connection is currently active
      setMeetingAlert({ connectionId: cId, link });

      // Also update the connection's calendlyLink in local state
      setConnections((prev) =>
        prev.map((c) => (c._id === cId ? { ...c, calendlyLink: link } : c))
      );
    });

    return () => socket.disconnect();
  }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesMap, activeId]);

  const handleSelectConnection = useCallback(
    (conn) => {
      setActiveId(conn._id);
      setMeetingLinkInput(conn.calendlyLink || "");
      setShowMeetingLink(false);
      setInput("");
      setMessagesMap((prev) => {
        if (prev[conn._id]) return prev;
        getPeerMessages(conn._id).then((d) => {
          setMessagesMap((p) => ({ ...p, [conn._id]: d.messages || [] }));
        });
        return prev;
      });
      navigate(`/community/group/${groupId}/chat/${conn._id}`, { replace: true });
    },
    [groupId, navigate]
  );

  const handleSend = async () => {
    if (!input.trim() || sending || !activeId) return;
    setSending(true);
    try {
      const data = await sendPeerMessage(activeId, input.trim());
      setMessagesMap((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), data.message],
      }));
      setInput("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleSaveMeetingLink = async () => {
    if (!activeId) return;
    try {
      await savePeerMeetingLink(activeId, meetingLinkInput);
      setLinkSaved(true);
      setTimeout(() => setLinkSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnect = async () => {
    if (!activeId) return;
    try {
      await deletePeerConnection(activeId);
      setToast({ message: "Connection removed", type: "success" });
      setTimeout(() => {
        navigate(`/community/group/${groupId}`);
      }, 1500);
    } catch (e) {
      setToast({ message: e.message || "Failed to remove connection", type: "error" });
    } finally {
      setShowDisconnectModal(false);
    }
  };

  const activeConn = connections.find((c) => c._id === activeId);
  const otherPerson = activeConn ? getOtherPerson(activeConn, currentUserId) : null;
  const otherName = getDisplayName(otherPerson);
  const activeMessages = (activeId && messagesMap[activeId]) || [];
  const activeConnIdx = connections.findIndex((c) => c._id === activeId);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
      {/* Your existing sidebar */}
      <Sidebar />

      {/* Main card — matches dashboard exactly */}
      <div className="flex-1 lg:ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] overflow-hidden flex"
        style={{ height: "calc(100vh - 48px)" }}>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Loading chats...</p>
          </div>
        ) : (
          <>
            {/* ── Peer sidebar — inside the rounded card ── */}
            <div className="w-64 flex-shrink-0 flex flex-col border-r-2 border-gray-100 dark:border-gray-700">
              {/* Sidebar header */}
              <div className="px-5 pt-7 pb-4">
                <button
                  onClick={() => navigate(`/community/group/${groupId}`)}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#f4873e] transition mb-5 group"
                >
                  <div className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center group-hover:border-[#f4873e] transition">
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </div>
                  Back to group
                </button>

                <h2 className="text-base font-bold text-gray-900 dark:text-white">Peer chats</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Private connections</p>
              </div>

              {/* Connection list */}
              <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
                {connections.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 mt-8 px-4">
                    No peer connections yet.
                  </p>
                ) : (
                  connections.map((conn, i) => {
                    const person = getOtherPerson(conn, currentUserId);
                    const name = getDisplayName(person);
                    const isActive = conn._id === activeId;
                    return (
                      <button
                        key={conn._id}
                        onClick={() => handleSelectConnection(conn)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all ${isActive
                          ? "bg-[#fff4ee] dark:bg-orange-950/20 shadow-sm"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                      >
                        {person?.profilePicture ? (
                          <img
                            src={person.profilePicture}
                            alt={name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-[#f8ba90]"
                          />
                        ) : (
                          <Avatar name={name} colorIdx={i} size={38} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isActive ? "text-[#f4873e]" : "text-gray-800 dark:text-white"
                            }`}>
                            {name}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">Private chat</p>
                        </div>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-[#f4873e] flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── Chat panel ── */}
            {activeConn ? (
              <div className="flex-1 flex flex-col min-w-0">

                {/* Chat header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b-2 border-gray-100 dark:border-gray-700 flex-shrink-0">
                  {otherPerson?.profilePicture ? (
                    <img
                      src={otherPerson.profilePicture}
                      alt={otherName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#f8ba90]"
                    />
                  ) : (
                    <Avatar name={otherName} colorIdx={activeConnIdx} size={40} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 dark:text-white truncate"
                      style={{ fontFamily: "Brasika, sans-serif" }}>
                      {otherName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Private chat</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Schedule pill — matches your UI's button style */}
                    <button
                      onClick={() => setShowMeetingLink((v) => !v)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${showMeetingLink
                        ? "bg-[#89beab] text-white shadow-md"
                        : "bg-[#89beab]/10 text-[#89beab] border border-[#89beab]/30 hover:bg-[#89beab]/20"
                        }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Schedule meeting
                    </button>

                    {/* Disconnect button */}
                    <button
                      onClick={() => setShowDisconnectModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                      title="End Connection"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                </div>

                {/* Meeting link card — styled like dashboard's inner panels */}
                {showMeetingLink && (
                  <div className="px-6 py-4 border-b-2 border-gray-100 dark:border-gray-700 flex-shrink-0 bg-[#f4f2f0]/50 dark:bg-gray-700/30">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-[#89beab]/20 p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-[#89beab]/15 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-[#89beab]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">
                            Schedule a real meeting
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Share any meeting link (Zoom, Google Meet, Teams) with {otherName}
                          </p>
                        </div>
                      </div>

                      {activeConn?.calendlyLink && (
                        <a
                          href={activeConn.calendlyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 mb-3 px-4 py-2.5 rounded-2xl bg-[#89beab]/10 hover:bg-[#89beab]/20 transition text-xs text-[#0F6E56] dark:text-[#5DCAA5] font-semibold border border-[#89beab]/20"
                        >
                          <Link className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{activeConn.calendlyLink}</span>
                        </a>
                      )}

                      <div className="flex gap-2">
                        <input
                          value={meetingLinkInput}
                          onChange={(e) => setMeetingLinkInput(e.target.value)}
                          placeholder="https://meet.google.com/... or Zoom/Teams link"
                          className="flex-1 text-sm px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#89beab] transition"
                        />
                        <button
                          onClick={handleSaveMeetingLink}
                          className="px-5 py-2.5 rounded-2xl bg-[#89beab] hover:bg-[#6fa893] active:scale-95 text-white text-sm font-semibold transition flex items-center gap-2 flex-shrink-0"
                        >
                          {linkSaved ? (
                            <><Check className="w-4 h-4" /> Saved!</>
                          ) : "Save link"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}


                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 bg-[#f4f2f0]/30 dark:bg-gray-900/30">
                  {activeMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
                      <div className="w-14 h-14 rounded-full bg-[#f8ba90]/30 flex items-center justify-center overflow-hidden">
                        {otherPerson?.profilePicture ? (
                          <img
                            src={otherPerson.profilePicture}
                            alt={otherName}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <Avatar name={otherName} colorIdx={activeConnIdx} size={40} />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Say hello to {otherName}!
                      </p>
                    </div>
                  ) : (
                    activeMessages.map((msg, i) => {
                      const senderId = msg.senderId?._id || msg.senderId;
                      const isMe = senderId?.toString() === currentUserId;
                      return (
                        <div key={msg._id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[60%] px-4 py-2.5 rounded-3xl text-sm leading-relaxed ${isMe
                            ? "bg-[#f4873e] text-white rounded-br-lg shadow-sm"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-lg border border-gray-100 dark:border-gray-700 shadow-sm"
                            }`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input bar — matches dashboard's rounded aesthetic */}
                <div className="px-4 lg:px-5 py-4 border-t-2 border-gray-100 dark:border-gray-700 flex gap-3 items-center flex-shrink-0 bg-white dark:bg-gray-800">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={`Message ${otherName}...`}
                    className="flex-1 text-sm px-5 py-3 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#f4873e] transition"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="w-11 h-11 rounded-full bg-[#f4873e] hover:bg-[#ffa669] text-white flex items-center justify-center transition-all disabled:opacity-40 shadow-md hover:shadow-lg active:scale-95 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#f4f2f0]/30 dark:bg-gray-900/30">
                <div className="w-16 h-16 rounded-full bg-[#f8ba90]/20 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-[#f4873e]/40" />
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Select a conversation to start chatting
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Disconnect Confirmation Modal */}
      <Modal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        title="End Connection"
      >
        <div className="p-1 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to end your peer connection with <strong>{otherName}</strong>?
            This will delete all messages and you will need to send a new request to connect again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowDisconnectModal(false)}
              className="px-6 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDisconnect}
              className="px-6 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md transition"
            >
              Disconnect
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100]">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div >
  );
};

export default GroupChatPage;
