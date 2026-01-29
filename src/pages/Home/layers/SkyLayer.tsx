import { motion } from 'framer-motion';
import { isSky } from '../../../core/terrain/bounds';

const SkyLayer = () => {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-black-900 to-purple-900">
      {/* partículas sutis (luzes) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full opacity-30"
            style={{
              width: Math.round(2 + (i % 3)),
              height: Math.round(2 + (i % 3)),
              left: `${(i * 7) % 100}%`,
              top: `${10 + (i * 3) % 60}%`,
              filter: 'blur(2px)'
            }}
            animate={{ y: [0, -6, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
      {/* nuvens simples e alongadas */}
      <motion.div
        className="absolute top-12 left-4 w-60 h-12 bg-white rounded-full opacity-60"
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        ref={(el) => {
          if (el) {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            console.log('Nuvem 1 está no céu?', isSky(centerX, centerY));
          }
        }}
      />
      <motion.div
        className="absolute top-24 right-6 w-48 h-10 bg-white rounded-full opacity-55"
        animate={{ x: [0, -28, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        ref={(el) => {
          if (el) {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            console.log('Nuvem 2 está no céu?', isSky(centerX, centerY));
          }
        }}
      />
    </div>
  );
};

export default SkyLayer;
