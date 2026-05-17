import { motion } from "framer-motion";

function EmptyState({ onAdd, darkMode }: any) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      {/* Floating Demo Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`relative w-64 p-5 rounded-2xl shadow-lg ${
          darkMode ? "bg-gray-800 text-white" : "bg-yellow-200"
        }`}
      >
        <h3 className="font-semibold mb-2">My First Note</h3>
        <p className="text-sm opacity-80">
          You can drag, pin, favorite & edit ✨
        </p>

        {/* Floating Icons Animation */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-3 -right-3 flex gap-1"
        >
          <span>📌</span>
          <span>⭐</span>
          <span>📋</span>
        </motion.div>
      </motion.div>

      {/* Text */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xl font-semibold mt-6"
      >
        No notes yet
      </motion.h2>

      <p className="text-sm opacity-70 mt-2 max-w-sm">
        Create notes, drag them around, pin important ones, and even use voice
        typing 🎤
      </p>

      {/* CTA Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
        className="mt-5 px-5 py-2 rounded-lg bg-black text-white"
      >
        Create your first note ➕
      </motion.button>

      {/* Hint animation */}
      <motion.div
        className="mt-4 text-xs opacity-60"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        Tip: Try voice typing 🎤
      </motion.div>
    </div>
  );
}

export default EmptyState;
