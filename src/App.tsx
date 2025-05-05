import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster, toast } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { VerificationProvider } from "@/contexts/VerificationContext";
import AppRoutes from './AppRoutes';
import TrendingThisWeekPage from './pages/TrendingThisWeekPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AdminProvider>
          <VerificationProvider>
            <div className="min-h-screen bg-[#121212]">
              <AppRoutes />
              <Toaster />
            </div>
          </VerificationProvider>
        </AdminProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
