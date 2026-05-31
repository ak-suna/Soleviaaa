import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { ThemeProvider } from "../contexts/ThemeContext";
import MobileMenu from "../components/MobileMenu";

export default function ThemedLayout({ children }) {
    const location = useLocation();
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const hideSharedMobileButton =
        location.pathname === "/user/dashboard" ||
        location.pathname === "/settings" ||
        location.pathname === "/community";

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors pt-16 lg:pt-0 overflow-x-hidden">
                {!hideSharedMobileButton && (
                    <>
                        <button
                            onClick={() => setShowMobileMenu(true)}
                            className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-700"
                            aria-label="Open menu"
                            type="button"
                        >
                            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </button>

                        <MobileMenu
                            isOpen={showMobileMenu}
                            onClose={() => setShowMobileMenu(false)}
                            type="user"
                        />
                    </>
                )}
                {children}
            </div>
        </ThemeProvider>
    );
}