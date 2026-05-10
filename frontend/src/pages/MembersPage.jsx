import { useEffect, useState } from "react";
import { Trash2, Edit, Eye, X } from "lucide-react";
import {
  fetchAllMembers,
  fetchMemberHistory,
  updateMemberDetails,
  deleteMember,
} from "../api/libraryApi";

function MemberEditModal({ member, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: member?.name || "",
    email: member?.email || "",
    phone: member?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateMemberDetails(member.id, formData);
      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Edit Member</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-700 dark:hover:bg-sky-800"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberHistoryModal({ member, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchMemberHistory(member.id);
        setHistory(data);
      } catch (err) {
        console.error("Error loading history:", err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [member.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Borrowing History - {member.name}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-slate-500">No borrowing history</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr className="text-slate-700 dark:text-slate-300">
                  <th className="px-3 py-2 text-left font-semibold">Book Title</th>
                  <th className="px-3 py-2 text-left font-semibold">Author</th>
                  <th className="px-3 py-2 text-left font-semibold">Borrowed</th>
                  <th className="px-3 py-2 text-left font-semibold">Due Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Returned</th>
                  <th className="px-3 py-2 text-right font-semibold">Fine</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{record.title}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{record.author}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      {new Date(record.borrowed_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      {new Date(record.expected_return_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      {record.actual_return_date
                        ? new Date(record.actual_return_date).toLocaleDateString()
                        : "Not returned"}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {record.fine > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">₹{record.fine}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMember, setEditingMember] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await fetchAllMembers();
      setMembers(data);
    } catch (err) {
      console.error("Error loading members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMembers();
  }, []);

  const handleDeleteMember = async (memberId) => {
    try {
      await deleteMember(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting member:", err);
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Members</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Manage and view member details</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading members...</div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-12 text-center text-slate-500">No members found</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr className="text-slate-700 dark:text-slate-300">
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Phone</th>
                <th className="px-4 py-3 text-center font-semibold">Active Borrows</th>
                <th className="px-4 py-3 text-center font-semibold">Overdue</th>
                <th className="px-4 py-3 text-right font-semibold">Total Fine</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{member.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{member.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{member.phone}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{member.active_borrows}</td>
                  <td className="px-4 py-3 text-center">
                    {member.overdue_count > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        {member.overdue_count}
                      </span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {member.total_fine > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400">₹{member.total_fine}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setViewingHistory(member)}
                        className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                        title="View history"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingMember(member)}
                        className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                        title="Edit member"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(member.id)}
                        className="rounded-md p-1.5 text-slate-600 hover:bg-rose-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 transition-colors"
                        title="Delete member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingMember && (
        <MemberEditModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={loadMembers}
        />
      )}

      {viewingHistory && (
        <MemberHistoryModal
          member={viewingHistory}
          onClose={() => setViewingHistory(null)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 dark:bg-slate-900 max-w-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete Member?</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              This action cannot be undone. All associated records will be deleted.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMember(deleteConfirm)}
                className="flex-1 rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
