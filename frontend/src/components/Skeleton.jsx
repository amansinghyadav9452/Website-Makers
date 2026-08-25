import React from 'react';

export function Skeleton({ className = '', count = 1, height = '1em', width = '100%', circle = false }) {
  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton ${circle ? 'skeleton-circle' : ''} ${className}`}
      style={{ height, width: circle ? height : width }}
    />
  ));
  return <>{items}</>;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton height="120px" width="100%" />
      <div style={{ padding: '1rem' }}>
        <Skeleton height="1.2em" width="60%" />
        <Skeleton height="0.9em" width="100%" />
        <Skeleton height="0.9em" width="80%" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-row skeleton-header">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} height="1em" width="80%" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="skeleton-row">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} height="0.9em" width={c === 0 ? '60%' : '80%'} />
          ))}
        </div>
      ))}
    </div>
  );
}
