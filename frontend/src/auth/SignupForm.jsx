// import React, { useState } from "react";
// import { signup } from "../services/auth";
// import { useNavigate, Link } from "react-router-dom";
// import { signupSchema } from "../utils/validationSchemas";

// const SignupForm = () => {
//     const navigate = useNavigate();
//     const [formData, setFormData] = useState({
//         firstName: "",
//         lastName: "",
//         email: "",
//         password: "",
//         confirmPassword: "",
//         phone: "",
//         address: "",
//     });
//     const [error, setError] = useState("");
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
//         setFieldErrors({});

//         // Zod validation
//         try {
//             signupSchema.parse(formData);
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
//             const payload = {
//                 firstName: formData.firstName,
//                 lastName: formData.lastName,
//                 email: formData.email,
//                 password: formData.password,
//                 phone: formData.phone,
//                 address: formData.address
//             };
//             console.log("Submitting payload:", payload);
//             await signup(payload);
//             setSuccess(true);
//             // Show success message with email verification notice
//             setTimeout(() => {
//                 navigate("/login");
//             }, 3000);
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
//                     <h2 className="text-3xl font-bold text-green-600 mb-4">✅ Signup Successful!</h2>
//                     <p className="text-lg text-gray-700 mb-2">
//                         📧 Please check your email to verify your account.
//                     </p>
//                     <p className="text-gray-600">
//                         Redirecting to login...
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
//                 {/* Left Side - Image */}
//                 <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden rounded-l-[40px]">
//                     <img 
//                         src='okayy.png'
//                         alt="Signup" 
//                         className="w-full h-full object-cover animate-fade-in"
//                     />
//                 </div>

//                 {/* Right Side - Form */}
//                 <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
//                     <div className="max-w-md w-full animate-fade-in-right">
//                         <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95">
//                             <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Let's Get Started!</h2>
//                             <p className="text-gray-600 text-center mb-6">Create your account to continue</p>

//                             <form onSubmit={handleSubmit} className="space-y-4">
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <div>
//                                         <input
//                                             type="text"
//                                             name="firstName"
//                                             placeholder="First Name"
//                                             value={formData.firstName}
//                                             onChange={handleChange}
//                                             required
//                                             className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${
//                                                 fieldErrors.firstName ? "border-red-500" : "border-gray-300"
//                                             }`}
//                                         />
//                                         {fieldErrors.firstName && (
//                                             <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
//                                         )}
//                                     </div>

//                                     <div>
//                                         <input
//                                             type="text"
//                                             name="lastName"
//                                             placeholder="Last Name"
//                                             value={formData.lastName}
//                                             onChange={handleChange}
//                                             required
//                                             className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${
//                                                 fieldErrors.lastName ? "border-red-500" : "border-gray-300"
//                                             }`}
//                                         />
//                                         {fieldErrors.lastName && (
//                                             <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
//                                         )}
//                                     </div>
//                                 </div>

//                                 <div>
//                                     <input
//                                         type="email"
//                                         name="email"
//                                         placeholder="Email"
//                                         value={formData.email}
//                                         onChange={handleChange}
//                                         required
//                                         className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${
//                                             fieldErrors.email ? "border-red-500" : "border-gray-300"
//                                         }`}
//                                     />
//                                     {fieldErrors.email && (
//                                         <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
//                                     )}
//                                 </div>

//                                 {/* 🆕 UPDATED PASSWORD SECTION WITH REQUIREMENTS */}
//                                 <div>
//                                     <input
//                                         type="password"
//                                         name="password"
//                                         placeholder="Password"
//                                         value={formData.password}
//                                         onChange={handleChange}
//                                         required
//                                         className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${
//                                             fieldErrors.password ? "border-red-500" : "border-gray-300"
//                                         }`}
//                                     />
//                                     {fieldErrors.password && (
//                                         <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
//                                     )}

