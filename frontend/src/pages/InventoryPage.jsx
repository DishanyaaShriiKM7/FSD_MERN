import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Plus, Search, Trash2, X, Star, ExternalLink, Library } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createBook, deleteBook, fetchBooks, updateBook, borrowBook } from "../api/libraryApi";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../ui/ToastProvider";

const INITIAL_FORM = {
  title: "",
  author: "",
  genre: "General",
  cover_image_url: "",
  total_copies: "",
  available_copies: "",
};

function BookDetailsDrawer({ book, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
      />
      
      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="fixed inset-y-0 right-0 z-50 w-full bg-white shadow-2xl lg:w-2/5 xl:w-[40%] dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Library className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            Book Details
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="w-full md:w-1/3 aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 shadow-md">
              <img
                src={book.cover_image_url || 'https://via.placeholder.com/400x550?text=No+Cover'}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{book.title}</h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mt-1">{book.author}</p>
              
              <div className="flex items-center gap-1 mt-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 ml-2">4.8 (124 reviews)</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {book.genre || 'General'}
                </span>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  book.available_copies > 0 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                }`}>
                  {book.available_copies > 0 ? `${book.available_copies} Available` : 'Out of Stock'}
                </span>
              </div>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Synopsis</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
              <br/><br/>
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>

          <a 
            href={`https://books.google.com/books?q=${encodeURIComponent(book.title + ' ' + book.author)}`}
            target="_blank" 
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Search on Google Books
          </a>
        </div>
      </motion.div>
    </>
  );
}

