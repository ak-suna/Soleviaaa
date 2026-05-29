// import React, { useState } from "react";
// import { login, isVerified } from "../services/auth";
// import { useNavigate, Link } from "react-router-dom";
// import { loginSchema } from "../utils/validationSchemas";
// import { initializeEncryption } from '../utils/encryption';

// const LoginForm = () => {
//     const navigate = useNavigate();
//     const [formData, setFormData] = useState({
//         email: "",
//         password: "",
//     });
//     const [error, setError] = useState("");
//     const [warning, setWarning] = useState("");
//     const [fieldErrors, setFieldErrors] = useState({});
//     const [loading, setLoading] = useState(false);
//     const [success, setSuccess] = useState(false);

//     const handleChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//         // Clear field error when user starts typing
//         if (fieldErrors[e.target.name]) {
//             setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError("");
//         setWarning("");
//         setFieldErrors({});

//         // Zod validation
//         try {
//             loginSchema.parse(formData);
//         } catch (err) {
//             if (err.issues) {
//                 const errors = {};
//                 err.issues.forEach((issue) => {
//                     errors[issue.path[0]] = issue.message;
//                 });
//                 setFieldErrors(errors);
//                 return;
//             }
//         }

//         setLoading(true);

//         try {
//             const response = await login(formData);
//             console.log("Login successful:", response);

//             initializeEncryption(formData.password);

//             if (!isVerified()) {
//                 setWarning("⚠️ Please verify your email. Check your inbox for the verification link.");
//             }

//             setSuccess(true);

//             setTimeout(() => {
//                 navigate("/dashboard");
//             }, 2000);
//         } catch (err) {
//             setError(err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (success) {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
//                 <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 animate-fade-in">
//                     <h2 className="text-3xl font-bold text-green-600 mb-4">✅ Login Successful!</h2>
//                     {warning && (
//                         <p className="text-orange-600 bg-orange-50 py-2 px-4 rounded-lg mb-4">
//                             {warning}
//                         </p>
//                     )}
//                     <p className="text-gray-600">
//                         Redirecting to dashboard...
//                     </p>
//                     <div className="mt-6">
//                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-[#f1bdcd] via-[#f5d9c9] to-[#A7D5C4]">
//             <div className="flex min-h-screen">
//                 {/* Left Side - Form */}
//                 <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
//                     <div className="max-w-md w-full animate-fade-in-left">
//                         <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95">
//                             <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Welcome Back!</h2>
//                             <p className="text-gray-600 text-center mb-6">Login to access your account</p>

//                             <form onSubmit={handleSubmit} className="space-y-6">
//                                 <div>
//                                     <input
//                                         type="email"
//                                         name="email"
//                                         placeholder="Email"
//                                         value={formData.email}
//                                         onChange={handleChange}
//                                         required
//                                         className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${fieldErrors.email ? "border-red-500" : "border-gray-300"
//                                             }`}
//                                     />
//                                     {fieldErrors.email && (
//                                         <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
//                                     )}
//                                 </div>

//                                 <div className="space-y-2">
//                                     <div>
//                                         <input
//                                             type="password"
//                                             name="password"
//                                             placeholder="Password"
//                                             value={formData.password}
//                                             onChange={handleChange}
//                                             required
//                                             className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${fieldErrors.password ? "border-red-500" : "border-gray-300"
//                                                 }`}
//                                         />
//                                         {fieldErrors.password && (
//                                             <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
//                                         )}
//                                     </div>
//                                     {/* 🆕 NEW: Forgot Password Link */}
//                                     <div className="text-right">
//                                         <Link
//                                             to="/forgot-password"
//                                             className="text-sm text-[#759a68] hover:text-[#6ca859] font-semibold transition-colors duration-300 hover:underline"
//                                         >
//                                             Forgot Password?
//                                         </Link>
//                                     </div>
//                                 </div>

//                                 {error && (
//                                     <div className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg animate-shake whitespace-pre-line">
//                                         {error}
//                                     </div>
//                                 )}

//                                 {warning && (
//                                     <p className="text-orange-600 text-sm text-center bg-orange-50 py-2 px-4 rounded-lg animate-shake">
//                                         {warning}
//                                     </p>
//                                 )}

//                                 <button
//                                     type="submit"
//                                     disabled={loading}
//                                     className="w-full px-10 py-4 text-xl bg-[#f096b3] text-white rounded-full font-semibold hover:bg-[#f8ba90] transition-all duration-300 hover:scale-105 shadow-xl"
//                                 >
//                                     {loading ? (
//                                         <span className="flex items-center justify-center">
//                                             <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
//                                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
//                                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                                             </svg>
//                                             Logging in...
//                                         </span>
//                                     ) : (
//                                         "Login"
//                                     )}
//                                 </button>
//                             </form>

