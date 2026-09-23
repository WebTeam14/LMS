import React from 'react';
import { GraduationCapIcon } from '../../../components/common/Icons.jsx';

export const BrandMark = ({ compact = false }) => {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={`grid shrink-0 place-items-center rounded-lg bg-indigo-600 text-white shadow-sm ${
          compact ? 'w-9 h-9' : 'w-11 h-11'
        }`}
      >
        <GraduationCapIcon className={compact ? 'w-5 h-5' : 'w-6 h-6'} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className={`truncate font-display font-semibold leading-none ${compact ? 'text-xl' : 'text-2xl'}`}>
          UniSphere
        </p>
        <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-inherit opacity-75">
          Digital Campus
        </p>
      </div>
    </div>
  );
};

export default BrandMark;
