import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useMatch } from "react-router-dom";

import { Navbar, Footer, Sidebar } from "./components";
import ProtectedRoute from "./components/ProtectedRoute";
import { 
  Dashboard, CetakHasil, LoginPage, 
  ListKriteriaPasien, AddKriteriaDefisit, AddKriteriaSurplus, EditKriteriaDefisit, EditKriteriaSurplus, 
  ListDatasetPasien, AddDatasetDefisit, EditDatasetDefisit, AddDatasetSurplus, EditDatasetSurplus, 
  PerhitunganPasien, HasilAkhirPasien, 
  ListKriteriaMakanan, AddKriteriaMakanan, EditKriteriaMakanan, 
  ListDatasetMakanan, AddDatasetMakanan, EditDatasetMakanan, 
  PerhitunganMakanan, HasilAkhirMakanan, 
  SeederPage, KlasifikasiPasien, DaftarPasien, CetakPasien 
} from "./pages";

import { useStateContext } from "./contexts/ContextProvider";

import "./App.css";

const AppContent = () => {
  const { activeMenu, screenSize, currentMode } = useStateContext();
  const location = useLocation();
  const isLoginPage = location.pathname === "/";
  const isCetakHasil = useMatch("/cetak/:id") !== null;
  const isCetakPasien = location.pathname === "/cetak-pasien";
  const isPrintMode = isCetakHasil || isCetakPasien;

  // Toggle class body-no-scroll for mobile
  useEffect(() => {
    // Only apply body-no-scroll on mobile when sidebar is open
    if (activeMenu && screenSize && screenSize <= 900) {
      document.body.classList.add("body-no-scroll");
    } else {
      document.body.classList.remove("body-no-scroll");
    }

    return () => {
      document.body.classList.remove("body-no-scroll");
    };
  }, [activeMenu, screenSize]);

  // Determine if we should apply sidebar margin (only on desktop)
  const shouldApplySidebarMargin = !isPrintMode && !isLoginPage && activeMenu && screenSize && screenSize > 900;

  return (
    <div className={currentMode === "Dark" ? "dark" : ""}>
      <div className="flex relative dark:bg-main-dark-bg">

        {/* Sidebar */}
        {!isLoginPage && !isPrintMode && <Sidebar />}

        {/* Main Content */}
        <div
          className={`main-content dark:bg-main-dark-bg bg-main-bg min-h-screen w-full ${
            shouldApplySidebarMargin ? "sidebar-visible" : "full-width"
          }`}
        >
          {!isLoginPage && !isPrintMode && (
            <div className="fixed md:static bg-main-bg dark:bg-main-dark-bg navbar w-full">
              <Navbar />
            </div>
          )}

          <div>
            <Routes>
              {/* Public Route */}
              <Route path="/" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/cetak/:id" element={<ProtectedRoute><CetakHasil /></ProtectedRoute>} />
              <Route path="/cetak-pasien" element={<ProtectedRoute><CetakPasien /></ProtectedRoute>} />

              {/* Modul Pasien & Klinik */}
              <Route path="/klasifikasi-pasien" element={<ProtectedRoute><KlasifikasiPasien /></ProtectedRoute>} />
              <Route path="/daftar-pasien" element={<ProtectedRoute><DaftarPasien /></ProtectedRoute>} />
              <Route path="/kriteria-pasien" element={<ProtectedRoute><ListKriteriaPasien /></ProtectedRoute>} />
              <Route path="/add-kriteria-defisit" element={<ProtectedRoute><AddKriteriaDefisit /></ProtectedRoute>} />
              <Route path="/add-kriteria-surplus" element={<ProtectedRoute><AddKriteriaSurplus /></ProtectedRoute>} />
              <Route path="/edit-kriteria-defisit/:id" element={<ProtectedRoute><EditKriteriaDefisit /></ProtectedRoute>} />
              <Route path="/edit-kriteria-surplus/:id" element={<ProtectedRoute><EditKriteriaSurplus /></ProtectedRoute>} />
              <Route path="/dataset-pasien" element={<ProtectedRoute><ListDatasetPasien /></ProtectedRoute>} />
              <Route path="/add-dataset-defisit" element={<ProtectedRoute><AddDatasetDefisit /></ProtectedRoute>} />
              <Route path="/edit-dataset-defisit/:id" element={<ProtectedRoute><EditDatasetDefisit /></ProtectedRoute>} />
              <Route path="/add-dataset-surplus" element={<ProtectedRoute><AddDatasetSurplus /></ProtectedRoute>} />
              <Route path="/edit-dataset-surplus/:id" element={<ProtectedRoute><EditDatasetSurplus /></ProtectedRoute>} />
              <Route path="/perhitungan-pasien" element={<ProtectedRoute><PerhitunganPasien /></ProtectedRoute>} />
              <Route path="/hasil-pasien" element={<ProtectedRoute><HasilAkhirPasien /></ProtectedRoute>} />

              {/* Modul Makanan */}
              <Route path="/kriteria-makanan" element={<ProtectedRoute><ListKriteriaMakanan /></ProtectedRoute>} />
              <Route path="/add-kriteria-makanan" element={<ProtectedRoute><AddKriteriaMakanan /></ProtectedRoute>} />
              <Route path="/edit-kriteria-makanan/:id" element={<ProtectedRoute><EditKriteriaMakanan /></ProtectedRoute>} />
              <Route path="/dataset-makanan" element={<ProtectedRoute><ListDatasetMakanan /></ProtectedRoute>} />
              <Route path="/add-dataset-makanan" element={<ProtectedRoute><AddDatasetMakanan /></ProtectedRoute>} />
              <Route path="/edit-dataset-makanan/:id" element={<ProtectedRoute><EditDatasetMakanan /></ProtectedRoute>} />
              <Route path="/perhitungan-makanan" element={<ProtectedRoute><PerhitunganMakanan /></ProtectedRoute>} />
              <Route path="/hasil-makanan" element={<ProtectedRoute><HasilAkhirMakanan /></ProtectedRoute>} />

              {/* Seeder Tool */}
              <Route path="/seeder" element={<ProtectedRoute><SeederPage /></ProtectedRoute>} />
            </Routes>
          </div>

          {!isLoginPage && !isPrintMode && <Footer />}
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;