const CYCLE_WAVE_DELAYS = ['0s', '1.5s', '3s'];
const WAVE_DOT_DELAYS = ['0s', '0.15s', '0.3s', '0.45s', '0.6s'];

export function EvaluationWaitingBackground() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none">
      {CYCLE_WAVE_DELAYS.map(delay => (
        <div
          key={delay}
          className="absolute w-[40vw] h-[40vw] min-w-[300px] min-h-[300px] rounded-full border-2 border-primary/20 animate-cycle-wave"
          style={{ animationDelay: delay }}
        />
      ))}
    </div>
  );
}

export function EvaluationWaitingWaveDots() {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {WAVE_DOT_DELAYS.map(delay => (
        <div
          key={delay}
          className="w-4 h-4 rounded-full bg-primary wave-animation"
          style={{ animationDelay: delay }}
        />
      ))}
    </div>
  );
}

export function EvaluationWaitingAnimationStyles() {
  return (
    <style jsx global>{`
      @keyframes wave {
        0%, 100% {
          transform: translateY(0) scale(1);
          opacity: 0.7;
        }
        50% {
          transform: translateY(-12px) scale(1.3);
          opacity: 1;
        }
      }
      .wave-animation {
        animation: wave 1.2s ease-in-out infinite;
      }
      @keyframes cycle-wave {
        0% {
          transform: scale(0.5);
          opacity: 0;
        }
        50% {
          opacity: 0.5;
        }
        100% {
          transform: scale(2.5);
          opacity: 0;
        }
      }
      .animate-cycle-wave {
        animation: cycle-wave 4.5s infinite linear;
      }
    `}</style>
  );
}
