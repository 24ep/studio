type LocaleCode = "en-US" | "th-TH";

interface LocaleFlagProps {
  locale: LocaleCode;
  className?: string;
}

const stripeHeight = 40 / 13;

function LocaleFlagUS({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={className}
      aria-hidden="true"
      role="img"
      focusable="false"
    >
      {Array.from({ length: 13 }).map((_, index) => (
        <rect
          key={index}
          x={0}
          y={index * stripeHeight}
          width={60}
          height={stripeHeight + 0.5}
          fill={index % 2 === 0 ? "#b22234" : "#fff"}
        />
      ))}
      <rect x={0} y={0} width={24} height={15.5} fill="#3c3b6e" />
      {[
        [3, 3],
        [9, 3],
        [15, 3],
        [6, 7],
        [12, 7],
        [9, 10.5],
      ].map(([x, y], index) => (
        <circle
          key={`star-${index}`}
          cx={x}
          cy={y}
          r={1.2}
          fill="#fff"
          stroke="#fff"
        />
      ))}
    </svg>
  );
}

function LocaleFlagTH({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={className}
      aria-hidden="true"
      role="img"
      focusable="false"
    >
      <rect x={0} y={0} width={60} height={40} fill="#f4f5f8" />
      <rect x={0} y={0} width={60} height={9.5} fill="#a51931" />
      <rect x={0} y={9.5} width={60} height={3} fill="#fff" />
      <rect x={0} y={12.5} width={60} height={15} fill="#2d2a4a" />
      <rect x={0} y={27.5} width={60} height={3} fill="#fff" />
      <rect x={0} y={30.5} width={60} height={9.5} fill="#a51931" />
    </svg>
  );
}

export function LocaleFlag({ locale, className = "h-4 w-6" }: LocaleFlagProps) {
  const safeClassName = `${className} rounded-sm`;
  return locale === "en-US" ? (
    <LocaleFlagUS className={safeClassName} />
  ) : (
    <LocaleFlagTH className={safeClassName} />
  );
}
