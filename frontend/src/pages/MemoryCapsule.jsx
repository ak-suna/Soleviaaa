// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Gift, Plus, Calendar, Lock, Unlock, Search, Tag } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import toast, { Toaster } from 'react-hot-toast';
// import Sidebar from '../components/Sidebar';
// import CapsuleCard from '../components/MemoryCapsule/CapsuleCard';
// import CapsuleForm from '../components/MemoryCapsule/CapsuleForm';
// import axios from 'axios';
// import { getToken } from '../services/auth';

// const MemoryCapsule = () => {
//     const navigate = useNavigate();
//     const [capsules, setCapsules] = useState([]);
//     const [isCreating, setIsCreating] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [filterTag, setFilterTag] = useState('all');
//     const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'locked', 'unlocked'

//     const API_URL = 'http://localhost:5000/api/capsules';

//     const loadCapsules = useCallback(async () => {
//         setLoading(true);
//         try {
//             const token = getToken();
//             const response = await axios.get(API_URL, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             setCapsules(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
//         } catch (error) {
//             console.error('Error loading capsules:', error);
//             if (error.response?.status === 401) {
//                 navigate('/login');
//             } else {
//                 toast.error('Failed to load capsules');
//             }
//         } finally {
//             setLoading(false);
//         }
//     }, [navigate]);

//     useEffect(() => {
//         loadCapsules();
//     }, [loadCapsules]);

//     const handleCreateCapsule = async (capsuleData) => {
//         setLoading(true);
//         try {
//             const token = getToken();
//             await axios.post(API_URL, capsuleData, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });

//             toast.success('Memory capsule created! 🎁');
//             setIsCreating(false);
//             await loadCapsules();
//         } catch (error) {
//             console.error('Error creating capsule:', error);
//             toast.error('Failed to create capsule');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleDeleteCapsule = async (id) => {
//         toast((t) => (
//             <div>
//                 <p className="font-medium mb-2">Delete this capsule?</p>
//                 <p className="text-sm text-gray-600 mb-3">This cannot be undone.</p>
//                 <div className="flex gap-2">
//                     <button
//                         onClick={async () => {
//                             try {
//                                 const token = getToken();
//                                 await axios.delete(`${API_URL}/${id}`, {
//                                     headers: { Authorization: `Bearer ${token}` }
//                                 });
//                                 await loadCapsules();
//                                 toast.success('Capsule deleted');
//                             } catch (error) {
//                                 console.error('Error deleting capsule:', error);
//                                 toast.error('Failed to delete capsule');
//                             }
//                             toast.dismiss(t.id);
//                         }}
//                         className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
//                     >
//                         Delete
//                     </button>
//                     <button
//                         onClick={() => toast.dismiss(t.id)}
//                         className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
//                     >
//                         Cancel
//                     </button>
//                 </div>
//             </div>
//         ), { duration: 5000 });
//     };

//     const allTags = [...new Set(capsules.flatMap(c => c.tags || []))];

//     const filteredCapsules = capsules.filter(capsule => {
//         const matchesSearch = capsule.title.toLowerCase().includes(searchTerm.toLowerCase());
//         const matchesTag = filterTag === 'all' || (capsule.tags || []).includes(filterTag);

//         const isUnlocked = new Date(capsule.unlockDate) <= new Date();
//         const matchesStatus = filterStatus === 'all' ||
//             (filterStatus === 'locked' && !isUnlocked) ||
//             (filterStatus === 'unlocked' && isUnlocked);

//         return matchesSearch && matchesTag && matchesStatus;
//     });

//     return (
//         <div className="min-h-screen flex gap-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
//             <Toaster position="top-center" />
//             <Sidebar />

//             <div className="flex-1 ml-28 border-2 border-gray-200 dark:border-gray-700 bg-[#f4f2f0] dark:bg-gray-800 rounded-[50px] p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] overflow-y-auto">
//                 {/* Header */}
//                 <motion.div
//                     initial={{ opacity: 0, y: -20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className="flex items-center justify-between mb-6"
//                 >
//                     <div className="flex items-center gap-3">
//                         <div>
//                             <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: "Brasika" }}>
//                                 Memory Capsules
//                             </h1>
//                             <p className="text-gray-600 dark:text-gray-400">Messages to your future self</p>
//                         </div>
//                     </div>

//                     {!isCreating && (
//                         <motion.button
//                             whileHover={{ scale: 1.05 }}
//                             whileTap={{ scale: 0.95 }}
//                             onClick={() => setIsCreating(true)}
//                             disabled={loading}
//                             className="flex flex-col items-center justify-center bg-[#89beab] text-black w-24 h-24 rounded-full shadow-lg hover:bg-[#f8ba90] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             <Plus className="w-12 h-11 mb-1" />
//                         </motion.button>
//                     )}
//                 </motion.div>

