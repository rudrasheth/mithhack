import React from 'react';
import { motion } from 'framer-motion';

const RiskOrb = ({ riskScore = 0.1 }) => {
    const isHighRisk = riskScore > 0.6;

    // Minimalist Financial Chart Style
    // Green/Red arc

    const circumference = 2 * Math.PI * 40; // r=40
    const progress = riskScore * circumference;

    const color = isHighRisk ? '#E11900' : '#10B981';

    return (
        <div className="relative w-40 h-40 flex items-center justify-center">

            {/* Background Track */}
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="50%"
                    cy="50%"
                    r="40"
                    fill="transparent"
                    stroke="#E7E5E4" // Stone-200
                    strokeWidth="8"
                />
                {/* Progress Arc */}
                <motion.circle
                    cx="50%"
                    cy="50%"
                    r="40"
                    fill="transparent"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </svg>

            {/* Central Pulse (Subtle) */}
            {isHighRisk && (
                <motion.div
                    className="absolute w-24 h-24 rounded-full bg-red-500/10 pointer-events-none"
                    animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            )}

            {/* Icon/Logo Center */}
            <div className="absolute text-stone-800 font-bold text-xl">
                {Math.round(riskScore * 100)}%
            </div>

        </div>
    );
};

export default RiskOrb;
