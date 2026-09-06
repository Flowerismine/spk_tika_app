import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getMe } from "../features/authSlice";

const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsChecking(false);
      return;
    }

    // Jika user belum terload di Redux, lakukan verifikasi token
    if (!user) {
      dispatch(getMe())
        .unwrap()
        .catch((err) => {
          console.error("Auth check notice:", err);
          // Jika token tidak valid / terdeteksi 401, hapus token
          if (err === "No token, authorization denied" || err === "Token tidak valid" || err === "User tidak ditemukan") {
            localStorage.removeItem("token");
          }
        })
        .finally(() => {
          setIsChecking(false);
        });
    } else {
      setIsChecking(false);
    }
  }, [dispatch, user, location.pathname]);

  const token = localStorage.getItem("token");

  // Jika tidak ada token sama sekali, kembalikan ke halaman Login
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Tampilkan loading spinner saat memverifikasi sesi pertama kali
  if (isChecking && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-900/80 border border-indigo-500/20 shadow-2xl backdrop-blur-xl">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-indigo-200 text-xs font-semibold tracking-wide">Memverifikasi Sesi Admin...</span>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
