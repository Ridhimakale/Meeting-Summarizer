import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, ListChecks } from "lucide-react";
import { Card } from "../ui/Card";
import { SummaryResponse } from "../../types/api";

type SummaryPanelProps = {
  summary: SummaryResponse;
};

function EmptyState() {
  return <p className="text-sm text-slate-500 dark:text-slate-400">None captured.</p>;
}

function SectionList({ items }: { items: string[] }) {
  if (!items.length) {
    return <EmptyState />;
  }

  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-300" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  return (
    <div className="space-y-5">
      <Card title="Executive Summary">
        <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
          {summary.executive_summary || "No executive summary generated."}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Discussion Points">
          <SectionList items={summary.discussion_points} />
        </Card>
        <Card title="Decisions">
          <SectionList items={summary.decisions} />
        </Card>
      </div>

      <Card title="Action Items">
        {summary.action_items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Owner</th>
                  <th className="py-2 pr-4 font-semibold">Task</th>
                  <th className="py-2 font-semibold">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary.action_items.map((item, index) => (
                  <tr key={`${item.owner}-${item.task}-${index}`}>
                    <td className="py-3 pr-4 align-top font-medium">{item.owner}</td>
                    <td className="py-3 pr-4 align-top text-slate-700 dark:text-slate-200">{item.task}</td>
                    <td className="py-3 align-top text-slate-600 dark:text-slate-300">{item.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Risks">
          <SectionList items={summary.risks} />
        </Card>
        <Card title="Next Meeting">
          <SectionList items={summary.next_meeting} />
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <ClipboardList size={18} className="text-blue-600 dark:text-blue-300" />
          <p className="mt-2 text-2xl font-semibold">{summary.discussion_points.length}</p>
          <p className="text-xs text-slate-500">points</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-300" />
          <p className="mt-2 text-2xl font-semibold">{summary.decisions.length}</p>
          <p className="text-xs text-slate-500">decisions</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <ListChecks size={18} className="text-blue-600 dark:text-blue-300" />
          <p className="mt-2 text-2xl font-semibold">{summary.action_items.length}</p>
          <p className="text-xs text-slate-500">actions</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {summary.risks.length ? (
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-300" />
          ) : (
            <CalendarDays size={18} className="text-slate-500" />
          )}
          <p className="mt-2 text-2xl font-semibold">{summary.risks.length}</p>
          <p className="text-xs text-slate-500">risks</p>
        </div>
      </div>
    </div>
  );
}
