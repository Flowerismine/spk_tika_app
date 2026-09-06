import React from 'react';

const Footer = () => (
  <div className="relative overflow-hidden">
    {/* Background with Glassmorphism */}
    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl"></div>
    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/5"></div>
    
    {/* Floating Background Elements */}
    <div className="absolute top-0 left-1/4 w-32 h-16 bg-indigo-500/10 rounded-full blur-2xl"></div>
    <div className="absolute top-0 right-1/4 w-40 h-16 bg-purple-500/10 rounded-full blur-2xl"></div>

    <div className="relative z-10 border-t border-white/10">
      {/* Main Footer Content */}
      <div className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Logo and Description */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div>
                <div className="text-white font-bold text-xl">
                  Metode Naive Bayes
                </div>
                <div className="text-white/60 text-sm">Intelligence Classification System</div>
              </div>
            </div>
            <p className="text-white/70 text-sm max-w-2xl mx-auto leading-relaxed">
              Metode Naive Bayes berfokus pada klasifikasi data berdasarkan probabilitas dengan menggunakan teorema Bayes.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Subtle Animation */}
    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
  </div>
);

export default Footer;