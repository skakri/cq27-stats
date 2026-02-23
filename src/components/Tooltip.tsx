import { useRef, useLayoutEffect, useState, type ReactNode } from "react";

interface Props {
  x: number;
  y: number;
  children: ReactNode;
}

export default function Tooltip({ x, y, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x + 12, top: y - 10 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    let left = x + 12;
    let top = y - 10;

    if (left + rect.width + pad > window.innerWidth) {
      left = x - rect.width - 12;
    }
    if (top + rect.height + pad > window.innerHeight) {
      top = y - rect.height - 12;
    }
    if (left < pad) left = pad;
    if (top < pad) top = pad;

    setPos({ left, top });
  }, [x, y]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-50 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-200 shadow-lg"
      style={pos}
    >
      {children}
    </div>
  );
}
