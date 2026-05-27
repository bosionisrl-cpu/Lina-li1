import React from 'react';
import { motion } from 'motion/react';

interface MetricCardProps {
  title: string;
  score: number;
  description: string;
  colorName: 'emerald' | 'indigo' | 'amber' | 'rose';
  icon: React.ReactNode;
}

export default function MetricCard({ title, score, description, colorName, icon }: MetricCardProps) {
  // Define color themes
  const config = {
    emerald: {
      text: 'text-emerald-400',
      bgLight: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      stroke: 'stroke-emerald-500',
      trail: 'stroke-emerald-950/40',
    },
    indigo: {
      text: 'text-indigo-400',
      bgLight: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      stroke: 'stroke-indigo-500',
      trail: 'stroke-indigo-950/40',
    },
    amber: {
      text: 'text-amber-400',
      bgLight: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      stroke: 'stroke-amber-500',
      trail: 'stroke-amber-950/40',
    },
    rose: {
      text: 'text-rose-400',
      bgLight: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      stroke: 'stroke-rose-500',
      trail: 'stroke-rose-950/40',
    },
  }[colorName];

  // SVG parameters for circular guage
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-slate-900 border ${config.border} rounded-xl p-5 flex items-center justify-between gap-4 shadow-lg`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`p-1.5 rounded-lg ${config.bgLight} ${config.text}`}>
            {icon}
          </div>
          <span className="text-sm font-semibold text-slate-300 font-sans tracking-tight">
            {title}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-normal max-w-[200px]">
          {description}
        </p>
      </div>

      <div className="relative flex items-center justify-center shrink-0 w-20 h-20 select-none">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={`${config.trail} fill-none`}
            strokeWidth="6"
          />
          {/* Animated score circle */}
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            className={`${config.stroke} fill-none`}
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            strokeDasharray={circumference}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold font-mono text-slate-100">
            {score}
          </span>
          <span className="text-[9px] font-sans font-medium tracking-wide text-slate-500 -mt-1">
            SCORE
          </span>
        </div>
      </div>
    </motion.div>
  );
}
