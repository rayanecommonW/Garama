'use client';

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
  onToggleCollisions?: () => void;
  collisionsEnabled?: boolean;
  onToggleFreeCam?: () => void;
  freeCamEnabled?: boolean;
  onToggleCoordinates?: () => void;
  coordinatesEnabled?: boolean;
};

const colorClasses = {
  default: 'text-[#c9f4e2]/80',
  success: 'text-emerald-400',
  error: 'text-rose-400',
  warning: 'text-amber-300',
  info: 'text-sky-300',
};

export default function DebugInfo({
  title = 'Debug Info',
  items,
  className = '',
  compact = false,
  onToggleCollisions,
  collisionsEnabled,
  onToggleFreeCam,
  freeCamEnabled,
  onToggleCoordinates,
  coordinatesEnabled,
}: DebugInfoProps) {
  const debugItems: DebugItem[] = Array.isArray(items)
    ? items
    : Object.entries(items).map(([key, value]) => ({
        label: key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      }));

  const containerClasses = compact
    ? 'text-xs text-[#7bb59a]/80'
    : 'text-sm text-[#c9f4e2]/80 border-t border-[#1f3b2b]/60 pt-3';

  return (
    <div className={`rounded border border-[#1f3b2b]/80 bg-[#020b06]/80 p-4 backdrop-blur-sm ${containerClasses} ${className}`}>
      {title && !compact && (
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-[#7bb59a] uppercase">
          {title}
        </h3>
      )}

      <div className={compact ? 'grid grid-cols-2 gap-2' : 'space-y-1'}>
        {debugItems.map((item, index) => (
          <div
            key={index}
            className={compact ? 'flex justify-between' : 'flex items-center justify-between'}
          >
            <span className="text-[#7bb59a]/80">{item.label}:</span>
            <span className={colorClasses[item.color || 'default']}>{item.value ?? '—'}</span>
          </div>
        ))}
      </div>

      {(onToggleCollisions || onToggleFreeCam || onToggleCoordinates) && (
        <div className="mt-3 border-t border-[#1f3b2b]/60 pt-3 space-y-2">
          {onToggleCollisions && (
            <button
              onClick={onToggleCollisions}
              className={`w-full rounded px-3 py-2 text-sm font-medium transition-colors ${
                collisionsEnabled
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-[#0b1a12]/80 text-[#c9f4e2]/80 hover:bg-[#0b1a12]'
              }`}
            >
              {collisionsEnabled ? '🔲 Hide Hitboxes' : '🔲 Show Hitboxes'}
            </button>
          )}
          {onToggleFreeCam && (
            <button
              onClick={onToggleFreeCam}
              className={`w-full rounded px-3 py-2 text-sm font-medium transition-colors ${
                freeCamEnabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-[#0b1a12]/80 text-[#c9f4e2]/80 hover:bg-[#0b1a12]'
              }`}
            >
              {freeCamEnabled ? '📷 Exit Free Cam' : '📷 Free Cam Mode'}
            </button>
          )}
          {onToggleCoordinates && (
            <button
              onClick={onToggleCoordinates}
              className={`w-full rounded px-3 py-2 text-sm font-medium transition-colors ${
                coordinatesEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-[#0b1a12]/80 text-[#c9f4e2]/80 hover:bg-[#0b1a12]'
              }`}
            >
              {coordinatesEnabled ? '📍 Hide Coordinates' : '📍 Show Coordinates'}
            </button>
          )}
        </div>
      )}
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

export function PerformanceInfo({
  fps,
  latency,
  memory,
}: {
  fps?: number;
  latency?: number;
  memory?: number;
}) {
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

export function TimingInfo({
  lastUpdate,
  updateCount,
}: {
  lastUpdate?: number;
  updateCount?: number;
}) {
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
