import axios from "axios";

// FIXED: Changed VITE_API_BASE_URL to VITE_API_URL to match your Vercel dashboard setting
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // Added withCredentials to ensure cookies/sessions work if you add them later
  withCredentials: true, 
});

// This interceptor automatically adds the user context to every request
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("library_user");
  if (raw) {
    try {
      const user = JSON.parse(raw);
      if (user?.role) {
        config.headers["x-user-role"] = user.role;
      }
      if (user?.id) {
        config.headers["x-user-id"] = user.id;
      }
    } catch {
      // Ignore malformed local storage
    }
  }
  return config;
});

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// --- Mappers ---

export const mapBorrowingRecord = (item) => ({
  ...item, 
  id: item.id ?? item.borrowing_id,
  title: item.title || item.book_title,
  studentName: item.user_name || item.student_name,
  expectedReturnDate: toDate(item.expected_return_date || item.due_date),
  actualReturnDate: toDate(item.actual_return_date),
  approvedAt: toDate(item.approved_at),
});

const mapBook = (item) => ({
  id: item.id,
  title: item.title,
  author: item.author,
  genre: item.genre || "General",
  cover_image_url: item.cover_image_url || "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=640&q=60",
  total_copies: Number(item.total_copies ?? 0),
  available_copies: Number(item.available_copies ?? 0),
});

// --- API Functions ---

export const fetchOverdueBorrowings = async () => {
  const { data } = await api.get("/api/overdue");
  return Array.isArray(data) ? data.map(mapBorrowingRecord) : [];
};

export const sendDueDateReminders = async () => {
  const { data } = await api.post("/api/overdue/notify");
  return data;
};

export const fetchBooks = async () => {
  const { data } = await api.get("/api/books");
  return Array.isArray(data) ? data.map(mapBook) : [];
};

export const createBook = async (payload) => {
  const { data } = await api.post("/api/books", payload);
  return mapBook(data);
};

export const updateBook = async (bookId, payload) => {
  const { data } = await api.put(`/api/books/${bookId}`, payload);
  return mapBook(data);
};

export const deleteBook = async (bookId) => {
  await api.delete(`/api/books/${bookId}`);
};

export const loginUser = async (credentials) => {
  const { data } = await api.post("/api/auth/login", credentials);
  return data;
};

export const signupUser = async (userData) => {
  const { data } = await api.post("/api/auth/signup", userData);
  return data;
};

export const borrowBook = async (bookId) => {
  const { data } = await api.post(`/api/books/${bookId}/borrow`);
  return data;
};

export const returnBook = async (bookId) => {
  const { data } = await api.post(`/api/books/${bookId}/return`);
  return data;
};

export const approveBorrow = async (borrowId, dueDate) => {
  const { data } = await api.post(`/api/books/borrows/${borrowId}/approve`, { dueDate });
  return data;
};

export const rejectBorrow = async (borrowId) => {
  const { data } = await api.post(`/api/books/borrows/${borrowId}/reject`);
  return data;
};

export const deleteMember = async (memberId) => {
  await api.delete(`/api/users/${memberId}`);
};

export const fetchMyBooks = async () => {
  const { data } = await api.get("/api/books/my-books");
  return Array.isArray(data) ? data.map(mapBorrowingRecord) : [];
};

export const fetchDashboardStats = async () => {
  const { data } = await api.get("/api/stats");
  return data;
};

export const fetchAllMembers = async () => {
  const { data } = await api.get("/api/users");
  return Array.isArray(data) ? data : [];
};

export const fetchMemberDetails = async (memberId) => {
  const { data } = await api.get(`/api/users/${memberId}`);
  return data;
};

export const updateMemberDetails = async (memberId, { name, email, phone }) => {
  const { data } = await api.put(`/api/users/${memberId}`, { name, email, phone });
  return data;
};

export const fetchMemberHistory = async (memberId) => {
  const { data } = await api.get(`/api/users/${memberId}/history`);
  return Array.isArray(data) ? data.map(mapBorrowingRecord) : [];
};