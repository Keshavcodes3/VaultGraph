"use client";

import { Info } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface FollowsDayDatum {
  /** Short axis label, e.g. "Sep 18". */
  label: string;
  /** Tooltip header, e.g. "Thu, Sep 24". */
  fullLabel: string;
  /** New follows (rendered upward, blue). Must be >= 0. */
  follows: number;
  /** Unfollows (rendered downward, red). Pass as a positive count. */
  unfollows: number;
}

type Row = FollowsDayDatum & { unfollowsNeg: number };

function FollowsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
  label?: string | number;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#101216] px-3.5 py-2.5 shadow-pop">
      <p className="text-[13px] font-semibold text-white">{row.fullLabel}</p>
      <div className="mt-1.5 space-y-1 text-[13px]">
        <p className="flex items-center gap-2 text-gray-300">
          <span className="h-3 w-3 rounded-[4px] bg-[#2e9bff]" />
          <span className="flex-1">New follows</span>
          <span className="font-semibold text-white">{row.follows}</span>
        </p>
        <p className="flex items-center gap-2 text-gray-300">
          <span className="h-3 w-3 rounded-[4px] bg-[#f04452]" />
          <span className="flex-1">Unfollows</span>
          <span className="font-semibold text-white">{row.unfollows}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Diverging "follows over time" bar chart: new follows grow upward (blue),
 * unfollows grow downward (red). Dark card, custom tooltip.
 * Data must come from the caller (API) — this component holds no data.
 */
export default function FollowsOverTime({
  data,
  title = "Follows over time",
  height = 260,
}: {
  data: FollowsDayDatum[];
  title?: string;
  height?: number;
}) {
  const rows: Row[] = data.map((d) => ({ ...d, unfollowsNeg: -Math.abs(d.unfollows) }));
  return (
    <div className="rounded-2xl bg-[#16181d] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-white">
          {title}
        </h3>
        <span className="text-gray-500" title="Net follower movement per day">
          <Info size={15} />
        </span>
      </div>
      <div className="mt-3" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -14 }} barGap={3}>
            <CartesianGrid vertical={false} stroke="#26292f" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#8a8f98", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
              dy={6}
            />
            <YAxis
              tick={{ fill: "#8a8f98", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              content={<FollowsTooltip />}
              cursor={{ fill: "#ffffff08" }}
            />
            <ReferenceLine y={0} stroke="#33363d" />
            <Bar dataKey="follows" name="New follows" barSize={22} radius={[5, 5, 0, 0]}>
              {rows.map((r) => (
                <Cell key={`f-${r.label}`} fill="#2e9bff" />
              ))}
            </Bar>
            <Bar dataKey="unfollowsNeg" name="Unfollows" barSize={22} radius={[0, 0, 5, 5]}>
              {rows.map((r) => (
                <Cell key={`u-${r.label}`} fill="#f04452" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
