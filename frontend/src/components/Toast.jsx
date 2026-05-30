import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center gap-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[300px] max-w-[500px]"
    >
      {type === 'success' && (
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
      )}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default Toast;

