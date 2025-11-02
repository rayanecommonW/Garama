"use client";

type DebugItem = {
  label: string;
  value: string | number | boolean | null | undefined;
  color?: 'default' | 'success' | 'error' | 'warning' | 'info';
};

type DebugInfoProps = {
  title?: string;
  items: DebugItem[] | Record<string, string | number | boolean | null | undefined>;
  className?: string;
  compact?: boolean;
};

const colorClasses = {
  default: 'text-slate-300',
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

export default function DebugInfo({ title = 'Debug Info', items, className = '', compact = false }: DebugInfoProps) {
  const debugItems: DebugItem[] = Array.isArray(items)
    ? items
    : Object.entries(items).map(([key, value]) => ({
        label: key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      }));

  const containerClasses = compact
    ? 'text-xs text-slate-400'
    : 'text-sm text-slate-300 border-t border-slate-700 pt-3';

  return (
    <div className={`bg-black p-4 rounded ${containerClasses} ${className}`}>
      {title && !compact && (
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          {title}
        </h3>
      )}

      <div className={compact ? 'grid grid-cols-2 gap-2' : 'space-y-1'}>
        {debugItems.map((item, index) => (
          <div key={index} className={compact ? 'flex justify-between' : 'flex justify-between items-center'}>
            <span className="text-slate-400">{item.label}:</span>
            <span className={colorClasses[item.color || 'default']}>
              {item.value ?? '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConnectionStatus({ isConnected, url }: { isConnected: boolean; url: string }) {
  return (
    <DebugInfo
      items={[
        {
          label: 'Connection',
          value: isConnected ? 'Connected' : 'Disconnected',
          color: isConnected ? 'success' : 'error',
        },
        {
          label: 'Server URL',
          value: url,
        },
      ]}
      compact
    />
  );
}

export function PerformanceInfo({ fps, latency, memory }: { fps?: number; latency?: number; memory?: number }) {
  return (
    <DebugInfo
      title="Performance"
      items={[
        { label: 'FPS', value: fps?.toFixed(1) },
        { label: 'Latency', value: latency ? `${latency}ms` : undefined },
        { label: 'Memory', value: memory ? `${(memory / 1024 / 1024).toFixed(1)}MB` : undefined },
      ]}
      compact
    />
  );
}

export function TimingInfo({ lastUpdate, updateCount }: { lastUpdate?: number; updateCount?: number }) {
  return (
    <DebugInfo
      title="Timing"
      items={[
        {
          label: 'Last Update',
          value: lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never',
        },
        { label: 'Updates', value: updateCount },
      ]}
      compact
    />
  );
}
