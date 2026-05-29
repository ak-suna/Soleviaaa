// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import { Calendar, Lock, Unlock, Tag, Trash2, Eye } from 'lucide-react';
// import PinLockModal from '../PinLockModal';
// import axios from 'axios';
// import { getToken } from '../../services/auth';
// import toast from 'react-hot-toast';
// import { getSessionKey, decryptContent } from '../../utils/encryption';

// const CapsuleCard = ({ capsule, index, onDelete, onRefresh }) => {
//     const [showPinModal, setShowPinModal] = useState(false);
//     const [showContent, setShowContent] = useState(false);
//     const [decryptedContent, setDecryptedContent] = useState('');
//     const [loading, setLoading] = useState(false);

//     const isUnlocked = new Date(capsule.unlockDate) <= new Date();
//     const daysUntilUnlock = Math.ceil((new Date(capsule.unlockDate) - new Date()) / (1000 * 60 * 60 * 24));

//     const handleUnlock = async (pin) => {
//         setLoading(true);
//         try {
//             const token = getToken();
//             const response = await axios.post(
//                 `${config.BACKEND_URL}/api/capsules/${capsule._id}/unlock`,
//                 { pin },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );

//             if (response.data.success) {
//                 // Decrypt the content
//                 const encryptionKey = getSessionKey();
//                 if (!encryptionKey) {
//                     toast.error('Session expired. Please log in again.');
//                     return;
//                 }