//                 {/* Capsule Creation Form */}
//                 <AnimatePresence>
//                     {isCreating && (
//                         <CapsuleForm
//                             onSubmit={handleCreateCapsule}
//                             onCancel={() => setIsCreating(false)}
//                             loading={loading}
//                         />
//                     )}
//                 </AnimatePresence>

//                 {/* Loading State */}
//                 {loading && !isCreating && (
//                     <div className="flex justify-center items-center py-12">
//                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#89BEAB]"></div>
//                     </div>
//                 )}

//                 {/* Search and Filters */}
//                 {!isCreating && !loading && capsules.length > 0 && (
//                     <motion.div
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 1 }}
//                         className="bg-[#FCF8F5] dark:bg-gray-900/50 rounded-2xl p-6 mb-6"
//                     >
//                         <div className="flex flex-col md:flex-row gap-4">
//                             <div className="flex-1 relative">
//                                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                                 <input
//                                     type="text"
//                                     placeholder="Search capsules..."
//                                     value={searchTerm}
//                                     onChange={(e) => setSearchTerm(e.target.value)}
//                                     className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#89BEAB] dark:bg-gray-800 dark:text-white"
//                                 />
//                             </div>

//                             <select
//                                 value={filterStatus}
//                                 onChange={(e) => setFilterStatus(e.target.value)}
//                                 className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#89BEAB] dark:bg-gray-800 dark:text-white"
//                             >
//                                 <option value="all">All Capsules</option>
//                                 <option value="locked">🔒 Locked</option>
//                                 <option value="unlocked">🔓 Unlocked</option>
//                             </select>

//                             <select
//                                 value={filterTag}
//                                 onChange={(e) => setFilterTag(e.target.value)}
//                                 className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#89BEAB] dark:bg-gray-800 dark:text-white"
//                             >
//                                 <option value="all">All Tags</option>
//                                 {allTags.map(tag => (
//                                     <option key={tag} value={tag}>{tag}</option>
//                                 ))}
//                             </select>
//                         </div>
//                     </motion.div>
//                 )}

//                 {/* Capsules Grid */}
//                 {!loading && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                         {filteredCapsules.length === 0 ? (
//                             <motion.div
//                                 initial={{ opacity: 0, scale: 0.95 }}
//                                 animate={{ opacity: 1, scale: 1 }}
//                                 className="col-span-full bg-[#FCF8F5] dark:bg-gray-900/50 rounded-2xl p-12 text-center"
//                             >
//                                 <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//                                 <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
//                                     {capsules.length === 0 ? 'Create Your First Capsule' : 'No Capsules Found'}
//                                 </h3>
//                                 <p className="text-gray-500 dark:text-gray-400 mb-6">
//                                     {capsules.length === 0
//                                         ? 'Store messages, memories, and reflections for your future self.'
//                                         : 'Try adjusting your search or filters.'
//                                     }
//                                 </p>
//                                 {capsules.length === 0 && (
//                                     <motion.button
//                                         whileHover={{ scale: 1.05 }}
//                                         whileTap={{ scale: 0.95 }}
//                                         onClick={() => setIsCreating(true)}
//                                         className="bg-[#89beab] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#f8ba90] transition-all"
//                                         style={{ fontFamily: "Brasika" }}
//                                     >
//                                         Create First Capsule
//                                     </motion.button>
//                                 )}
//                             </motion.div>
//                         ) : (
//                             <AnimatePresence>
//                                 {filteredCapsules.map((capsule, index) => (
//                                     <CapsuleCard
//                                         key={capsule._id}
//                                         capsule={capsule}
//                                         index={index}
//                                         onDelete={handleDeleteCapsule}
//                                         onRefresh={loadCapsules}
//                                     />
//                                 ))}
//                             </AnimatePresence>
//                         )}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default MemoryCapsule;
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Plus, Search, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import CapsuleCard from '../components/MemoryCapsule/CapsuleCard';
import CapsuleForm from '../components/MemoryCapsule/CapsuleForm';
import axios from 'axios';
import { getToken } from '../services/auth';
import config from '../config';

