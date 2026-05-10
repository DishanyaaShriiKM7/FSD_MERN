import { Clock3, LoaderCircle, Siren } from "lucide-react";
import { useMemo, useState } from "react";
import useOverdueData from "../hooks/useOverdueData";
import { sendDueDateReminders } from "../api/libraryApi";
import { useToast } from "../ui/ToastProvider";

function daysUntil(date) {
  if (!date) return null;
  const now = new Date();
  const midnightNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const midnightDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((midnightDate.getTime() - midnightNow.getTime()) / (24 * 60 * 60 * 1000));
}

function NotifyButton({ row }) {
  const { notify } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleNotify = () => {
    setProcessing(true);
    window.setTimeout(() => {
      const message = `Reminder for ${row.studentName}: Please return "${row.title}" by ${row.expectedReturnDate?.toLocaleDateString()}.`;
      console.log("Sending simulated reminder:", message);
      notify(`Proactive Alert Sent to ${row.studentName}`);
      setProcessing(false);
    }, 1200);
  };

  return (
    <button
      type="button"
      disabled={processing}
      onClick={handleNotify}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {processing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
      {processing ? "Processing..." : "Notify"}
    </button>
  );
}

function BorrowTable({ title, icon: Icon, items, emptyText }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-sky-600" />
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2 font-medium">Student</th>
                <th className="px-2 py-2 font-medium">Book</th>
                <th className="px-2 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Due Date</th>
                <th className="px-2 py-2 font-medium">Fine</th>
                <th className="px-2 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-2 py-3 font-medium text-slate-800">{row.studentName}</td>
                  <td className="px-2 py-3 text-slate-600">{row.title}</td>
                  <td className="px-2 py-3 text-slate-600">{row.email || "No email"}</td>
                  <td className="px-2 py-3 text-slate-600">{row.expectedReturnDate?.toLocaleDateString()}</td>
                  <td className="px-2 py-3 text-slate-600">{row.fine ? `₹${row.fine}` : "-"}</td>
                  <td className="px-2 py-3">
                    <NotifyButton row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function NotificationCenterPage() {
  const { records, loading, error } = useOverdueData();
  const { notify } = useToast();
  const [sending, setSending] = useState(false);

  const { dueToday, upcomingReturns, overdue } = useMemo(() => {
    const today = [];
    const upcoming = [];
    const late = [];

    records.forEach((record) => {
      const days = daysUntil(record.expectedReturnDate);
      if (days === null) return;
      if (days === 0) {
        today.push(record);
      } else if (days > 0 && days <= 2) {
        upcoming.push(record);
      } else if (days < 0) {
        late.push(record);
      }
    });

    return { dueToday: today, upcomingReturns: upcoming, overdue: late };
  }, [records]);

  const handleSendReminders = async () => {
    setSending(true);
    try {
      const { summary } = await sendDueDateReminders();
      const message = `Email reminders sent: ${summary.sent}/${summary.total}.`;
      notify(message);
    } catch (err) {
      notify(err?.response?.data?.error || "Failed to send reminders.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Notification Center</h1>
        <p className="mt-1 text-sm text-slate-500">
          Proactively alert students for upcoming and overdue returns.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          Failed to fetch data from `http://localhost:5000/api/overdue`: {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {loading ? <p className="text-sm text-slate-500">Loading notifications...</p> : null}
        <button
          type="button"
          disabled={sending}
          onClick={handleSendReminders}
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? "Sending emails..." : "Send due-date reminders"}
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <BorrowTable
          title="Due Today"
          icon={Clock3}
          items={dueToday}
          emptyText="No books are due today."
        />
        <BorrowTable
          title="Upcoming Returns (48h)"
          icon={Clock3}
          items={upcomingReturns}
          emptyText="No upcoming returns found from current backend response."
        />
        <BorrowTable
          title="Overdue"
          icon={Siren}
          items={overdue}
          emptyText="No overdue items currently present."
        />
      </div>
    </section>
  );
}