//                                     {/* Password Requirements Box */}
//                                     <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
//                                         <p className="text-xs font-semibold text-gray-700 mb-2">PASSWORD MUST CONTAIN:</p>
//                                         <div className="space-y-1">
//                                             <div className="flex items-center text-xs">
//                                                 <span className={`mr-2 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
//                                                     {/[a-z]/.test(formData.password) ? '✓' : '✗'}
//                                                 </span>
//                                                 <span className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
//                                                     At least one lowercase letter
//                                                 </span>
//                                             </div>
//                                             <div className="flex items-center text-xs">
//                                                 <span className={`mr-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
//                                                     {/[A-Z]/.test(formData.password) ? '✓' : '✗'}
//                                                 </span>
//                                                 <span className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
//                                                     At least one uppercase letter
//                                                 </span>
//                                             </div>
//                                             <div className="flex items-center text-xs">
//                                                 <span className={`mr-2 ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
//                                                     {/[0-9]/.test(formData.password) ? '✓' : '✗'}
//                                                 </span>
//                                                 <span className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
//                                                     At least one number
//                                                 </span>
//                                             </div>
//                                             <div className="flex items-center text-xs">
//                                                 <span className={`mr-2 ${formData.password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
//                                                     {formData.password.length >= 8 ? '✓' : '✗'}
//                                                 </span>
//                                                 <span className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-600'}>
//                                                     Minimum 8 characters
//                                                 </span>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <div>
//                                     <input
//                                         type="password"
//                                         name="confirmPassword"
//                                         placeholder="Confirm Password"
//                                         value={formData.confirmPassword}
//                                         onChange={handleChange}
//                                         required
//                                         className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${
//                                             fieldErrors.confirmPassword ? "border-red-500" : "border-gray-300"
//                                         }`}
//                                     />
//                                     {fieldErrors.confirmPassword && (
//                                         <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
//                                     )}
//                                 </div>

//                                 <div>
//                                     <input
//                                         type="text"
//                                         name="phone"
//                                         placeholder="Phone"
//                                         value={formData.phone}
//                                         onChange={handleChange}
//                                         required
//                                         className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${
//                                             fieldErrors.phone ? "border-red-500" : "border-gray-300"
//                                         }`}
//                                     />
//                                     {fieldErrors.phone && (
//                                         <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
//                                     )}
//                                 </div>

//                                 <div>
//                                     <input
//                                         type="text"
//                                         name="address"
//                                         placeholder="Address"
//                                         value={formData.address}
//                                         onChange={handleChange}
//                                         required
//                                         className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${
//                                             fieldErrors.address ? "border-red-500" : "border-gray-300"
//                                         }`}
//                                     />
//                                     {fieldErrors.address && (
//                                         <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>
//                                     )}
//                                 </div>

//                                 {error && (
//                                     <p className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg animate-shake">
//                                         {error}
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
//                                             Signing up...
//                                         </span>
//                                     ) : (
//                                         "Sign Up"
//                                     )}
//                                 </button>
//                             </form>

