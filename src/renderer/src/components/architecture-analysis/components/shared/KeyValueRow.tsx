import React from 'react';

interface Props { label: string; value: string }

const KeyValueRow: React.FC<Props> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-100 last:border-0 text-sm">
    <span className="text-gray-500 shrink-0">{label}</span>
    <span className="font-semibold text-gray-900 text-right break-words min-w-0">{value}</span>
  </div>
);

export default KeyValueRow;
