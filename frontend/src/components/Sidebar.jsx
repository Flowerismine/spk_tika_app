import React from "react";
import { Link, NavLink } from "react-router-dom";
import { MdOutlineCancel } from "react-icons/md";
import { BiSolidDashboard } from "react-icons/bi";
import { FaRegFileAlt, FaBrain, FaUtensils, FaUserInjured, FaCalculator, FaCheckCircle, FaDatabase } from "react-icons/fa";
import { AiOutlineBarChart } from "react-icons/ai";
import { useStateContext } from "../contexts/ContextProvider";

const Sidebar = () => {
  const { activeMenu, setActiveMenu, screenSize } = useStateContext();

  const links = [
    {
      title: "Menu Utama",
      links: [
        {
          name: "dashboard",
          icon: <BiSolidDashboard />,
          display: "Dashboard"
        },
      ],
    },
    {
      title: "Layanan Klinik",
      links: [
        {
          name: "klasifikasi-pasien",
          icon: <FaUserInjured />,
          display: "Klasifikasi Pasien Baru"
        },
        {
          name: "daftar-pasien",
          icon: <FaRegFileAlt />,
          display: "Daftar Pasien"
        },
      ],
    },
    {
      title: "Data Pasien (Naive Bayes)",
      links: [
        {
          name: "kriteria-pasien",
          icon: <FaRegFileAlt />,
          display: "Kriteria Pasien"
        },
        {
          name: "dataset-pasien",
          icon: <FaDatabase />,
          display: "Dataset Pasien"
        },
        {
          name: "perhitungan-pasien",
          icon: <FaCalculator />,
          display: "Hitung Naive Bayes"
        },
        {
          name: "hasil-pasien",
          icon: <FaCheckCircle />,
          display: "Hasil Klasifikasi"
        },
      ],
    },
    {
      title: "Data Makanan (Naive Bayes)",
      links: [
        {
          name: "kriteria-makanan",
          icon: <FaUtensils />,
          display: "Kriteria Makanan"
        },
        {
          name: "dataset-makanan",
          icon: <FaDatabase />,
          display: "Dataset Makanan"
        },
        {
          name: "perhitungan-makanan",
          icon: <FaCalculator />,
          display: "Hitung Naive Bayes"
        },
        {
          name: "hasil-makanan",
          icon: <FaCheckCircle />,
          display: "Hasil Klasifikasi"
        },
      ],
    },
  ];

  const handleCloseSideBar = () => {
    if (activeMenu && screenSize && screenSize <= 900) {
      setActiveMenu(false);
    }
  };

  // Don't render anything if screenSize is not initialized yet
  if (screenSize === undefined) {
    return null;
  }

  // Handle Mobile View Sidebar Drawer
  if (screenSize <= 900) {
    if (!activeMenu) return null;
    
    return (
      <div className="fixed inset-0 z-[100000] overflow-hidden">
        {/* Backdrop Overlay */}
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
          onClick={() => setActiveMenu(false)}
        />
        
        {/* Mobile Slide-in Drawer */}
        <div className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] h-full shadow-2xl z-[100001] transition-transform duration-300 transform translate-x-0">
          <SidebarContent 
            links={links}
            handleCloseSideBar={handleCloseSideBar}
            setActiveMenu={setActiveMenu}
            isMobile={true}
          />
        </div>
      </div>
    );
  }

  // Desktop View Fixed Sidebar
  if (!activeMenu) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-72 h-screen z-[9999]">
      <SidebarContent 
        links={links}
        handleCloseSideBar={handleCloseSideBar}
        setActiveMenu={setActiveMenu}
        isMobile={false}
      />
    </div>
  );
};

// Sidebar Content Component
const SidebarContent = ({ links, handleCloseSideBar, setActiveMenu, isMobile = false }) => {
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col border-r border-white/10 shadow-2xl">
      {/* Rich Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.25),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.2),transparent_50%)]"></div>
      </div>
      
      {/* Decorative Glow Orbs */}
      <div className="absolute top-10 left-4 w-32 h-32 bg-indigo-500/15 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-4 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Main Container */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top Header & Brand */}
        <div className="flex justify-between items-center px-4 py-5 border-b border-white/10 flex-shrink-0 bg-white/5 backdrop-blur-md">
          <Link
            to="/dashboard"
            onClick={handleCloseSideBar}
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
              <FaBrain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-base tracking-wide group-hover:text-indigo-300 transition-colors">
                SPK Naive Bayes
              </div>
              <div className="text-indigo-200/60 text-[11px] font-medium">Diabetes Melitus</div>
            </div>
          </Link>

          {/* Close Button (Always visible on mobile, optional desktop toggle) */}
          <button
            type="button"
            onClick={() => setActiveMenu(false)}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            title="Tutup Menu"
          >
            <MdOutlineCancel className="text-2xl" />
          </button>
        </div>
        
        {/* Scrollable Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {links.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold text-indigo-300/60 uppercase tracking-wider">
                {section.title}
              </div>
              
              <div className="space-y-1 pt-1">
                {section.links.map((link) => (
                  <NavLink
                    key={link.name}
                    to={`/${link.name}`}
                    onClick={handleCloseSideBar}
                    className={({ isActive }) =>
                      isActive
                        ? "group relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl bg-gradient-to-r from-indigo-600/90 to-purple-600/90 border border-indigo-400/40 text-white shadow-lg shadow-indigo-500/20 font-semibold text-sm transition-all duration-200"
                        : "group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-sm font-medium transition-all duration-200"
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`text-base transition-colors ${isActive ? 'text-white' : 'text-indigo-300/70 group-hover:text-indigo-300'}`}>
                          {link.icon}
                        </div>
                        <span className="truncate">{link.display}</span>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-white animate-ping"></div>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Quick Action Footer */}
        {isMobile && (
          <div className="flex-shrink-0 p-4 border-t border-white/10 bg-slate-900/80 backdrop-blur-md">
            <Link
              to="/klasifikasi-pasien"
              onClick={handleCloseSideBar}
              className="flex items-center justify-center w-full py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
            >
              <FaUserInjured className="mr-2 text-sm" />
              Klasifikasi Pasien Baru
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
