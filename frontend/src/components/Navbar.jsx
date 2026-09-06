/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { LogOut, reset } from "../features/authSlice";

import { AiOutlineMenu } from "react-icons/ai";
import { BiLogOut } from "react-icons/bi";
import { FaBrain } from "react-icons/fa";

import avatar from "../assets/avatar.png";
import { useStateContext } from "../contexts/ContextProvider";

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const [currentTime, setCurrentTime] = useState(new Date());

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const { activeMenu, setActiveMenu, setScreenSize } = useStateContext();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize(width);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setScreenSize]);

  const handleActiveMenu = () => {
    setActiveMenu(!activeMenu);
  };

  const logout = async () => {
    await dispatch(LogOut());
    dispatch(reset());
    navigate("/");
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="relative z-[9990]">
      {/* Background Glassmorphism */}
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 shadow-lg"></div>

      <div className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-3">
        {/* Left Section - Toggle Button & Brand Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleActiveMenu}
            className="p-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-indigo-200 hover:text-white transition-all duration-200 shadow-md active:scale-95"
            title="Buka Menu Sidebar"
          >
            <AiOutlineMenu className="text-xl sm:text-2xl" />
          </button>

          {/* Brand Logo & Name (Shown on all mobile & desktop screens) */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <FaBrain className="text-white text-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm sm:text-base leading-tight tracking-wide">
                SPK DM
              </span>
              <span className="text-indigo-300/70 text-[10px] sm:text-xs font-medium">
                Naive Bayes System
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Date Section (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
            <div className="text-white font-semibold text-sm">
              {formatTime(currentTime)}
            </div>
            <div className="text-indigo-200/60 text-xs">
              {formatDate(currentTime)}
            </div>
          </div>
        </div>

        {/* Right Section - Profile & Logout */}
        <div className="flex items-center gap-3">
          {/* User Profile */}
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <div className="relative">
              <img
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-indigo-400/40"
                src={avatar}
                alt="user-profile"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-slate-900 rounded-full"></span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-white font-semibold text-xs leading-none">
                {user ? capitalizeFirstLetter(user.username) : "Admin"}
              </p>
              <p className="text-indigo-300/60 text-[10px] mt-0.5 capitalize">
                {user?.role || "Administrator"}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="p-2 rounded-xl text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 transition-all duration-200 active:scale-95"
          >
            <BiLogOut className="text-lg sm:text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;