//                             <p className="text-center text-gray-600 mt-6">
//                                 Already have an account?{" "}
//                                 <Link to="/login" className="text-[#759a68] hover:text-[#6ca859] font-semibold transition-colors duration-300 hover:underline">
//                                     Login
//                                 </Link>
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <style jsx>{`
//                 @keyframes fade-in {
//                     from {
//                         opacity: 0;
//                     }
//                     to {
//                         opacity: 1;
//                     }
//                 }

//                 @keyframes fade-in-right {
//                     from {
//                         opacity: 0;
//                         transform: translateX(20px);
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
//                     0%, 100% {
//                         transform: translateY(0);
//                     }
//                     50% {
//                         transform: translateY(-20px);
//                     }
//                 }

//                 @keyframes shake {
//                     0%, 100% {
//                         transform: translateX(0);
//                     }
//                     25% {
//                         transform: translateX(-10px);
//                     }
//                     75% {
//                         transform: translateX(10px);
//                     }
//                 }

//                 .animate-fade-in {
//                     animation: fade-in 0.6s ease-out;
//                 }

//                 .animate-fade-in-right {
//                     animation: fade-in-right 0.8s ease-out;
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

// export default SignupForm;
import React, { useState } from "react";
import { signup } from "../services/auth";
import { useNavigate, Link } from "react-router-dom";
import { signupSchema } from "../utils/validationSchemas";
import TermsAndConditions from "../components/TermsAndConditions";

const SignupForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        address: "",
    });
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [emailWarning, setEmailWarning] = useState("");

    // Visibility toggle states
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Terms and Conditions states
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (fieldErrors[e.target.name]) {
            setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setFieldErrors({});

        if (!termsAccepted) {
            setError("You must accept the terms and conditions to register.");
            return;
        }

        try {
            signupSchema.parse(formData);
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
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                address: formData.address
            };
            console.log("Submitting payload:", payload);
            const data = await signup(payload);
            if (data.emailSent === false) {
                setEmailWarning("We could not send the verification email. Go to login and use “Resend verification email”.");
            }
            setSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 animate-fade-in">
                    <h2 className="text-3xl font-bold text-green-600 mb-4">✅ Signup Successful!</h2>
                    <p className="text-lg text-gray-700 mb-2">
                        📧 Please check your email to verify your account.
                    </p>
                    {emailWarning && (
                        <p className="text-orange-600 bg-orange-50 py-2 px-4 rounded-lg mb-2 text-sm">
                            {emailWarning}
                        </p>
                    )}
                    <p className="text-gray-600">
                        Redirecting to login...
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
            <div className="flex min-h-screen">
                {/* Left Side - Image */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden rounded-l-[40px]">
                    <img
                        src='okayy.png'
                        alt="Signup"
                        className="w-full h-full object-cover animate-fade-in"
                    />
                </div>

                {/* Right Side - Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                    <div className="max-w-md w-full animate-fade-in-right">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Let's Get Started!</h2>
                            <p className="text-gray-600 text-center mb-6">Create your account to continue</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <input
                                            type="text"
                                            name="firstName"
                                            placeholder="First Name"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${fieldErrors.firstName ? "border-red-500" : "border-gray-300"
                                                }`}
                                        />
                                        {fieldErrors.firstName && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <input
                                            type="text"
                                            name="lastName"
                                            placeholder="Last Name"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${fieldErrors.lastName ? "border-red-500" : "border-gray-300"
                                                }`}
                                        />
                                        {fieldErrors.lastName && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
                                        )}
                                    </div>
                                </div>

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

                                {/* PASSWORD SECTION WITH TOGGLE */}
                                <div>
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
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none"
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {fieldErrors.password && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                                    )}

                                    {/* Password Requirements Box */}
                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-xs font-semibold text-gray-700 mb-2">PASSWORD MUST CONTAIN:</p>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-xs">
                                                <span className={`mr-2 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                                                    {/[a-z]/.test(formData.password) ? '✓' : '✗'}
                                                </span>
                                                <span className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                                                    At least one lowercase letter
                                                </span>
                                            </div>
                                            <div className="flex items-center text-xs">
                                                <span className={`mr-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                                                    {/[A-Z]/.test(formData.password) ? '✓' : '✗'}
                                                </span>
                                                <span className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                                                    At least one uppercase letter
                                                </span>
                                            </div>
                                            <div className="flex items-center text-xs">
                                                <span className={`mr-2 ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                                                    {/[0-9]/.test(formData.password) ? '✓' : '✗'}
                                                </span>
                                                <span className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                                                    At least one number
                                                </span>
                                            </div>
                                            <div className="flex items-center text-xs">
                                                <span className={`mr-2 ${formData.password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {formData.password.length >= 8 ? '✓' : '✗'}
                                                </span>
                                                <span className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-600'}>
                                                    Minimum 8 characters
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CONFIRM PASSWORD SECTION WITH TOGGLE */}
                                <div>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            placeholder="Confirm Password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            className={`w-full pl-4 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${fieldErrors.confirmPassword ? "border-red-500" : "border-gray-300"
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none"
                                        >
                                            {showConfirmPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {fieldErrors.confirmPassword && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                                    )}
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        name="phone"
                                        placeholder="Phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${fieldErrors.phone ? "border-red-500" : "border-gray-300"
                                            }`}
                                    />
                                    {fieldErrors.phone && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
                                    )}
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        name="address"
                                        placeholder="Address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 ${fieldErrors.address ? "border-red-500" : "border-gray-300"
                                            }`}
                                    />
                                    {fieldErrors.address && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>
                                    )}
                                </div>

                                {error && (
                                    <p className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg animate-shake">
                                        {error}
                                    </p>
                                )}

                                {/* Terms and Conditions Checkbox */}
                                <div className="flex items-center mt-4 mb-4">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer transition-all duration-200"
                                    />
                                    <label htmlFor="terms" className="ml-3 text-sm font-medium text-gray-700">
                                        I accept the{" "}
                                        <button 
                                            type="button" 
                                            onClick={() => setShowTerms(true)}
                                            className="text-indigo-600 hover:text-indigo-800 underline focus:outline-none transition-colors"
                                        >
                                            Terms and Conditions
                                        </button>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !termsAccepted}
                                    className={`w-full px-10 py-4 text-xl text-white rounded-full font-semibold transition-all duration-300 shadow-xl ${
                                        (loading || !termsAccepted)
                                            ? "bg-gray-400 cursor-not-allowed opacity-70"
                                            : "bg-[#f096b3] hover:bg-[#f8ba90] hover:scale-105"
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Signing up...
                                        </span>
                                    ) : (
                                        "Sign Up"
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-gray-600 mt-6">
                                Already have an account?{" "}
                                <Link to="/login" className="text-[#759a68] hover:text-[#6ca859] font-semibold transition-colors duration-300 hover:underline">
                                    Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {showTerms && <TermsAndConditions onClose={() => setShowTerms(false)} />}

            <style jsx>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-in-right { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes slide-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
                .animate-fade-in { animation: fade-in 0.6s ease-out; }
                .animate-fade-in-right { animation: fade-in-right 0.8s ease-out; }
                .animate-slide-down { animation: slide-down 0.8s ease-out; }
                .animate-slide-up { animation: slide-up 0.8s ease-out 0.2s backwards; }
                .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
                .animate-shake { animation: shake 0.5s ease-in-out; }
            `}</style>
        </div>
    );
};

export default SignupForm;