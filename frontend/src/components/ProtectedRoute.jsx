import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getMe } from "../features/authSlice";

const ProtectedRoute = ({ children }) => {
  const { isError, user } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsChecking(false);
      return;
    }

    dispatch(getMe())
      .finally(() => {
        setIsChecking(false);
      });
  }, [dispatch]);

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white/70 text-sm">Memverifikasi sesi...</span>
        </div>
      </div>
    );
  }

  if (isError && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
