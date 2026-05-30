import React from "react";
import toast from "react-hot-toast";
import jwtDecode from "jwt-decode";

export const showSuccess = (message) => toast.success(message);
export const showError = (message) => toast.error(message);
export const showInfo = (message) => toast(message);

// Temporary debug-friendly confirmAction:
// - On Vercel (hostname includes 'vercel.app') or when REACT_APP_DEBUG_DELETE==='true',
//   use window.confirm() and log token + decoded payload to console.
export const confirmAction = (
    message,
    { confirmText = "Confirm", cancelText = "Cancel" } = {}
) =>
    new Promise((resolve) => {
        try {
            console.log("confirmAction invoked:", message);
            const isDebug = process.env.REACT_APP_DEBUG_DELETE === "true" || (typeof window !== "undefined" && window.location.hostname.includes("vercel.app"));
            if (isDebug) {
                const ok = window.confirm(message);
                try {
                    const token = localStorage.getItem("token");
                    console.log("confirmAction token:", token);
                    if (token) {
                        try {
                            console.log("confirmAction decoded:", jwtDecode(token));
                        } catch (err) {
                            console.warn("Failed to decode token in confirmAction:", err);
                        }
                    }
                } catch (e) {
                    console.warn("Error accessing token in confirmAction:", e);
                }
                resolve(ok);
                return;
            }
        } catch (e) {
            // fall back to toast UI if anything goes wrong
            console.warn("confirmAction debug fallback error:", e);
        }

        toast((t) => (
            <div className="max-w-sm">
                <p className="text-sm text-gray-900 mb-3">{message}</p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            resolve(false);
                        }}
                        className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            // log token + decoded when user confirms via toast UI as well
                            try {
                                const token = localStorage.getItem("token");
                                console.log("confirmAction token:", token);
                                if (token) {
                                    try { console.log("confirmAction decoded:", jwtDecode(token)); } catch (err) { console.warn(err); }
                                }
                            } catch (err) { console.warn(err); }
                            toast.dismiss(t.id);
                            resolve(true);
                        }}
                        className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    });
