
import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import { MdOutlineCancel } from "react-icons/md";
import { BiSolidDashboard } from "react-icons/bi";
import { FaRegFileAlt, FaBrain } from "react-icons/fa";
import { AiOutlineBarChart } from "react-icons/ai";

import { LogOut, reset } from "../features/authSlice";
import { useStateContext } from "../contexts/ContextProvider";

const Sidebar = () => {
  const { activeMenu, setActiveMenu, screenSize } = useStateContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const links = [
    {
      title: "Dashboard",
      links: [
        {
          name: "dashboard",
          icon: <BiSolidDashboard />,
          display: "Dashboard"
        },
      ],
    },
    {
      title: "Klinik",
      links: [
        {
          name: "klasifikasi-pasien",
          icon: <FaRegFileAlt />,
          display: "Klasifikasi Pasien Baru"
        },
        {
          name: "daftar-pasien",
          icon: <AiOutlineBarChart />,
          display: "Daftar Pasien"
        },
      ],
    },
    {
      title: "Data Pasien",
      links: [
        {
          name: "kriteria-pasien",
          icon: <FaRegFileAlt />,
          display: "Kriteria"
        },
        {
          name: "dataset-pasien",
          icon: <FaRegFileAlt />,
          display: "Dataset"
        },
        {
          name: "perhitungan-pasien",
          icon: <AiOutlineBarChart />,
          display: "Pembuktian Naive Bayes"
        },
        {
          name: "hasil-pasien",
          icon: <AiOutlineBarChart />,
          display: "Hasil Pembuktian"
        },
      ],
    },
    {
      title: "Data Makanan",
      links: [
        {
          name: "kriteria-makanan",
          icon: <FaRegFileAlt />,
          display: "Kriteria"
        },
        {
          name: "dataset-makanan",
          icon: <FaRegFileAlt />,
          display: "Dataset"
        },
        {
          name: "perhitungan-makanan",
          icon: <AiOutlineBarChart />,
          display: "Pembuktian Naive Bayes"
        },
        {
          name: "hasil-makanan",
          icon: <AiOutlineBarChart />,
          display: "Hasil Pembuktian"
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

  // Handle mobile view
  if (screenSize <= 900) {
    if (!activeMenu) return null;
    
    return (
      <>
        {/* Overlay for mobile - starts below header */}
        <div 
          className="fixed top-16 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-[9998]"
          onClick={() => setActiveMenu(false)}
        />
        
        {/* Mobile Sidebar - positioned below header */}
        <div className="fixed top-16 left-0 w-72 h-[calc(100vh-4rem)] z-[9999]">
          <SidebarContent 
            links={links}
            handleCloseSideBar={handleCloseSideBar}
            setActiveMenu={setActiveMenu}
            isMobile={true}
          />
        </div>
      </>
    );
  }

  // Desktop view - Fixed position sidebar
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

// Separate component for sidebar content to avoid duplication
const SidebarContent = ({ links, handleCloseSideBar, setActiveMenu, isMobile = false }) => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background with Glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.2),transparent_50%)]"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-6 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-5 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>

      {/* Main Sidebar Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header Section - Only show on desktop or include mobile header */}
        {!isMobile && (
          <div className="flex justify-between items-center pt-5 px-3 pb-4 border-b border-white/10 flex-shrink-0">
            <Link
              to="/dashboard"
              onClick={handleCloseSideBar}
              className="group flex items-center space-x-3 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 shadow-lg group-hover:bg-white/15 transition-all duration-300">
                <FaBrain className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-lg group-hover:text-indigo-300 transition-colors duration-300">
                  Metode Naive Bayes
                </div>
                <div className="text-white/60 text-xs">Classification System</div>
              </div>
            </Link>
          </div>
        )}
        
        {/* Navigation Links - Scrollable Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 sidebar-scroll">
          {links.map((section) => (
            <div key={section.title} className="mb-6">
              <div className="flex items-center justify-between px-3 py-2 text-white/50 text-xs font-semibold uppercase tracking-wider">
                <span>{section.title}</span>
              </div>
              
              <div className="mt-2 space-y-1">
                {section.links.map((link) => (
                  <NavLink
                    key={link.name}
                    to={`/${link.name}`}
                    onClick={handleCloseSideBar}
                    className={({ isActive }) =>
                      isActive
                        ? "group relative flex items-center gap-4 px-4 py-3 mx-1 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border border-indigo-400/30 text-white shadow-lg backdrop-blur-sm transition-all duration-300 transform hover:scale-[1.02]"
                        : "group relative flex items-center gap-4 px-4 py-3 mx-1 rounded-xl text-white/70 hover:text-white hover:bg-white/10 hover:border hover:border-white/20 transition-all duration-300 transform hover:scale-[1.02]"
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-xl"></div>
                        )}
                        
                        <div className={`
                          relative z-10 text-lg transition-all duration-300
                          ${isActive ? 'text-indigo-300' : 'text-white/60 group-hover:text-indigo-300'}
                        `}>
                          {link.icon}
                        </div>
                        
                        <span className="relative z-10 capitalize font-medium">
                          {link.display || link.name}
                        </span>
                        
                        {isActive && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Footer - Quick actions */}
        {isMobile && (
          <div className="flex-shrink-0 border-t border-white/10 p-4 bg-white/5 backdrop-blur-sm">
            <Link
              to="/dashboard"
              onClick={handleCloseSideBar}
              className="flex items-center justify-center w-full py-2 px-4 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg border border-indigo-400/30 text-white text-sm font-medium transition-all duration-200"
            >
              <BiSolidDashboard className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
