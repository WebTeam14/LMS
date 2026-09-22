import React from 'react';

export const PasswordStrengthMeter = ({ password = '' }) => {
  if (!password) return null;

  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One numeric digit (0-9)', met: /[0-9]/.test(password) },
    { label: 'One special symbol (!@#$...)', met: /[^a-zA-Z0-9]/.test(password) },
  ];

  const passedCount = checks.filter((c) => c.met).length;

  // Strength label & color
  let strengthLabel = 'Very Weak';
  let barColor = 'bg-rose-500';
  let activeBars = 1;

  if (passedCount >= 5) {
    strengthLabel = 'Strong';
    barColor = 'bg-emerald-500';
    activeBars = 4;
  } else if (passedCount >= 4) {
    strengthLabel = 'Good';
    barColor = 'bg-indigo-500';
    activeBars = 3;
  } else if (passedCount >= 3) {
    strengthLabel = 'Fair';
    barColor = 'bg-amber-500';
    activeBars = 2;
  } else {
    strengthLabel = 'Weak';
    barColor = 'bg-rose-500';
    activeBars = 1;
  }

  return (
    <div className="space-y-2 pt-1">
      {/* 4 Segment Progress Bar */}
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span>Security Strength</span>
        <span className={`font-semibold ${passedCount >= 4 ? 'text-emerald-600' : 'text-slate-600'}`}>
          {strengthLabel}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`h-full rounded-full transition-all duration-300 ${
              index <= activeBars ? barColor : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Dynamic Requirement Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
        {checks.map((check, idx) => (
          <div
            key={idx}
            className={`flex items-center space-x-1.5 transition-colors ${
              check.met ? 'text-emerald-600 font-medium' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                check.met ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {check.met ? '✓' : '•'}
            </span>
            <span className="truncate">{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
