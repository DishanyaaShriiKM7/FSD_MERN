import { motion } from "framer-motion";

export default function StatCard({ title, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    sky: "bg-sky-100 text-sky-700",
    rose: "bg-rose-100 text-rose-700",
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-4 inline-block rounded-lg px-3 py-1 text-3xl font-bold ${tones[tone]}`}>
        {value}
      </p>
    </motion.article>
  );
}

