import { useEffect, useMemo, useState } from "react";
import { fetchOverdueBorrowings } from "../api/libraryApi";

export default function useOverdueData() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const data = await fetchOverdueBorrowings();
        if (mounted) setRecords(data);
      } catch (err) {
        if (mounted) setError(err?.message || "Failed to fetch overdue records.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const uniqueTitles = new Set(records.map((record) => record.title)).size;
    const now = Date.now();
    const urgentAlerts = records.filter((record) => {
      if (!record.expectedReturnDate) return false;
      return now - record.expectedReturnDate.getTime() > 2 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      totalBooks: uniqueTitles,
      activeLoans: records.length,
      urgentAlerts,
    };
  }, [records]);

  return { records, loading, error, metrics };
}

