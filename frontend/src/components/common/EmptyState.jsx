import React from 'react';
import Button from './Button';

const EmptyState = ({
  icon: Icon,
  title = 'No data available',
  description = 'There is currently no information to display in this view.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-slate-200 shadow-card ${className}`}
    >
      {Icon && (
        <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl mb-4 border border-slate-100">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h4 className="text-base font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
