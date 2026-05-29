import React, { useState, useEffect, useRef } from "react";
import { X, Send, Link, Check } from "lucide-react";
import { getPeerMessages, sendPeerMessage, savePeerMeetingLink } from "../services/communityService";
import { io } from "socket.io-client";
import config from "../config";

const BACKEND_URL = config.BACKEND_URL;

const PrivateChatModal = ({ connection, currentUserId, onClose, isPage }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [meetingLinkInput, setMeetingLinkInput] = useState(connection.calendlyLink || "");
    const [showMeetingLink, setShowMeetingLink] = useState(false);
    const [linkSaved, setLinkSaved] = useState(false);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const socketRef = useRef(null);

    const otherPerson = connection.requesterId?._id === currentUserId ||
        connection.requesterId === currentUserId
        ? connection.recipientId
        : connection.requesterId;

    const otherName = otherPerson?.firstName
        ? `${otherPerson.firstName} ${otherPerson.lastName}`
        : "Member";

    useEffect(() => {
        getPeerMessages(connection._id).then(data => setMessages(data.messages || []));

        // Attach to existing socket for real-time messages
        const token = localStorage.getItem("token");
        socketRef.current = io(BACKEND_URL, {
            auth: { token },
            transports: ["websocket", "polling"]
        });

        socketRef.current.on("peer-message", ({ connectionId, message }) => {
            if (connectionId === connection._id) {
                setMessages(prev => [...prev, message]);
            }
        });

        return () => socketRef.current?.disconnect();
    }, [connection._id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;
        setSending(true);
        try {
            const data = await sendPeerMessage(connection._id, input.trim());
            setMessages(prev => [...prev, data.message]);
            setInput("");
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const handleSaveMeetingLink = async () => {
        try {
            await savePeerMeetingLink(connection._id, meetingLinkInput);
            setLinkSaved(true);
            setTimeout(() => setLinkSaved(false), 2000);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div
            className={
                isPage
                    ? "w-full h-screen flex flex-col bg-white dark:bg-gray-900"
                    : "fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            }
        >
            <div
                className={
                    isPage
                        ? "flex flex-col flex-1 w-full max-w-2xl mx-auto shadow-none rounded-none bg-white dark:bg-gray-900"
                        : "bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md flex flex-col"
                }
                style={isPage ? { height: '100%' } : { height: 520 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700" style={isPage ? { minHeight: 64 } : {}}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f8ba90] to-[#f4873e] flex items-center justify-center text-white font-bold">
                            {otherName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{otherName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Private chat</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMeetingLink(v => !v)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            title="Schedule a meeting"
                        >
                            <Link className="w-4 h-4 text-[#89beab]" />
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                            <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </div>

                {/* Meeting link section */}
                {showMeetingLink && (
                    <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex gap-2">
                        <input
                            value={meetingLinkInput}
                            onChange={e => setMeetingLinkInput(e.target.value)}
                            placeholder="Paste meeting link (Zoom/Meet/Teams)..."
                            className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#89beab]"
                        />
                        <button
                            onClick={handleSaveMeetingLink}
                            className="px-3 py-2 rounded-xl bg-[#89beab] hover:bg-[#6fa893] text-white text-sm font-semibold transition flex items-center gap-1"
                        >
                            {linkSaved ? <Check className="w-4 h-4" /> : "Save"}
                        </button>
                    </div>
                )}

                {/* Show existing meeting link if set */}
                {connection.calendlyLink && !showMeetingLink && (
                    <div className="px-5 py-2 border-b border-gray-200 dark:border-gray-700">
                        <a
                            href={connection.calendlyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#89beab] hover:underline flex items-center gap-1"
                        >
                            <Link className="w-3 h-3" /> Open meeting link
                        </a>
                    </div>
                )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3" style={isPage ? { minHeight: 0 } : {}}>
                {messages.length === 0 && (
                    <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
                        Say hello! This is your private chat with {otherName}.
                    </p>
                )}
                {messages.map((msg, i) => {
                    const senderId = msg.senderId?._id || msg.senderId;
                    const isMe = senderId?.toString() === currentUserId;
                    return (
                        <div key={msg._id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMe
                                    ? "bg-[#f4873e] text-white rounded-br-sm"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-2" style={isPage ? { marginBottom: 0 } : {}}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 text-sm px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#f4873e]"
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="w-9 h-9 rounded-full bg-[#f4873e] hover:bg-[#ffa669] text-white flex items-center justify-center transition disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    </div >
  );
};

export default PrivateChatModal;