//                 const decrypted = decryptContent(response.data.content, encryptionKey);
//                 setDecryptedContent(decrypted);
//                 setShowContent(true);
//                 setShowPinModal(false);
//                 toast.success('Capsule unlocked! 🎁');
//             }
//         } catch (error) {
//             console.error('Error unlocking capsule:', error);
//             if (error.response?.status === 401) {
//                 toast.error('Incorrect PIN');
//             } else {
//                 toast.error('Failed to unlock capsule');
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleViewContent = async () => {
//         if (capsule.isLocked && !isUnlocked) {
//             toast.error('This capsule is still locked');
//             return;
//         }

//         if (capsule.isLocked) {
//             setShowPinModal(true);
//         } else {
//             // Decrypt and show content
//             try {
//                 const encryptionKey = getSessionKey();
//                 if (!encryptionKey) {
//                     toast.error('Session expired. Please log in again.');
//                     return;
//                 }

//                 const decrypted = decryptContent(capsule.content, encryptionKey);
//                 setDecryptedContent(decrypted);
//                 setShowContent(true);
//             } catch (error) {
//                 console.error('Decryption error:', error);
//                 toast.error('Failed to decrypt content');
//             }
//         }
//     };

//     const handleForgotPin = async () => {
//         toast((t) => (
//             <div className="max-w-md">
//                 <p className="font-medium mb-2">Reset PIN using your account password</p>
//                 <p className="text-sm text-gray-600 mb-3">
//                     You'll need to enter your account password to unlock this capsule.
//                 </p>
//                 <div className="flex gap-2">
//                     <button
//                         onClick={async () => {
//                             // Implement password verification and unlock
//                             const password = prompt('Enter your account password:');
//                             if (password) {
//                                 try {
//                                     const token = getToken();
//                                     const response = await axios.post(
//                                         `${config.BACKEND_URL}/api/capsules/${capsule._id}/unlock-with-password`,
//                                         { password },
//                                         { headers: { Authorization: `Bearer ${token}` } }
//                                     );

//                                     if (response.data.success) {
//                                         const encryptionKey = getSessionKey();
//                                         const decrypted = decryptContent(response.data.content, encryptionKey);
//                                         setDecryptedContent(decrypted);
//                                         setShowContent(true);
//                                         setShowPinModal(false);
//                                         toast.success('Capsule unlocked! 🎁');
//                                     }
//                                 } catch (error) {
//                                     toast.error('Incorrect password');
//                                 }
//                             }
//                             toast.dismiss(t.id);
//                         }}
//                         className="px-3 py-1 bg-[#89BEAB] text-white rounded text-sm hover:bg-[#F8BA90]"
//                     >
//                         Continue
//                     </button>
//                     <button
//                         onClick={() => toast.dismiss(t.id)}
//                         className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
//                     >
//                         Cancel
//                     </button>
//                 </div>
//             </div>
//         ), { duration: 10000 });
//     };

//     return (
//         <>
//             <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, scale: 0.95 }}
//                 transition={{ delay: index * 0.05 }}
//                 className={`bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all relative overflow-hidden ${!isUnlocked ? 'border-2 border-[#F8BA90]' : 'border-2 border-[#89BEAB]'
//                     }`}
//             >
//                 {/* Status Badge */}
//                 <div className="absolute top-4 right-4">
//                     {isUnlocked ? (
//                         <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
//                             <Unlock className="w-3 h-3" />
//                             Unlocked
//                         </div>
//                     ) : (
//                         <div className="flex items-center gap-1 bg-[#FBE4C9] dark:bg-yellow-900/30 text-[#F8BA90] px-3 py-1 rounded-full text-xs font-semibold">
//                             <Lock className="w-3 h-3" />
//                             {daysUntilUnlock} days
//                         </div>
//                     )}
//                 </div>

//                 {/* Title */}
//                 <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 pr-20">
//                     {capsule.title}
//                 </h3>

//                 {/* Unlock Date */}
//                 <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
//                     <Calendar className="w-4 h-4" />
//                     <span className="text-sm">
//                         Unlocks: {new Date(capsule.unlockDate).toLocaleDateString('en-US', {
//                             month: 'long',
//                             day: 'numeric',
//                             year: 'numeric'
//                         })}
//                     </span>
//                 </div>

//                 {/* Preview or Content */}
//                 {showContent ? (
//                     <div
//                         className="text-gray-700 dark:text-gray-300 mb-4 prose prose-sm max-w-none"
//                         dangerouslySetInnerHTML={{ __html: decryptedContent }}
//                     />
//                 ) : (
//                     !isUnlocked && (
//                         <p className="text-gray-500 dark:text-gray-400 italic text-sm mb-4">
//                             🎁 This memory is waiting to be revealed...
//                         </p>
//                     )
//                 )}

//                 {/* Tags */}
//                 {capsule.tags && capsule.tags.length > 0 && (
//                     <div className="flex items-center gap-2 flex-wrap mb-4">
//                         <Tag className="w-4 h-4 text-gray-400" />
//                         {capsule.tags.map((tag, idx) => (
//                             <span
//                                 key={idx}
//                                 className="px-2 py-1 bg-[#EDE5DA] dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs"
//                             >
//                                 {tag}
//                             </span>
//                         ))}
//                     </div>
//                 )}

//                 {/* Actions */}
//                 <div className="flex gap-2 mt-4">
//                     <motion.button
//                         whileHover={{ scale: 1.05 }}
//                         whileTap={{ scale: 0.95 }}
//                         onClick={handleViewContent}
//                         disabled={!isUnlocked || loading}
//                         className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${isUnlocked
//                                 ? 'bg-[#89BEAB] hover:bg-[#F8BA90] text-white'
//                                 : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
//                             }`}
//                     >
//                         <Eye className="w-4 h-4" />
//                         {showContent ? 'Hide' : 'View'}
//                     </motion.button>

//                     <motion.button
//                         whileHover={{ scale: 1.05 }}
//                         whileTap={{ scale: 0.95 }}
//                         onClick={() => onDelete(capsule._id)}
//                         className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
//                     >
//                         <Trash2 className="w-5 h-5" />
//                     </motion.button>
//                 </div>
//             </motion.div>

//             {/* PIN Modal */}
//             <PinLockModal
//                 isOpen={showPinModal}
//                 onClose={() => setShowPinModal(false)}
//                 onUnlock={handleUnlock}
//                 mode="unlock"
//                 onForgotPin={handleForgotPin}
//             />
//         </>
//     );
// };

// export default CapsuleCard;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Lock, Unlock, Tag, Trash2, Eye, EyeOff } from 'lucide-react'; // Added EyeOff
import PinLockModal from '../PinLockModal';
import axios from 'axios';
import { getToken } from '../../services/auth';
import toast from 'react-hot-toast';
import { getSessionKey, decryptContent } from '../../utils/encryption';
import config from '../../config';

const CapsuleCard = ({ capsule, index, onDelete, onRefresh }) => {
    const [showPinModal, setShowPinModal] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [decryptedContent, setDecryptedContent] = useState('');
    const [loading, setLoading] = useState(false);

    const isUnlocked = new Date(capsule.unlockDate) <= new Date();
    const daysUntilUnlock = Math.ceil((new Date(capsule.unlockDate) - new Date()) / (1000 * 60 * 60 * 24));

    const handleUnlock = async (pin) => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.post(
                `${config.BACKEND_URL}/api/capsules/${capsule._id}/unlock`,
                { pin },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                // Decrypt the content
                const encryptionKey = getSessionKey();
                if (!encryptionKey) {
                    toast.error('Session expired. Please log in again.');
                    return;
                }

                const decrypted = decryptContent(response.data.content, encryptionKey);
                setDecryptedContent(decrypted);
                setShowContent(true);
                setShowPinModal(false);
                toast.success('Capsule unlocked! 🎁');
            }
        } catch (error) {
            console.error('Error unlocking capsule:', error);
            if (error.response?.status === 401) {
                toast.error('Incorrect PIN');
            } else {
                toast.error('Failed to unlock capsule');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle Hide functionality
    const handleHideContent = () => {
        setShowContent(false);
        setDecryptedContent('');
    };

    const handleViewContent = async () => {
        // If content is already shown, hide it
        if (showContent) {
            handleHideContent();
            return;
        }

        if (capsule.isLocked && !isUnlocked) {
            toast.error('This capsule is still locked');
            return;
        }

        if (capsule.isLocked) {
            setShowPinModal(true);
        } else {
            // Decrypt and show content
            try {
                const encryptionKey = getSessionKey();
                if (!encryptionKey) {
                    toast.error('Session expired. Please log in again.');
                    return;
                }

                const decrypted = decryptContent(capsule.content, encryptionKey);
                setDecryptedContent(decrypted);
                setShowContent(true);
            } catch (error) {
                console.error('Decryption error:', error);
                toast.error('Failed to decrypt content');
            }
        }
    };

    const handleForgotPin = async () => {
        toast((t) => (
            <div className="max-w-md">
                <p className="font-medium mb-2">Reset PIN using your account password</p>
                <p className="text-sm text-gray-600 mb-3">
                    You'll need to enter your account password to unlock this capsule.
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            // Implement password verification and unlock
                            const password = prompt('Enter your account password:');
                            if (password) {
                                try {
                                    const token = getToken();
                                    const response = await axios.post(
                                        `${config.BACKEND_URL}/api/capsules/${capsule._id}/unlock-with-password`,
                                        { password },
                                        { headers: { Authorization: `Bearer ${token}` } }
                                    );

                                    if (response.data.success) {
                                        const encryptionKey = getSessionKey();
                                        const decrypted = decryptContent(response.data.content, encryptionKey);
                                        setDecryptedContent(decrypted);
                                        setShowContent(true);
                                        setShowPinModal(false);
                                        toast.success('Capsule unlocked! 🎁');
                                    }
                                } catch (error) {
                                    toast.error('Incorrect password');
                                }
                            }
                            toast.dismiss(t.id);
                        }}
                        className="px-3 py-1 bg-[#89BEAB] text-white rounded text-sm hover:bg-[#F8BA90]"
                    >
                        Continue
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all relative overflow-hidden ${!isUnlocked ? 'border-2 border-[#F8BA90]' : 'border-2 border-[#89BEAB]'
                    }`}
            >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                    {isUnlocked ? (
                        <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                            <Unlock className="w-3 h-3" />
                            Unlocked
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 bg-[#FBE4C9] dark:bg-yellow-900/30 text-[#F8BA90] px-3 py-1 rounded-full text-xs font-semibold">
                            <Lock className="w-3 h-3" />
                            {daysUntilUnlock} days
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 pr-20">
                    {capsule.title}
                </h3>

                {/* Unlock Date */}
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                        Unlocks: {new Date(capsule.unlockDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </span>
                </div>

                {/* Preview or Content */}
                {showContent ? (
                    <div
                        className="text-gray-700 dark:text-gray-300 mb-4 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: decryptedContent }}
                    />
                ) : (
                    !isUnlocked && (
                        <p className="text-gray-500 dark:text-gray-400 italic text-sm mb-4">
                            🎁 This memory is waiting to be revealed...
                        </p>
                    )
                )}

                {/* Tags */}
                {capsule.tags && capsule.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                        <Tag className="w-4 h-4 text-gray-400" />
                        {capsule.tags.map((tag, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-1 bg-[#EDE5DA] dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleViewContent}
                        disabled={!isUnlocked || loading}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${isUnlocked
                            ? 'bg-[#89BEAB] hover:bg-[#F8BA90] text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {showContent ? (
                            <>
                                <EyeOff className="w-4 h-4" />
                                Hide
                            </>
                        ) : (
                            <>
                                <Eye className="w-4 h-4" />
                                View
                            </>
                        )}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDelete(capsule._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </motion.button>
                </div>
            </motion.div>

            {/* PIN Modal */}
            <PinLockModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onUnlock={handleUnlock}
                mode="unlock"
                onForgotPin={handleForgotPin}
            />
        </>
    );
};

export default CapsuleCard;