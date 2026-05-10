import { useCallback, useEffect, useState } from "react";
import { fetchDashboardStats, fetchMyBooks, returnBook, approveBorrow, rejectBorrow, deleteMember } from "../api/libraryApi";
import StatCard from "../ui/StatCard";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../ui/ToastProvider";
import { BookOpen, Users, AlertCircle, Activity, Bookmark } from "lucide-react";

function AdminDashboard({ stats, loading, onApprove, onReject, onDeleteMember }) {
  const {
    totalBooks = 0,
    availableBooks = 0,
    outOfStockCount = 0,
    dueToday = 0,
    totalMembers = 0,
    genreBreakdown = [],
    recentActivity = [],
    pendingRequests = [],
    memberBorrowings = [],
  } = stats;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Books" value={loading ? "..." : totalBooks} tone="sky" />
        <StatCard title="Members" value={loading ? "..." : totalMembers} tone="emerald" />
        <StatCard title="Due Today" value={loading ? "..." : dueToday} tone="amber" />
        <StatCard title="Out of Stock" value={loading ? "..." : outOfStockCount} tone="rose" />
        <StatCard title="Available" value={loading ? "..." : availableBooks} tone="indigo" />
      </div>

      {pendingRequests.length > 0 && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm dark:border-amber-900/50 dark:bg-amber-900/10">
          <div className="mb-4 flex items-center gap-2 border-b border-amber-200/50 pb-4 dark:border-amber-900/50">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-500">Pending Requests</h2>
          </div>
          <ul className="space-y-4">
            {pendingRequests.map((req) => (
              <li key={req.borrow_id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">"{req.book_title}"</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Requested by: <span className="font-medium text-slate-700 dark:text-slate-300">{req.user_name}</span></p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(req.borrowed_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => onApprove(req.borrow_id)} className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                    Approve
                  </button>
                  <button onClick={() => onReject(req.borrow_id)} className="flex-1 sm:flex-initial px-4 py-2 bg-rose-100 text-rose-700 text-sm font-medium rounded-lg hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 transition-colors">
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-700">
          <Users className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active Members</h2>
        </div>
        {memberBorrowings.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No active member borrowings yet.</p>
        ) : (
          <div className="space-y-4">
            {memberBorrowings.map((member) => (
              <div key={member.user_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{member.user_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{member.email || member.phone || "No contact"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {member.borrowed_books.length} book{member.borrowed_books.length === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteMember(member.user_id, member.user_name)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {member.borrowed_books.length > 0 ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {member.borrowed_books.map((borrow) => (
                      <div key={borrow.borrow_id} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{borrow.book_title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Borrowed: {new Date(borrow.borrowed_at).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Due: {borrow.expected_return_date ? new Date(borrow.expected_return_date).toLocaleDateString() : "N/A"}</p>
                        {borrow.fine ? (
                          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Fine: ₹{borrow.fine}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No currently approved books.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Genre Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Bookmark className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-semibold text-slate-900">Genre Distribution</h2>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500 animate-pulse">Loading genres...</p>
          ) : (
            <ul className="space-y-3">
              {genreBreakdown.length > 0 ? (
                genreBreakdown.map((genre) => (
                  <li key={genre.genre} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{genre.genre}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {genre.count} books
                    </span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-slate-500">No genres found.</p>
              )}
            </ul>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Activity className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500 animate-pulse">Loading activity...</p>
          ) : (
            <ul className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((book) => (
                  <li key={book.id} className="flex gap-4 items-start">
                    <div className="flex h-12 w-10 flex-shrink-0 items-center justify-center rounded bg-slate-100">
                      <BookOpen className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">New Book Added</p>
                      <p className="text-sm text-slate-500">"{book.title}" by {book.author}</p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-sm text-slate-500">No recent activity.</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function UserDashboard({ stats, loading, user, myBooks, myBooksLoading, onReturnBook }) {
  const {
    dueSoon = 0,
    newArrivalsCount = 0,
    recommended = [],
  } = stats;

  const approvedBooksCount = myBooks ? myBooks.filter(b => b.status === 'approved').length : 0;

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Hello, {user?.name || "Reader"}!</h1>
        <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">What would you like to read today?</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-10">
        <StatCard title="Borrowed Books" value={loading || myBooksLoading ? "..." : approvedBooksCount} tone="sky" />
        <StatCard title="Due Soon" value={loading ? "..." : dueSoon} tone="rose" />
        <StatCard title="New Arrivals" value={loading ? "..." : newArrivalsCount} tone="emerald" />
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-10">
        <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          My Borrowed Books
        </h2>
        {myBooksLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Syncing personal vault...</p>
        ) : myBooks && myBooks.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {myBooks.map((book) => (
              <div key={book.borrow_id} className="group flex gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 hover:shadow-md transition-shadow">
                <div className="w-20 aspect-[3/4] bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden shrink-0 shadow-sm">
                  <img
                    src={book.cover_image_url || 'https://via.placeholder.com/300x400?text=No+Cover'}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <h3 className="line-clamp-2 font-semibold text-slate-900 dark:text-slate-100 leading-tight">{book.title}</h3>
                  <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400 mt-1">{book.author}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                    {book.status === 'pending' ? 'Requested: ' : 'Borrowed: '}
                    {new Date(book.borrowed_at).toLocaleDateString()}
                  </p>
                  {book.approvedAt ? (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      Approved: {book.approvedAt.toLocaleDateString()}
                    </p>
                  ) : null}
                  {book.expectedReturnDate ? (
                    <>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        Due: {book.expectedReturnDate.toLocaleDateString()}
                      </p>
                      {book.fine ? (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                          Fine: ₹{book.fine}
                        </p>
                      ) : null}
                    </>
                  ) : null}

                  {book.status === 'pending' ? (
                    <div className="mt-auto inline-flex justify-center items-center rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                      Waiting for Approval
                    </div>
                  ) : (
                    <button
                      onClick={() => onReturnBook(book.id)}
                      className="mt-auto inline-flex justify-center items-center rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Return Book
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Bookmark className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">Your reading list is empty.</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-5">Borrow a book from the library to get started.</p>
            <a href="/inventory" className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors">
              Go to Inventory
            </a>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Recommended for You</h2>
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Curating recommendations...</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-3">
            {recommended.length > 0 ? (
              recommended.map((book) => (
                <div key={book.id} className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:shadow-md transition-shadow">
                  <div className="aspect-[3/4] w-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <img 
                      src={book.cover_image_url || 'https://via.placeholder.com/300x400?text=No+Cover'} 
                      alt={book.title} 
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 h-full">
                    <h3 className="line-clamp-1 font-semibold text-slate-900 dark:text-slate-100">{book.title}</h3>
                    <p className="line-clamp-1 text-sm text-slate-500 dark:text-slate-400 mb-2">{book.author}</p>
                    <span className="inline-flex rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                      {book.genre || 'General'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 col-span-3">No recommendations available at the moment.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // User specific
  const [myBooks, setMyBooks] = useState([]);
  const [myBooksLoading, setMyBooksLoading] = useState(false);

  const loadMyBooks = useCallback(async () => {
    if (isAdmin) return;
    try {
      setMyBooksLoading(true);
      const data = await fetchMyBooks();
      setMyBooks(data);
    } catch (err) {
      console.error("Failed to load personal books:", err);
    } finally {
      setMyBooksLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const data = await fetchDashboardStats();
        if (mounted) setStats(data);
        if (mounted) await loadMyBooks();
      } catch (err) {
        if (mounted) setError(err?.message || "Failed to load stats");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [isAdmin, loadMyBooks]);

  const { notify } = useToast();

  const handleReturnBook = async (bookId) => {
    const confirmed = window.confirm("Do you want to mark this book as returned?");
    if (!confirmed) return;

    try {
      setMyBooksLoading(true);
      await returnBook(bookId);
      await loadMyBooks();
      const data = await fetchDashboardStats();
      setStats(data);
      notify("Book successfully returned. Thank you!");
    } catch (err) {
      console.error("Return failed", err);
      notify(err?.response?.data?.error || "Return failed.");
      setMyBooksLoading(false);
    }
  };

  const handleApprove = async (borrowId) => {
    const defaultDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dueDate = window.prompt("Select a due date (YYYY-MM-DD):", defaultDue);
    if (dueDate === null) return;
    const selectedDate = dueDate.trim();
    if (!selectedDate) {
      notify("Approval cancelled: no due date selected.");
      return;
    }
    const parsed = new Date(selectedDate);
    if (Number.isNaN(parsed.getTime())) {
      notify("Invalid date format. Use YYYY-MM-DD.");
      return;
    }

    try {
      await approveBorrow(borrowId, selectedDate);
      const data = await fetchDashboardStats();
      setStats(data);
      notify("Borrow request approved with custom due date.");
    } catch (err) {
      console.error("Approve failed", err);
      notify(err?.response?.data?.error || "Approval failed.");
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    const confirmed = window.confirm(`Delete member ${memberName}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteMember(memberId);
      notify(`Member ${memberName} removed successfully.`);
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Delete member failed", err);
      notify(err?.response?.data?.error || "Failed to delete member.");
    }
  };

  const handleReject = async (borrowId) => {
    try {
      await rejectBorrow(borrowId);
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Reject failed", err);
    }
  };

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
        Unable to connect to backend: {error}.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {isAdmin ? (
        <>
          <header>
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-white">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">High-level activity across the library system.</p>
          </header>
          <AdminDashboard stats={stats} loading={loading} onApprove={handleApprove} onReject={handleReject} onDeleteMember={handleDeleteMember} />
        </>
      ) : (
        <UserDashboard 
          stats={stats} 
          loading={loading} 
          user={user} 
          myBooks={myBooks} 
          myBooksLoading={myBooksLoading} 
          onReturnBook={handleReturnBook} 
        />
      )}
    </section>
  );
}
