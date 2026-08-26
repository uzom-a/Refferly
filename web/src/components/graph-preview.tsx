"use client";

// Small static SVG graph to make the hero feel like a real network view
export function GraphPreview() {
  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox="0 0 260 160"
        className="h-36 w-full max-w-xs text-[10px]"
        aria-hidden="true"
      >
        {/* Edges */}
        <line
          x1="50"
          y1="80"
          x2="130"
          y2="40"
          className="stroke-slate-300"
          strokeWidth="1.5"
        />
        <line
          x1="50"
          y1="80"
          x2="130"
          y2="120"
          className="stroke-slate-300"
          strokeWidth="1.5"
        />
        <line
          x1="130"
          y1="40"
          x2="210"
          y2="80"
          className="stroke-slate-300"
          strokeWidth="1.5"
        />
        <line
          x1="130"
          y1="120"
          x2="210"
          y2="80"
          className="stroke-slate-300"
          strokeWidth="1.5"
        />

        {/* You node */}
        <circle
          cx="50"
          cy="80"
          r="16"
          className="fill-yellow-100 stroke-yellow-500"
          strokeWidth="1.5"
        />
        <text
          x="50"
          y="84"
          textAnchor="middle"
          className="fill-slate-800 text-[10px] font-semibold"
        >
          You
        </text>

        {/* Aisha node */}
        <circle
          cx="130"
          cy="40"
          r="14"
          className="fill-slate-100 stroke-slate-300"
          strokeWidth="1.2"
        />
        <text
          x="130"
          y="44"
          textAnchor="middle"
          className="fill-slate-700 text-[9px]"
        >
          Aisha
        </text>

        {/* Farouk node */}
        <circle
          cx="130"
          cy="120"
          r="14"
          className="fill-slate-100 stroke-slate-300"
          strokeWidth="1.2"
        />
        <text
          x="130"
          y="124"
          textAnchor="middle"
          className="fill-slate-700 text-[9px]"
        >
          Farouk
        </text>

        {/* John (Electrician) node */}
        <circle
          cx="210"
          cy="80"
          r="18"
          className="fill-sky-100 stroke-sky-500"
          strokeWidth="1.5"
        />
        <text
          x="210"
          y="76"
          textAnchor="middle"
          className="fill-slate-800 text-[9px] font-semibold"
        >
          John
        </text>
        <text
          x="210"
          y="88"
          textAnchor="middle"
          className="fill-slate-600 text-[8px]"
        >
          Electrician
        </text>
      </svg>
    </div>
  );
}


