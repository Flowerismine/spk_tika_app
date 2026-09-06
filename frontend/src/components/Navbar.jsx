/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";

import { LogOut, reset } from "../features/authSlice";

import { AiOutlineMenu } from "react-icons/ai";
import { BiLogOut } from "react-icons/bi"; // Import logout icon

import avatar from "../assets/avatar.png";
import { useStateContext } from "../contexts/ContextProvider";

const NavButton = ({ title, customFunc, icon, color, dotColor, isActive }) => (
  <button
    type="button"
    onClick={() => customFunc()}
    title={title}
    className={`
      relative p-3 rounded-xl transition-all duration-300 transform hover:scale-105
      ${
        isActive
          ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10"
          : "text-white/70 hover:text-white hover:bg-white/10"
      }
    `}
  >
    {dotColor && (
      <span
        className="absolute inline-flex rounded-full h-2 w-2 right-2 top-2 animate-pulse"
        style={{ background: dotColor }}
      />
    )}
    <div className="text-xl">{icon}</div>
  </button>
);

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const [currentTime, setCurrentTime] = useState(new Date());

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const {
    activeMenu,
    setActiveMenu,
    setScreenSize,
    screenSize,
  } = useStateContext();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize(width);
    };

    // Initial call
    handleResize();
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setScreenSize]);

  // Toggle menu function
  const handleActiveMenu = () => {
    setActiveMenu(!activeMenu);
  };

  // Logout function
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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="relative z-[10000]">
      {/* Background with Glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/5"></div>

      {/* Floating Background Elements */}
      <div className="absolute top-0 left-20 w-32 h-16 bg-indigo-500/10 rounded-full blur-2xl"></div>
      <div className="absolute top-0 right-20 w-40 h-16 bg-purple-500/10 rounded-full blur-2xl"></div>

      <div className="relative z-10 flex justify-between items-center px-6 py-4 border-b border-white/10">
        {/* Left Section - Menu & Time */}
        <div className="flex items-center gap-6">
          {/* Menu Toggle */}
          <NavButton
            title="Toggle Menu"
            customFunc={handleActiveMenu}
            icon={<AiOutlineMenu />}
            isActive={activeMenu}
          />

          {/* Time Display */}
          <div className="hidden md:block">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-white font-semibold text-lg">
                  {formatTime(currentTime)}
                </div>
                <div className="text-white/60 text-xs">
                  {formatDate(currentTime)}
                </div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
            </div>
          </div>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="p-2 rounded-lg text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 transform hover:scale-105"
          >
            <BiLogOut className="text-xl" />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-white/20 hidden sm:block"></div>

          {/* User Profile */}
          <div className="relative">
            <div className="flex items-center gap-3">
              {/* Avatar with Status */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-indigo-400/50 transition-all duration-300">
                  <img
                    className="w-full h-full object-cover"
                    src={avatar}
                    alt="user-profile"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"></div>
              </div>

              {/* User Info */}
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1">
                  <span className="text-white/60 text-sm">Hi,</span>
                  <span className="text-white font-semibold text-sm">
                    {user ? capitalizeFirstLetter(user.username) : "Admin"}
                  </span>
                </div>
                <div className="text-white/40 text-xs">
                  {user?.role || "Administrator"}
                </div>
              </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-purple-500/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;