function AddBookModal({ onClose, onSave, editingBook }) {
  const { notify } = useToast();
  const [form, setForm] = useState(
    editingBook
      ? {
          title: editingBook.title,
          author: editingBook.author,
          genre: editingBook.genre || "General",
          cover_image_url: editingBook.cover_image_url || "",
          total_copies: String(editingBook.total_copies),
          available_copies: String(editingBook.available_copies),
        }
      : INITIAL_FORM,
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({
        title: form.title,
        author: form.author,
        genre: form.genre,
        cover_image_url: form.cover_image_url,
        total_copies: Number(form.total_copies),
        available_copies: Number(form.available_copies || form.total_copies),
      });
      notify(`Book "${form.title}" saved successfully.`);
      onClose();
    } catch (err) {
      notify(err?.response?.data?.error || "Failed to save book.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl"
      >
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-5">
          {editingBook ? "Edit Core Data" : "Log New Arrival"}
        </h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Title"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all dark:text-slate-100 placeholder:dark:text-slate-500"
          />
          <input
            required
            value={form.author}
            onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
            placeholder="Author"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all dark:text-slate-100 placeholder:dark:text-slate-500"
          />
          <select
            value={form.genre}
            onChange={(e) => setForm((prev) => ({ ...prev, genre: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all dark:text-slate-100"
          >
            <option value="General">Select Genre</option>
            <option value="Fiction">Fiction</option>
            <option value="Non-Fiction">Non-Fiction</option>
            <option value="Self-Help">Self-Help</option>
            <option value="Business">Business</option>
            <option value="Science Fiction">Science Fiction</option>
            <option value="Biography">Biography</option>
          </select>
          <input
            value={form.cover_image_url}
            onChange={(e) => setForm((prev) => ({ ...prev, cover_image_url: e.target.value }))}
            placeholder="Cover Image URL (Direct Link)"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all dark:text-slate-100 placeholder:dark:text-slate-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              min="1"
              required
              value={form.total_copies}
              onChange={(e) => setForm((prev) => ({ ...prev, total_copies: e.target.value }))}
              placeholder="Total Copies"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all dark:text-slate-100 placeholder:dark:text-slate-500"
            />
            <input
              type="number"
              min="0"
              required
              value={form.available_copies}
              onChange={(e) => setForm((prev) => ({ ...prev, available_copies: e.target.value }))}
              placeholder="Available Copies"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all dark:text-slate-100 placeholder:dark:text-slate-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sky-600 hover:bg-sky-700 px-5 py-2 text-sm font-medium text-white transition-all disabled:opacity-50"
            >
              {saving ? "Processing..." : "Confirm Data"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function InventoryPage() {
  const { isAdmin } = useAuth();
  const { notify } = useToast();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // UX State
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sortParam, setSortParam] = useState("Newest");
  
  // Modal State
  const [open, setOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [viewingBook, setViewingBook] = useState(null);

  // Deriving Genres
  const genres = useMemo(() => {
    const raw = books.map(b => b.genre || "General");
    return ["All", ...new Set(raw)];
  }, [books]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await fetchBooks();
      setBooks(data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const processedBooks = useMemo(() => {
    // Filter
    let filtered = books.filter((book) =>
      book.title.toLowerCase().includes(query.trim().toLowerCase()) ||
      book.author.toLowerCase().includes(query.trim().toLowerCase())
    );
    if (genreFilter !== "All") {
      filtered = filtered.filter(b => (b.genre || "General") === genreFilter);
    }
    
    // Sort
    return filtered.sort((a, b) => {
      if (sortParam === "A-Z") return a.title.localeCompare(b.title);
      if (sortParam === "Most Available") return b.available_copies - a.available_copies;
      // Default: Newest (We assume ID desc represents newest if created_at isn't precise)
      return b.id - a.id; 
    });
  }, [books, query, genreFilter, sortParam]);

  const handleSave = async (payload) => {
    if (editingBook) {
      await updateBook(editingBook.id, payload);
    } else {
      await createBook(payload);
    }
    setEditingBook(null);
    await loadBooks();
  };

  const handleDelete = async (bookId, title) => {
    const confirmed = window.confirm(`Irreversibly delete "${title}" pipeline?`);
    if (!confirmed) return;
    try {
      await deleteBook(bookId);
      notify(`Asset "${title}" erased.`);
      await loadBooks();
    } catch (err) {
      notify(err?.response?.data?.error || "Delete failed.");
    }
  };

  const handleBorrow = async (e, bookId, title) => {
    e.stopPropagation(); // prevent opening drawer
    try {
      await borrowBook(bookId);
      notify(`Successfully borrowed "${title}". Happy reading!`);
      await loadBooks(); // refresh available counts
    } catch (err) {
      notify(err?.response?.data?.error || "Borrow failed.");
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">The Archive</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Discover and borrow from our comprehensive catalog.</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditingBook(null);
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" />
            Stock Asset
          </button>
        )}
      </header>

      {/* Advanced Filters */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or author..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="sm:w-48 shrink-0">
            <select
              value={sortParam}
              onChange={(e) => setSortParam(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 text-sm outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="Newest">Sort: Newest</option>
              <option value="A-Z">Sort: A-Z</option>
              <option value="Most Available">Sort: Most Available</option>
            </select>
          </div>
        </div>
        
        {/* Genre Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setGenreFilter(genre)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                genreFilter === genre 
                ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse font-medium">Synchronizing archive payload...</p>}
      {error && <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold">{error}</p>}

      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {processedBooks.map((book) => (
            <motion.article 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              key={book.id} 
              onClick={() => setViewingBook(book)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-lg hover:border-sky-200 dark:hover:border-sky-900 cursor-pointer"
            >
              <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                <img 
                  src={book.cover_image_url || 'https://via.placeholder.com/400x300?text=No+Cover'} 
                  alt={book.title} 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                {!isAdmin && (
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <button className="rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium px-5 py-2 text-sm hover:bg-white/30 transition-colors">
                      View Details
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 p-5 space-y-3">
                <div>
                  <h2 className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{book.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{book.author}</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-auto pt-2">
                  <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider ${
                    book.available_copies > 0 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50'
                  }`}>
                    {book.available_copies > 0 ? `${book.available_copies} Left` : 'Empty'}
                  </span>
                  <span className="inline-flex rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                    {book.genre || 'General'}
                  </span>
                </div>
                
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => handleBorrow(e, book.id, book.title)}
                    disabled={book.available_copies <= 0}
                    className={`mt-4 w-full rounded-lg py-2.5 text-sm font-semibold transition-all ${
                      book.available_copies > 0 
                      ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
                    }`}
                  >
                    {book.available_copies > 0 ? "Borrow Book" : "Out of Stock"}
                  </button>
                )}

                {isAdmin && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBook(book);
                        setOpen(true);
                      }}
                      className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(book.id, book.title);
                      }}
                      className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-md border border-rose-200 dark:border-rose-900/50 px-2 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Wipe
                    </button>
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>

      {!loading && processedBooks.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
        >
          <Search className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No results found in these specific archives.</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try tweaking your search bindings.</p>
        </motion.div>
      )}

      {/* Book Settings Modal (Admin) */}
      <AnimatePresence>
        {open && isAdmin && (
          <AddBookModal
            editingBook={editingBook}
            onSave={handleSave}
            onClose={() => {
              setOpen(false);
              setEditingBook(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Cool Interactive Side Drawer (Everyone) */}
      <AnimatePresence>
        {viewingBook && (
          <BookDetailsDrawer 
            book={viewingBook} 
            onClose={() => setViewingBook(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}