import React, { useState, useEffect } from "react";
import { FaDownload, FaTimes, FaMobileAlt } from "react-icons/fa";

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already installed / running as standalone PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("PWA Installed successfully");
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-indigo-900 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/30 backdrop-blur-md animate-bounce-short flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl text-xl">
            <FaMobileAlt />
          </div>
          <div>
            <h4 className="font-bold text-base text-white">Install SPK DM App</h4>
            <p className="text-xs text-indigo-200">
              Pasang aplikasi di layar utama HP Anda untuk akses lebih cepat & mudah!
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-indigo-300 hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Tutup"
        >
          <FaTimes />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={handleInstallClick}
          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
        >
          <FaDownload />
          <span>Install Sekarang</span>
        </button>
        <button
          onClick={handleDismiss}
          className="bg-indigo-800/60 hover:bg-indigo-800 text-indigo-200 text-xs py-2.5 px-3 rounded-xl transition-all"
        >
          Nanti Saja
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
