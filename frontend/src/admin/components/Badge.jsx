import { statusMeta, priorityMeta } from '../utils/formatters';

export default function Badge({ type = 'status', value }) {
  const label = type === 'status'
    ? (statusMeta[value]?.[0] || value)
    : (priorityMeta[value] || value);

  const tone = type === 'status'
    ? (statusMeta[value]?.[1] || 'gray')
    : value === 'urgent' ? 'red'
    : value === 'high' ? 'gold'
    : value === 'normal' ? 'blue'
    : 'gray';

  return <span className={`badge ${tone}`}><i />{label}</span>;
}