const MemoryCapsule = () => {
    const navigate = useNavigate();
    const [capsules, setCapsules] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTag, setFilterTag] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'locked', 'unlocked'

    const API_URL = `${config.BACKEND_URL}/api/capsules`;

    // Back button handler
    const handleBackToJournal = () => {
        navigate('/journal');
    };

    const loadCapsules = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCapsules(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (error) {
            console.error('Error loading capsules:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            } else {
                toast.error('Failed to load capsules');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        loadCapsules();
    }, [loadCapsules]);

    const handleCreateCapsule = async (capsuleData) => {
        setLoading(true);
        try {
            const token = getToken();
            await axios.post(API_URL, capsuleData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Memory capsule created! 🎁');
            setIsCreating(false);
            await loadCapsules();
        } catch (error) {
            console.error('Error creating capsule:', error);
            toast.error('Failed to create capsule');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCapsule = async (id) => {
        toast((t) => (
            <div>
                <p className="font-medium mb-2">Delete this capsule?</p>
                <p className="text-sm text-gray-600 mb-3">This cannot be undone.</p>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            try {
                                const token = getToken();
                                await axios.delete(`${API_URL}/${id}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                await loadCapsules();
                                toast.success('Capsule deleted');
                            } catch (error) {
                                console.error('Error deleting capsule:', error);
                                toast.error('Failed to delete capsule');
                            }
                            toast.dismiss(t.id);
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const allTags = [...new Set(capsules.flatMap(c => c.tags || []))];

    const filteredCapsules = capsules.filter(capsule => {
        const matchesSearch = capsule.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = filterTag === 'all' || (capsule.tags || []).includes(filterTag);

        const isUnlocked = new Date(capsule.unlockDate) <= new Date();
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'locked' && !isUnlocked) ||
            (filterStatus === 'unlocked' && isUnlocked);

        return matchesSearch && matchesTag && matchesStatus;
    });

    return (
        <div className="min-h-screen flex gap-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
            <Toaster position="top-center" />
            <Sidebar />

            <div className="flex-1 ml-28 border-2 border-gray-200 dark:border-gray-700 bg-[#f4f2f0] dark:bg-gray-800 rounded-[50px] p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] overflow-y-auto">
                {/* Header with Back Button */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6"
                >
                    <div className="flex items-center gap-4">
                        {/* Back Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleBackToJournal}
                            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all shadow-md"
                            aria-label="Back to Journal"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </motion.button>
                        
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: "Brasika" }}>
                                Memory Capsules
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">Messages to your future self</p>
                        </div>
                    </div>

                    {!isCreating && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsCreating(true)}
                            disabled={loading}
                            className="flex flex-col items-center justify-center bg-[#89beab] text-black w-24 h-24 rounded-full shadow-lg hover:bg-[#f8ba90] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-12 h-11 mb-1" />
                        </motion.button>
                    )}
                </motion.div>

                {/* Capsule Creation Form */}
                <AnimatePresence>
                    {isCreating && (
                        <CapsuleForm
                            onSubmit={handleCreateCapsule}
                            onCancel={() => setIsCreating(false)}
                            onBack={handleBackToJournal} // Pass back handler to form
                            loading={loading}
                        />
                    )}
                </AnimatePresence>

                {/* Loading State */}
                {loading && !isCreating && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#89BEAB]"></div>
                    </div>
                )}

                {/* Search and Filters */}
                {!isCreating && !loading && capsules.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-[#FCF8F5] dark:bg-gray-900/50 rounded-2xl p-6 mb-6"
                    >
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search capsules..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#89BEAB] dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#89BEAB] dark:bg-gray-800 dark:text-white"
                            >
                                <option value="all">All Capsules</option>
                                <option value="locked">🔒 Locked</option>
                                <option value="unlocked">🔓 Unlocked</option>
                            </select>

                            <select
                                value={filterTag}
                                onChange={(e) => setFilterTag(e.target.value)}
                                className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#89BEAB] dark:bg-gray-800 dark:text-white"
                            >
                                <option value="all">All Tags</option>
                                {allTags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                        </div>
                    </motion.div>
                )}

                {/* Capsules Grid */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCapsules.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="col-span-full bg-[#FCF8F5] dark:bg-gray-900/50 rounded-2xl p-12 text-center"
                            >
                                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {capsules.length === 0 ? 'Create Your First Capsule' : 'No Capsules Found'}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    {capsules.length === 0
                                        ? 'Store messages, memories, and reflections for your future self.'
                                        : 'Try adjusting your search or filters.'
                                    }
                                </p>
                                {capsules.length === 0 && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsCreating(true)}
                                        className="bg-[#89beab] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#f8ba90] transition-all"
                                        style={{ fontFamily: "Brasika" }}
                                    >
                                        Create First Capsule
                                    </motion.button>
                                )}
                            </motion.div>
                        ) : (
                            <AnimatePresence>
                                {filteredCapsules.map((capsule, index) => (
                                    <CapsuleCard
                                        key={capsule._id}
                                        capsule={capsule}
                                        index={index}
                                        onDelete={handleDeleteCapsule}
                                        onRefresh={loadCapsules}
                                    />
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemoryCapsule;