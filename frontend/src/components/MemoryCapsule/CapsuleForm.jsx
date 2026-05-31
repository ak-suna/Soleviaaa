import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Calendar, Lock, ArrowLeft } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import PinLockModal from '../PinLockModal';
import { encryptContent, getSessionKey } from '../../utils/encryption';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CapsuleForm = ({ onSubmit, onCancel, loading, onBack }) => {
    const navigate = useNavigate();
    
    const [title, setTitle] = useState('');
    const [unlockDate, setUnlockDate] = useState('');
    const [tags, setTags] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [wantLock, setWantLock] = useState(false);
    const [pin, setPin] = useState('');
    const [isContentEmpty, setIsContentEmpty] = useState(true); // Track if content is empty

    const editor = useEditor({
        extensions: [StarterKit],
        content: '<p>Write your message to your future self...</p>',
        onUpdate: ({ editor }) => {
            // Check if content is empty or just the placeholder
            const content = editor.getHTML();
            const isEmpty = content === '<p>Write your message to your future self...</p>' || 
                           content === '<p></p>' || 
                           !content.trim();
            setIsContentEmpty(isEmpty);
        },
    });

    const handlePinSet = (pinValue) => {
        setPin(pinValue);
        setShowPinModal(false);
        toast.success('PIN protection enabled! 🔒');
    };

    const handleBackToJournal = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/journal');
        }
    };

    const handleSubmit = async () => {
        if (!editor || !title.trim() || !unlockDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        const content = editor.getHTML();
        // Check if content is empty or just the placeholder
        if (content === '<p>Write your message to your future self...</p>' || 
            content === '<p></p>' || 
            !content.trim()) {
            toast.error('Please write something in your capsule');
            return;
        }

        const selectedDate = new Date(unlockDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today) {
            toast.error('Unlock date must be in the future');
            return;
        }

        const encryptionKey = getSessionKey();
        if (!encryptionKey) {
            toast.error('Session expired. Please log in again.');
            return;
        }

        try {
            const encryptedContent = encryptContent(content, encryptionKey);

            const capsuleData = {
                title: title.trim(),
                content: encryptedContent,
                unlockDate: unlockDate,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                isLocked: wantLock,
                pin: wantLock ? pin : undefined
            };

            await onSubmit(capsuleData);
        } catch (error) {
            console.error('Error preparing capsule:', error);
            toast.error('Failed to create capsule');
        }
    };

    const minDate = new Date(new Date().setDate(new Date().getDate() + 1))
        .toISOString()
        .split('T')[0];

    // Clear placeholder on focus
    const handleEditorFocus = () => {
        if (editor && isContentEmpty) {
            editor.commands.setContent('<p></p>');
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#FCF8F5] dark:bg-gray-900/50 rounded-2xl p-6 mb-6 overflow-hidden"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBackToJournal}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            aria-label="Back to Journal"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            Create Memory Capsule
                        </h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Title */}
                <input
                    type="text"
                    placeholder="Give your capsule a title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#89BEAB] dark:bg-gray-800 dark:text-white"
                />

                {/* Content Editor */}
                <div 
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 min-h-[12rem] mb-4 cursor-text"
                    onClick={handleEditorFocus}
                >
                    <style dangerouslySetInnerHTML={{
                        __html: `
                            .ProseMirror {
                                outline: none !important;
                                min-height: 160px;
                            }
                            .ProseMirror p {
                                margin: 0.5em 0;
                            }
                            .ProseMirror p:first-child {
                                margin-top: 0;
                            }
                            .ProseMirror p:last-child {
                                margin-bottom: 0;
                            }
                        `}} 
                    />
                    <EditorContent editor={editor} onFocus={handleEditorFocus} />
                </div>

                {/* Unlock Date */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        When should this capsule unlock?
                    </label>
                    <input
                        type="date"
                        value={unlockDate}
                        onChange={(e) => setUnlockDate(e.target.value)}
                        min={minDate}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#89BEAB] dark:bg-gray-800 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Choose a future date when you want to read this message
                    </p>
                </div>

                {/* PIN Lock Option */}
                <div className="mb-4 bg-[#EDE5DA] dark:bg-gray-800/50 p-4 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={wantLock}
                            onChange={(e) => {
                                setWantLock(e.target.checked);
                                if (e.target.checked && !pin) {
                                    setShowPinModal(true);
                                }
                            }}
                            className="w-5 h-5 text-[#89BEAB] rounded focus:ring-[#89BEAB]"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-[#F8BA90]" />
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                    Lock this entry with PIN
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {pin
                                    ? '✓ PIN protection enabled'
                                    : 'Add extra security with a 4-digit PIN'
                                }
                            </p>
                        </div>
                        {wantLock && pin && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowPinModal(true);
                                }}
                                className="text-sm text-[#89BEAB] hover:text-[#F8BA90] font-medium"
                            >
                                Change PIN
                            </button>
                        )}
                    </label>
                </div>

                {/* Tags */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags (comma-separated)
                    </label>
                    <input
                        type="text"
                        placeholder="memories, goals, reflection..."
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#89BEAB] dark:bg-gray-800 dark:text-white"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={!title.trim() || !unlockDate || loading || (wantLock && !pin)}
                        type="button"
                        className="px-8 py-4 flex items-center justify-center gap-2 bg-[#89beab] text-white rounded-full shadow-lg hover:bg-[#f8ba90] hover:shadow-xl min-w-[150px] min-h-[50px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Creating...' : 'Create Capsule'}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCancel}
                        disabled={loading}
                        type="button"
                        className="px-8 py-4 border-2 border-gray-400 text-black dark:text-white rounded-full shadow-lg hover:shadow-xl min-w-[150px] min-h-[50px] flex justify-center items-center transition-all"
                    >
                        Cancel
                    </motion.button>
                </div>
            </motion.div>

            {/* PIN Modal */}
            <PinLockModal
                isOpen={showPinModal}
                onClose={() => {
                    setShowPinModal(false);
                    if (!pin) setWantLock(false);
                }}
                onUnlock={handlePinSet}
                mode="set"
            />
        </>
    );
};

export default CapsuleForm;