import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile, changePassword } from "../services/profile";
import { logout, deactivateAccount, requestAccountDeletion, getToken } from "../services/auth";
import { ChevronRight, LogOut, Save, X, Check, Camera, Moon, Sun, AlertTriangle, Menu } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MobileMenu from "../components/MobileMenu";
import PasswordStrength, { checkPasswordStrength } from "../components/PasswordStrength";
import { uploadProfilePicture } from "../services/profile";
import FontSizeToggle from "../components/FontSizeToggle";
import Toast from "../components/Toast";
import axios from "axios";
import { deriveKey, encryptContent, decryptContent, initializeEncryption } from "../utils/encryption";
import config from "../config";

const SettingsPage = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [activeSection, setActiveSection] = useState("account");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [editingField, setEditingField] = useState(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Lifecycle state
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [lifecycleLoading, setLifecycleLoading] = useState(false);

    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
    });
    const [uploadingPic, setUploadingPic] = useState(false);
    const fileInputRef = React.useRef(null);
    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: "error", text: "Image must be under 5MB" });
            return;
        }
        setUploadingPic(true);
        try {
            const data = await uploadProfilePicture(file);
            setProfile(prev => ({ ...prev, profilePicture: data.profilePicture }));
            setMessage({ type: "success", text: "Profile picture updated!" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setUploadingPic(false);
        }
    };

    const [tempValue, setTempValue] = useState("");

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await getProfile();
            setProfile(data);
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (field) => {
        setEditingField(field);
        setTempValue(profile[field] || "");
        setMessage({ type: "", text: "" });
    };

    const cancelEditing = () => {
        setEditingField(null);
        setTempValue("");
    };

    const saveField = async (field) => {
        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            await updateProfile({ [field]: tempValue });
            setProfile({ ...profile, [field]: tempValue });
            setEditingField(null);
            setMessage({ type: "success", text: "Updated successfully!" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" });
            setSaving(false);
            return;
        }
        // Password requirements
        const checks = checkPasswordStrength(passwordData.newPassword);
        if (checks.some((v) => !v)) {
            setMessage({ type: "error", text: "Password does not meet all requirements." });
            setSaving(false);
            return;
        }

        try {
            // 1. Fetch all journal entries
            const token = getToken();
            const API_URL = `${config.BACKEND_URL}/api/journal`;
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const entries = response.data;

            // 2. Derive old and new keys
            const oldKey = deriveKey(passwordData.currentPassword);
            const newKey = deriveKey(passwordData.newPassword);

            // 3. Re-encrypt entries
            const updatePromises = entries.map(async (entry) => {
                try {
                    // Try decrypting with old key
                    const decryptedText = decryptContent(entry.content, oldKey);
                    // Encrypt with new key
                    const newEncryptedContent = encryptContent(decryptedText, newKey);

                    // Update the entry on the backend
                    return axios.put(`${API_URL}/${entry._id}`,
                        { content: newEncryptedContent },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } catch (err) {
                    // If decryption fails, it might be corrupted or already encrypted with another key.
                    // We skip it to avoid overwriting with garbage.
                    console.warn(`Skipping re-encryption for entry ${entry._id} (Decryption failed)`);
                    return null;
                }
            });

            await Promise.all(updatePromises);

            // 4. Update password on backend
            await changePassword(passwordData.currentPassword, passwordData.newPassword);

            // 5. Update session key so user can continue journaling
            initializeEncryption(passwordData.newPassword);

            setMessage({ type: "success", text: "Password changed & journals re-encrypted!" });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleDeactivate = async () => {
        setLifecycleLoading(true);
        try {
            await deactivateAccount();
            setToast({ show: true, message: "Account deactivated successfully.", type: "success" });
            setTimeout(() => {
                logout();
                navigate("/login");
            }, 2000);
        } catch (error) {
            setToast({ show: true, message: error.message, type: "error" });
            setLifecycleLoading(false);
            setShowDeactivateModal(false);
        }
    };

    const handleRequestDeletion = async () => {
        setLifecycleLoading(true);
        try {
            await requestAccountDeletion();
            setToast({ show: true, message: "Account deletion requested successfully.", type: "success" });
            setTimeout(() => {
                logout();
                navigate("/login");
            }, 2000);
        } catch (error) {
            setToast({ show: true, message: error.message, type: "error" });
            setLifecycleLoading(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f4873e]"></div>
            </div>
        );
    }

    const InfoField = ({ label, value, field, editable = true }) => (
        <div className="flex items-center justify-between py-4 border-b border-[#f4873e]/10 dark:border-gray-600 hover:bg-[#f8ba90]/10 dark:hover:bg-gray-700 px-4 transition-colors rounded-lg">
            <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
            {editingField === field ? (
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="px-3 py-1 border-2 border-[#f4873e] dark:border-orange-500 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#f4873e]"
                        autoFocus
                    />
                    <button
                        onClick={() => saveField(field)}
                        disabled={saving}
                        className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"
                    >
                        <Check className="w-5 h-5" />
                    </button>
                    <button
                        onClick={cancelEditing}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{value || "Not set"}</span>
                    {editable && (
                        <button
                            onClick={() => startEditing(field)}
                            className="p-1.5 hover:bg-[#f8ba90]/30 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-[#f4873e] dark:text-orange-400" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 relative">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setShowMobileMenu(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-700"
            >
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            <Sidebar />
            <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} type="user" />
            <Link
                to="/dashboard"
                className="flex items-center mb-4 lg:mb-6 text-gray-700 dark:text-gray-300 hover:text-[#f4873e] dark:hover:text-orange-400 transition font-medium"
            >
                {/* <ChevronLeft className="mr-2 w-5 h-5" /> */}
                {/* Back to Dashboard */}
            </Link>

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-4 right-4 z-50">
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
                </div>
            )}

            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Left Sidebar */}
                <div className="w-full lg:w-72 bg-[#f8ba90] dark:bg-gray-800 rounded-[40px] p-4 lg:p-6 shadow-lg h-fit border-2 border-[#f4873e]/20 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-[#1F3B36] dark:text-white mb-6" style={{ fontFamily: "Brasika" }}>Settings</h2>
                    <div className="space-y-2">
                        <button
                            onClick={() => setActiveSection("account")}
                            className={`w-full text-left px-4 py-3 rounded-2xl font-medium transition-all ${activeSection === "account"
                                ? "bg-white dark:bg-gray-700 text-[#f4873e] dark:text-orange-400 shadow-md border-l-4 border-[#f4873e]"
                                : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700"
                                }`}
                        >
                            Account
                        </button>
                        <button
                            onClick={() => setActiveSection("appearance")}
                            className={`w-full text-left px-4 py-3 rounded-2xl font-medium transition-all ${activeSection === "appearance"
                                ? "bg-white dark:bg-gray-700 text-[#f4873e] dark:text-orange-400 shadow-md border-l-4 border-[#f4873e]"
                                : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700"
                                }`}
                        >
                            Appearance
                        </button>
                        <button
                            onClick={() => setActiveSection("notifications")}
                            className={`w-full text-left px-4 py-3 rounded-2xl font-medium transition-all ${activeSection === "notifications"
                                ? "bg-white dark:bg-gray-700 text-[#f4873e] dark:text-orange-400 shadow-md border-l-4 border-[#f4873e]"
                                : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700"
                                }`}
                        >
                            Notifications
                        </button>
                        <button
                            onClick={() => setActiveSection("security")}
                            className={`w-full text-left px-4 py-3 rounded-2xl font-medium transition-all ${activeSection === "security"
                                ? "bg-white dark:bg-gray-700 text-[#f4873e] dark:text-orange-400 shadow-md border-l-4 border-[#f4873e]"
                                : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700"
                                }`}
                        >
                            Security
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-3 rounded-2xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all flex items-center gap-2 mt-8"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-[#f4f2f0] dark:bg-gray-800 rounded-[40px] p-8 shadow-lg border-2 border-gray-200 dark:border-gray-700">
                    {/* Message Display */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${message.type === "success"
                            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-200 dark:border-red-800"
                            }`}>
                            {message.type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                            <span>{message.text}</span>
                        </div>
                    )}

                    {/* Account Section */}
                    {activeSection === "account" && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6" style={{ fontFamily: "Brasika" }}>Account Settings</h2>

                            <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-[#f4873e]/20 dark:border-gray-600">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f8ba90] to-[#f4873e] flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
                                        {profile.profilePicture ? (
                                            <img
                                                src={profile.profilePicture}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>{profile.firstName?.charAt(0) || "U"}{profile.lastName?.charAt(0) || ""}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingPic}
                                        className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-lg border-2 border-[#f4873e] dark:border-orange-500 hover:border-[#ff9e5e] transition-colors disabled:opacity-60"
                                    >
                                        {uploadingPic ? (
                                            <div className="w-4 h-4 border-2 border-[#f4873e] border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Camera className="w-4 h-4 text-[#f4873e] dark:text-orange-400" />
                                        )}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePictureUpload}
                                        className="hidden"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {profile.firstName} {profile.lastName}
                                    </p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingPic}
                                        className="text-sm text-[#f4873e] dark:text-orange-400 hover:text-[#ff9e5e] dark:hover:text-orange-300 font-medium disabled:opacity-60"
                                    >
                                        {uploadingPic ? "Uploading..." : "Upload new picture"}
                                    </button>
                                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or GIF · Max 5MB</p>
                                </div>
                            </div>

                            {/* Basic Info */}
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Basic Info</h3>
                            <div className="space-y-2 mb-8">
                                <InfoField
                                    label="First Name"
                                    value={profile.firstName}
                                    field="firstName"
                                />
                                <InfoField
                                    label="Last Name"
                                    value={profile.lastName}
                                    field="lastName"
                                />
                                <InfoField
                                    label="Email"
                                    value={profile.email}
                                    field="email"
                                    editable={false}
                                />
                                <InfoField
                                    label="Phone"
                                    value={profile.phone}
                                    field="phone"
                                />
                                <InfoField
                                    label="Address"
                                    value={profile.address}
                                    field="address"
                                />
                            </div>
                        </div>
                    )}

                    {/* Appearance Section */}
                    {activeSection === "appearance" && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6" style={{ fontFamily: "Brasika" }}>Appearance</h2>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-700 rounded-2xl shadow-md border-2 border-[#f4873e]/10 dark:border-gray-600">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Theme</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark mode</p>
                                    </div>

                                    <button
                                        onClick={toggleTheme}
                                        className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300 dark:bg-[#f4873e] transition-colors"
                                    >
                                        <span
                                            className={`h-6 w-6 transform rounded-full bg-white transition-transform flex items-center justify-center ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                                                }`}
                                            style={{ fontFamily: "Brasika" }}
                                        >
                                            {theme === 'dark' ? (
                                                <Moon className="w-4 h-4 text-[#f4873e]" />
                                            ) : (
                                                <Sun className="w-4 h-4 text-gray-600" />
                                            )}
                                        </span>
                                    </button>
                                </div>
                                {/* Font size toggle below dark mode */}
                                <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-700 rounded-2xl shadow-md border-2 border-[#f4873e]/10 dark:border-gray-600">
                                    <FontSizeToggle />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Section */}
                    {activeSection === "notifications" && (
                        <NotificationSettingsContent />
                    )}

                    {/* Security Section */}
                    {activeSection === "security" && (
                        <div>
                            {/* Section Heading matching the flat Left-Aligned layout */}
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6" style={{ fontFamily: "Brasika" }}>
                                Security
                            </h2>

                            <div className="space-y-6">
                                {/* Inner White Box Panel with updated matching border styles and enhanced top/bottom padding */}
                                <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-md border-2 border-[#f4873e]/10 dark:border-gray-600 px-8 py-10 sm:px-12">

                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">
                                        Change Password
                                    </h3>

                                    <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md mx-auto w-full">

                                        {/* Current Password Field */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Current Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    required
                                                    className="w-full pl-4 pr-12 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4873e]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f4873e] dark:hover:text-teal-400 transition-colors duration-200"
                                                >
                                                    {showCurrentPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* New Password Field */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                New Password (min 8 characters)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    required
                                                    minLength={8}
                                                    className="w-full pl-4 pr-12 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4873e]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f4873e] dark:hover:text-teal-400 transition-colors duration-200"
                                                >
                                                    {showNewPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                            <PasswordStrength password={passwordData.newPassword} />
                                        </div>

                                        {/* Confirm New Password Field */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Confirm New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    required
                                                    minLength={6}
                                                    className="w-full pl-4 pr-12 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4873e]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f4873e] dark:hover:text-teal-400 transition-colors duration-200"
                                                >
                                                    {showConfirmPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action Button layout matching form bounds */}
                                        <div className="w-full flex justify-center pt-2">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="w-full sm:w-auto px-10 py-2.5 bg-[#89beab] dark:bg-teal-600 text-white rounded-xl font-medium hover:bg-[#FFA669] dark:hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-center"
                                            >
                                                {saving ? "Updating..." : "Change Password"}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Account Management Panel */}
                                <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-md border-2 border-red-200 dark:border-red-900/50 px-8 py-10 sm:px-12 mt-8">
                                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-6 text-center">
                                        Account Management
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-orange-50 dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-gray-600">
                                            <div className="mb-4 sm:mb-0">
                                                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Deactivate Account</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Temporarily hide your profile and pause notifications.</p>
                                            </div>
                                            <button
                                                onClick={() => setShowDeactivateModal(true)}
                                                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                                            >
                                                Deactivate
                                            </button>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-red-50 dark:bg-gray-800 rounded-xl border border-red-200 dark:border-gray-600">
                                            <div className="mb-4 sm:mb-0">
                                                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Delete Account</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Request permanent deletion of your account and data.</p>
                                            </div>
                                            <button
                                                onClick={() => setShowDeleteModal(true)}
                                                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                                            >
                                                Delete Account
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Deactivate Modal */}
            {showDeactivateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fade-in-up">
                        <button
                            onClick={() => setShowDeactivateModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <AlertTriangle className="w-8 h-8 text-orange-500" />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2" style={{ fontFamily: "Brasika" }}>
                            Deactivate Account?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
                            Your profile will be hidden and you won't receive notifications. You can reactivate anytime by logging back in.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeactivateModal(false)}
                                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeactivate}
                                disabled={lifecycleLoading}
                                className="flex-1 px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors flex justify-center items-center"
                            >
                                {lifecycleLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Deactivate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fade-in-up border-t-4 border-red-500">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 text-center mb-2" style={{ fontFamily: "Brasika" }}>
                            Request Deletion?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
                            Your account will be scheduled for permanent deletion in 30 days. You can cancel this request by logging in before the grace period ends.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestDeletion}
                                disabled={lifecycleLoading}
                                className="flex-1 px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors flex justify-center items-center shadow-md hover:shadow-lg"
                            >
                                {lifecycleLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Delete Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

function NotificationSettingsContent() {
    const BACKEND_URL = config.BACKEND_URL;

    const [preferences, setPreferences] = useState({
        habits: { inApp: true, email: true },
        moods: { inApp: true, email: false },
        streaks: { inApp: true, email: false },
        journals: { inApp: true, email: false },
        community: { inApp: true, email: false },
        system: { inApp: true, email: true }
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Wrap fetchPreferences in useCallback to stabilize it
    const fetchPreferences = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${BACKEND_URL}/api/notifications/preferences`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setPreferences(data.preferences);
            }
        } catch (error) {
            console.error("❌ Error fetching preferences:", error);
        } finally {
            setLoading(false);
        }
    }, [BACKEND_URL]); // Add BACKEND_URL as dependency since it's from config

    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]); // Now fetchPreferences is stable

    const handleToggle = (category, channel) => {
        setPreferences((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [channel]: !prev[category][channel]
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${BACKEND_URL}/api/notifications/preferences`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(preferences)
            });

            const data = await response.json();
            if (data.success) {
                setMessage({ type: "success", text: "Preferences saved successfully!" });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: "error", text: "Failed to save preferences" });
            }
        } catch (error) {
            console.error("❌ Error saving preferences:", error);
            setMessage({ type: "error", text: "An error occurred" });
        } finally {
            setSaving(false);
        }
    };

    const categories = [
        {
            key: "habits",
            title: "Habit Reminders",
            description: "Get reminded to complete your daily habits"
        },
        {
            key: "moods",
            title: "Mood Check-ins",
            description: "Morning and evening mood logging reminders"
        },
        {
            key: "streaks",
            title: "Streak Updates",
            description: "Achievements, milestones, and streak warnings"
        },
        {
            key: "journals",
            title: "Journal Reminders",
            description: "Daily prompts to write in your journal"
        },
        {
            key: "community",
            title: "Community Activity",
            description: "Likes, comments, and interactions on your posts"
        },
        {
            key: "system",
            title: "System Alerts",
            description: "Important updates and announcements"
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f4873e]"></div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6" style={{ fontFamily: "Brasika" }}>Notification Preferences</h2>

            {message && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${message.type === "success"
                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-200 dark:border-red-800"
                    }`}>
                    {message.type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="space-y-4">
                {categories.map((category) => (
                    <div key={category.key} className="p-6 bg-white dark:bg-gray-700 rounded-2xl shadow-md border-2 border-[#f4873e]/10 dark:border-gray-600">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{category.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                        </div>

                        <div className="flex gap-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences[category.key]?.inApp ?? true}
                                    onChange={() => handleToggle(category.key, "inApp")}
                                    className="w-5 h-5 text-[#f4873e] rounded focus:ring-[#f4873e]"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">In-App</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences[category.key]?.email ?? false}
                                    onChange={() => handleToggle(category.key, "email")}
                                    className="w-5 h-5 text-[#f4873e] rounded focus:ring-[#f4873e]"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="mt-6 flex items-center gap-2 bg-[#89beab] dark:bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-[#FFA669] dark:hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
                <Save size={18} />
                {saving ? "Saving..." : "Save Preferences"}
            </button>

            <div className="mt-6 bg-[#89beab]/10 dark:bg-teal-900/20 border-2 border-[#89beab]/30 dark:border-teal-800 rounded-2xl p-4">
                <h4 className="font-semibold text-[#1F3B36] dark:text-teal-300 mb-2">💡 How it works</h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• <strong>In-App:</strong> Notifications appear in your dashboard bell icon</li>
                    <li>• <strong>Email:</strong> Notifications sent to your registered email address</li>
                    <li>• Toggle each channel independently per notification type</li>
                </ul>
            </div>
        </div>
    );
}

export default SettingsPage;