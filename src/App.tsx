import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster, toast } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import AppRoutes from './AppRoutes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#121212]">
          <AppRoutes />
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
