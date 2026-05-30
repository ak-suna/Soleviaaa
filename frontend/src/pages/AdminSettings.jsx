import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth";
import { getProfile, updateProfile, changePassword, uploadProfilePicture } from "../services/profile";
import {
    ChevronRight, LogOut, X, Check, Camera,
    Moon, Sun, Shield,
    User, Palette, Lock
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import AdminSidebar from "../components/AdminSidebar";
import PasswordStrength, { checkPasswordStrength } from "../components/PasswordStrength";
import FontSizeToggle from "../components/FontSizeToggle";
import Toast from "../components/Toast";

const AdminSettings = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [activeSection, setActiveSection] = useState("account");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState("");
    const [uploadingPic, setUploadingPic] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const fileInputRef = React.useRef(null);

    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        profilePicture: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
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

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" });
            setSaving(false);
            return;
        }
        const checks = checkPasswordStrength(passwordData.newPassword);
        if (checks.some((v) => !v)) {
            setMessage({ type: "error", text: "Password does not meet all requirements." });
            setSaving(false);
            return;
        }
        try {
            await changePassword(passwordData.currentPassword, passwordData.newPassword);
            setMessage({ type: "success", text: "Password changed successfully!" });
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f4873e]" />
            </div>
        );
    }

    const navItems = [
        { key: "account", label: "Account", icon: User },
        { key: "appearance", label: "Appearance", icon: Palette },
        { key: "security", label: "Security", icon: Lock },
    ];

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
                    <button onClick={() => saveField(field)} disabled={saving} className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg">
                        <Check className="w-5 h-5" />
                    </button>
                    <button onClick={cancelEditing} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{value || "Not set"}</span>
                    {editable && (
                        <button onClick={() => startEditing(field)} className="p-1.5 hover:bg-[#f8ba90]/30 dark:hover:bg-gray-600 rounded-lg transition-colors">
                            <ChevronRight className="w-5 h-5 text-[#f4873e] dark:text-orange-400" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    const EyeIcon = ({ show }) => show ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
            <AdminSidebar />

            {toast.show && (
                <div className="fixed top-4 right-4 z-50">
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
                </div>
            )}

            <div className="flex-1 lg:ml-28">
                {/* Back button */}
                {/* <button
                    onClick={() => navigate("/admin/dashboard")}
                    className="flex items-center mb-6 text-gray-700 dark:text-gray-300 hover:text-[#f4873e] dark:hover:text-orange-400 transition font-medium"
                >
                    <ChevronLeft className="mr-2 w-5 h-5" />
                    Back to Dashboard
                </button> */}

                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    {/* Left Sidebar */}
                    <div className="w-full lg:w-72 bg-[#f8ba90] dark:bg-gray-800 rounded-[40px] p-4 lg:p-6 shadow-lg h-fit border-2 border-[#f4873e]/20 dark:border-gray-700 flex-shrink-0">
                        {/* Admin badge */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-[#f4873e] flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[#f4873e] dark:text-orange-400">Admin</span>
                        </div>
                        <h2 className="text-2xl font-bold text-[#1F3B36] dark:text-white mb-6" style={{ fontFamily: "Brasika" }}>Settings</h2>

                        <div className="space-y-2">
                            {navItems.map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveSection(key)}
                                    className={`w-full text-left px-4 py-3 rounded-2xl font-medium transition-all flex items-center gap-3 ${activeSection === key
                                            ? "bg-white dark:bg-gray-700 text-[#f4873e] dark:text-orange-400 shadow-md border-l-4 border-[#f4873e]"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}

                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 rounded-2xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all flex items-center gap-3 mt-8"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 bg-[#f4f2f0] dark:bg-gray-800 rounded-[40px] p-8 shadow-lg border-2 border-gray-200 dark:border-gray-700">
                        {/* Message */}
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${message.type === "success"
                                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-200 dark:border-green-800"
                                    : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-200 dark:border-red-800"
                                }`}>
                                {message.type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        {/* ── ACCOUNT ── */}
                        {activeSection === "account" && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6" style={{ fontFamily: "Brasika" }}>Account Settings</h2>

                                {/* Avatar */}
                                <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-[#f4873e]/20 dark:border-gray-600">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f8ba90] to-[#f4873e] flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
                                            {profile.profilePicture ? (
                                                <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{profile.firstName?.charAt(0) || "A"}{profile.lastName?.charAt(0) || ""}</span>
                                            )}
                                        </div>
                                        {/* Admin ring */}
                                        <div className="absolute -inset-1 rounded-full border-2 border-[#f4873e]/40 pointer-events-none" />
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
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{profile.firstName} {profile.lastName}</p>
                                            <span className="text-xs bg-[#f4873e]/20 dark:bg-orange-900/40 text-[#f4873e] dark:text-orange-400 px-2 py-0.5 rounded-full font-bold">Admin</span>
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingPic}
                                            className="text-sm text-[#f4873e] dark:text-orange-400 hover:text-[#ff9e5e] font-medium disabled:opacity-60"
                                        >
                                            {uploadingPic ? "Uploading..." : "Upload new picture"}
                                        </button>
                                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or GIF · Max 5MB</p>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Basic Info</h3>
                                <div className="space-y-2">
                                    <InfoField label="First Name" value={profile.firstName} field="firstName" />
                                    <InfoField label="Last Name" value={profile.lastName} field="lastName" />
                                    <InfoField label="Email" value={profile.email} field="email" editable={false} />
                                    <InfoField label="Phone" value={profile.phone} field="phone" />
                                    <InfoField label="Address" value={profile.address} field="address" />
                                </div>
                            </div>
                        )}

                        {/* ── APPEARANCE ── */}
                        {activeSection === "appearance" && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6" style={{ fontFamily: "Brasika" }}>Appearance</h2>
                                <div className="space-y-6">
                                    {/* Theme toggle */}
                                    <div className="flex items-center justify-between p-4 lg:p-6 bg-white dark:bg-gray-700 rounded-2xl shadow-md border-2 border-[#f4873e]/10 dark:border-gray-600">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Theme</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark mode</p>
                                        </div>
                                        <button
                                            onClick={toggleTheme}
                                            className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300 dark:bg-[#f4873e] transition-colors"
                                        >
                                            <span className={`h-6 w-6 transform rounded-full bg-white transition-transform flex items-center justify-center ${theme === "dark" ? "translate-x-7" : "translate-x-1"}`}>
                                                {theme === "dark" ? <Moon className="w-4 h-4 text-[#f4873e]" /> : <Sun className="w-4 h-4 text-gray-600" />}
                                            </span>
                                        </button>
                                    </div>
                                    {/* Font size */}
                                    <div className="flex items-center justify-between p-4 lg:p-6 bg-white dark:bg-gray-700 rounded-2xl shadow-md border-2 border-[#f4873e]/10 dark:border-gray-600">
                                        <FontSizeToggle />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── SECURITY ── */}
                        {activeSection === "security" && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6" style={{ fontFamily: "Brasika" }}>Security</h2>

                                {/* Admin security notice */}
                                <div className="mb-6 flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-[#f4873e]/30 dark:border-orange-800 rounded-2xl">
                                    <Shield className="w-5 h-5 text-[#f4873e] dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-[#f4873e] dark:text-orange-400 mb-1">Admin Account Security</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">As an admin, use a strong unique password. You have elevated access — keep it secure.</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-md border-2 border-[#f4873e]/10 dark:border-gray-600 px-8 py-10">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">Change Password</h3>
                                    <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md mx-auto w-full">
                                        {/* Current Password */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    required
                                                    className="w-full pl-4 pr-12 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4873e]"
                                                />
                                                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f4873e] transition-colors">
                                                    <EyeIcon show={showCurrentPassword} />
                                                </button>
                                            </div>
                                        </div>
                                        {/* New Password */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password (min 8 characters)</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    required
                                                    minLength={8}
                                                    className="w-full pl-4 pr-12 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4873e]"
                                                />
                                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f4873e] transition-colors">
                                                    <EyeIcon show={showNewPassword} />
                                                </button>
                                            </div>
                                            <PasswordStrength password={passwordData.newPassword} />
                                        </div>
                                        {/* Confirm Password */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    required
                                                    minLength={6}
                                                    className="w-full pl-4 pr-12 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4873e]"
                                                />
                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f4873e] transition-colors">
                                                    <EyeIcon show={showConfirmPassword} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="w-full flex justify-center pt-2">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="w-full sm:w-auto px-10 py-2.5 bg-[#89beab] dark:bg-teal-600 text-white rounded-xl font-medium hover:bg-[#FFA669] dark:hover:bg-teal-700 transition-all disabled:opacity-50 shadow-md"
                                            >
                                                {saving ? "Updating..." : "Change Password"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;