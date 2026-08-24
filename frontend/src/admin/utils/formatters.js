export const statusMeta = {
  new: ['New', 'violet'],
  contacted: ['Contacted', 'blue'],
  'in-progress': ['In progress', 'gold'],
  completed: ['Completed', 'green'],
  archived: ['Archived', 'gray']
};

export const priorityMeta = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent'
};

export const fmtDate = (v) => {
  if (!v) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(v));
};

export const money = (n) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n || 0);
};

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const count = Math.floor(seconds / secondsInUnit);
    if (count >= 1) return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
};
