import React from "react";
import toast from "react-hot-toast";


export const showSuccess = (message) => toast.success(message);
export const showError = (message) => toast.error(message);
export const showInfo = (message) => toast(message);

export const confirmAction = (
    message,
    { confirmText = "Confirm", cancelText = "Cancel" } = {}
) =>
    new Promise((resolve) => {
        toast.custom(
            (t) => (
                <div
                    className={`w-[min(92vw,22rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800 ${
                        t.visible ? "animate-[toast-in_180ms_ease-out]" : "animate-[toast-out_120ms_ease-in]"
                    }`}
                    role="alertdialog"
                    aria-live="assertive"
                    aria-label="Confirmation dialog"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            !
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                Confirm action
                            </p>
                            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                {message}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                toast.dismiss(t.id);
                                resolve(false);
                            }}
                            className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                toast.dismiss(t.id);
                                resolve(true);
                            }}
                            className="inline-flex items-center rounded-full bg-[#f4873e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e97727]"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            ),
            { duration: Infinity, position: "top-center" }
        );
    });