//                             <p className="text-center text-gray-600 mt-6">
//                                 Don't have an account?{" "}
//                                 <Link to="/signup" className="text-[#759a68] hover:text-[#6ca859] font-semibold transition-colors duration-300 hover:underline">
//                                     Sign Up
//                                 </Link>
//                             </p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Right Side - Image */}
//                 <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
//                     <img
//                         src='okay.png'
//                         alt="Login"
//                         className="w-full h-full object-cover animate-fade-in"
//                     />
//                 </div>
//             </div>

//             <style jsx>{`
//                 @keyframes fade-in {
//                     from { opacity: 0; }
//                     to { opacity: 1; }
//                 }

//                 @keyframes fade-in-left {
//                     from {
//                         opacity: 0;
//                         transform: translateX(-20px);
//                     }
//                     to {
//                         opacity: 1;
//                         transform: translateX(0);
//                     }
//                 }

//                 @keyframes slide-down {
//                     from {
//                         opacity: 0;
//                         transform: translateY(-20px);
//                     }
//                     to {
//                         opacity: 1;
//                         transform: translateY(0);
//                     }
//                 }

//                 @keyframes slide-up {
//                     from {
//                         opacity: 0;
//                         transform: translateY(20px);
//                     }
//                     to {
//                         opacity: 1;
//                         transform: translateY(0);
//                     }
//                 }

//                 @keyframes bounce-slow {
//                     0%, 100% { transform: translateY(0); }
//                     50% { transform: translateY(-20px); }
//                 }

//                 @keyframes shake {
//                     0%, 100% { transform: translateX(0); }
//                     25% { transform: translateX(-10px); }
//                     75% { transform: translateX(10px); }
//                 }

//                 .animate-fade-in {
//                     animation: fade-in 0.6s ease-out;
//                 }

//                 .animate-fade-in-left {
//                     animation: fade-in-left 0.8s ease-out;
//                 }

//                 .animate-slide-down {
//                     animation: slide-down 0.8s ease-out;
//                 }

//                 .animate-slide-up {
//                     animation: slide-up 0.8s ease-out 0.2s backwards;
//                 }

//                 .animate-bounce-slow {
//                     animation: bounce-slow 3s ease-in-out infinite;
//                 }

//                 .animate-shake {
//                     animation: shake 0.5s ease-in-out;
//                 }
//             `}</style>
//         </div>
//     );
// };

// export default LoginForm;
import React, { useState } from "react";
import { login, isVerified, reactivateAccount, cancelAccountDeletion, resendVerification } from "../services/auth";
import { useNavigate, Link } from "react-router-dom";
import { loginSchema } from "../utils/validationSchemas";
import { initializeEncryption } from '../utils/encryption';
import Toast from "../components/Toast";

const LoginForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [warning, setWarning] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Lifecycle hold state
    const [holdState, setHoldState] = useState({ type: null, expiresAt: null });

    // 🆕 NEW: Password visibility state tracking
    const [showPassword, setShowPassword] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    const handleResendVerification = async () => {
        if (!formData.email) {
            setError("Enter your email above, then click resend verification.");
            return;
        }
        setResendLoading(true);
        setError("");
        try {
            const result = await resendVerification(formData.email);
            setToast({ show: true, message: result.message, type: "success" });
        } catch (err) {
            setToast({ show: true, message: err.message, type: "error" });
        } finally {
            setResendLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear field error when user starts typing
        if (fieldErrors[e.target.name]) {
            setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setWarning("");
        setFieldErrors({});

        // Zod validation
        try {
            loginSchema.parse(formData);
        } catch (err) {
            if (err.issues) {
                const errors = {};
                err.issues.forEach((issue) => {
                    errors[issue.path[0]] = issue.message;
                });
                setFieldErrors(errors);
                return;
            }
        }

        setLoading(true);

        try {
            const response = await login(formData);
            console.log("Login successful:", response);

            initializeEncryption(formData.password);

            if (!isVerified()) {
                setWarning("⚠️ Please verify your email. Check your inbox for the verification link.");
            }

            setSuccess(true);

            setTimeout(() => {
                navigate("/dashboard");
            }, 2000);
        } catch (err) {
            if (err.status === "deactivated_hold") {
                setHoldState({ type: "deactivated", expiresAt: null });
            } else if (err.status === "deletion_hold") {
                setHoldState({ type: "pending_deletion", expiresAt: err.expiresAt });
            } else {
                setError(err.message);
                setToast({ show: true, message: err.message, type: "error" });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReactivate = async () => {
        setLoading(true);
        setError("");
        try {
            await reactivateAccount({ email: formData.email, password: formData.password });
            setToast({ show: true, message: "Account reactivated successfully! Please log in.", type: "success" });
            setHoldState({ type: null, expiresAt: null });
        } catch (err) {
            setError(err.message);
            setToast({ show: true, message: err.message, type: "error" });
            setHoldState({ type: null, expiresAt: null });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDeletion = async () => {
        setLoading(true);
        setError("");
        try {
            await cancelAccountDeletion({ email: formData.email, password: formData.password });
            setToast({ show: true, message: "Deletion request cancelled! Please log in.", type: "success" });
            setHoldState({ type: null, expiresAt: null });
        } catch (err) {
            setError(err.message);
            setToast({ show: true, message: err.message, type: "error" });
            setHoldState({ type: null, expiresAt: null });
        } finally {
            setLoading(false);
        }
    };

    if (holdState.type === "deactivated") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300">
                {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
                <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 animate-fade-in">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Account Deactivated</h2>
                    <p className="text-gray-600 mb-6 text-lg">
                        Your account is currently deactivated. Would you like to restore your profile and pick up right where you left off?
                    </p>
                    <div className="flex flex-col space-y-4">
                        <button
                            onClick={handleReactivate}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-[#759a68] text-white rounded-lg font-semibold hover:bg-[#6ca859] transition-colors"
                        >
                            {loading ? "Restoring..." : "Restore Account"}
                        </button>
                        <button
                            onClick={() => setHoldState({ type: null, expiresAt: null })}
                            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (holdState.type === "pending_deletion") {
        const formattedDate = holdState.expiresAt 
            ? new Date(holdState.expiresAt).toLocaleDateString() 
            : 'soon';
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
                {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
                <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 animate-fade-in border-t-4 border-red-500">
                    <h2 className="text-3xl font-bold text-red-600 mb-4">Deletion Scheduled</h2>
                    <p className="text-gray-700 mb-4 font-semibold text-lg">
                        Your account is scheduled to be permanently deleted on {formattedDate}.
                    </p>
                    <p className="text-gray-600 mb-8">
                        Logging in will cancel this request and restore your account fully.
                    </p>
                    <div className="flex flex-col space-y-4">
                        <button
                            onClick={handleCancelDeletion}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl"
                        >
                            {loading ? "Cancelling..." : "Cancel Deletion & Enter"}
                        </button>
                        <button
                            onClick={() => setHoldState({ type: null, expiresAt: null })}
                            className="w-full px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        >
                            Keep Deletion (Go Back)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 animate-fade-in">
                    <h2 className="text-3xl font-bold text-green-600 mb-4">✅ Login Successful!</h2>
                    {warning && (
                        <p className="text-orange-600 bg-orange-50 py-2 px-4 rounded-lg mb-4">
                            {warning}
                        </p>
                    )}
                    <p className="text-gray-600">
                        Redirecting to dashboard...
                    </p>
                    <div className="mt-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f1bdcd] via-[#f5d9c9] to-[#A7D5C4]">
            {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
            <div className="flex min-h-screen">
                {/* Left Side - Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                    <div className="max-w-md w-full animate-fade-in-left">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Welcome Back!</h2>
                            <p className="text-gray-600 text-center mb-6">Login to access your account</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${fieldErrors.email ? "border-red-500" : "border-gray-300"
                                            }`}
                                    />
                                    {fieldErrors.email && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {/* 🆕 CHANGED: Wrapped in a relative container to position the icon button anchor context safely */}
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            className={`w-full pl-4 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${fieldErrors.password ? "border-red-500" : "border-gray-300"
                                                }`}
                                        />
                                        {/* 🆕 NEW: Absolute positioned button element containing the toggle action */}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition-colors duration-200"
                                        >
                                            {showPassword ? (
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

                                    {fieldErrors.password && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                                    )}

                                    {/* Forgot Password Link */}
                                    <div className="text-right">
                                        <Link
                                            to="/forgot-password"
                                            className="text-sm text-[#759a68] hover:text-[#6ca859] font-semibold transition-colors duration-300 hover:underline"
                                        >
                                            Forgot Password?
                                        </Link>
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg animate-shake whitespace-pre-line">
                                        {error}
                                    </div>
                                )}

                                {warning && (
                                    <p className="text-orange-600 text-sm text-center bg-orange-50 py-2 px-4 rounded-lg animate-shake">
                                        {warning}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-10 py-4 text-xl bg-[#f096b3] text-white rounded-full font-semibold hover:bg-[#f8ba90] transition-all duration-300 hover:scale-105 shadow-xl"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Logging in...
                                        </span>
                                    ) : (
                                        "Login"
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-gray-600 mt-4 text-sm">
                                Didn't get a verification email?{" "}
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    disabled={resendLoading}
                                    className="text-[#759a68] hover:text-[#6ca859] font-semibold transition-colors duration-300 hover:underline disabled:opacity-50"
                                >
                                    {resendLoading ? "Sending..." : "Resend verification email"}
                                </button>
                            </p>

                            <p className="text-center text-gray-600 mt-6">
                                Don't have an account?{" "}
                                <Link to="/signup" className="text-[#759a68] hover:text-[#6ca859] font-semibold transition-colors duration-300 hover:underline">
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Image */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                    <img
                        src='okay.png'
                        alt="Login"
                        className="w-full h-full object-cover animate-fade-in"
                    />
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes fade-in-left {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }

                .animate-fade-in-left {
                    animation: fade-in-left 0.8s ease-out;
                }

                .animate-slide-down {
                    animation: slide-down 0.8s ease-out;
                }

                .animate-slide-up {
                    animation: slide-up 0.8s ease-out 0.2s backwards;
                }

                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default LoginForm;