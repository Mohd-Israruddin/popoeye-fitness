import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Page Components
import Home from "./pages/Home";
import Members from "./pages/Members";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import Staff from "./pages/Staff/Staff";
import Enquiries from "./pages/Enquiries";
import Finances from "./pages/Finances";
import AddFinance from "./pages/Finances/AddFinance";
import RecurringTransactions from "./pages/Finances/RecurringTransactions";
import ViewFinances from "./pages/Finances/ViewFinances";
import BusinessInsights from "./pages/BusinessInsights";
import Help from "./pages/Help";
import StaffLogin from "./pages/StaffLogin";
import StaffLog from "./pages/Staff/StaffLog";
import Biometric from "./pages/Biometric";

// App Components
import Sidebar from "./assets/components/Sidebar";
import ProtectedRoute from "./assets/components/ProtectedRoute";

// Context Providers
import { AuthProvider, useAuth } from "./data/AuthContext";
import { FinanceProvider } from "./data/FinanceContext";

function AppContent() {
  // const { user } = useAuth();
  return (
    <div className="app-container">
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<StaffLogin />} />
          <Route path="/" element={<ProtectedRoute><Sidebar /><Home /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Sidebar /><Members /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><Sidebar /><Schedule /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute><Sidebar /><Staff /></ProtectedRoute>} />
          <Route path="/staff/log" element={<ProtectedRoute adminOnly={true}><Sidebar /><StaffLog /></ProtectedRoute>} />
          <Route path="/enquiries" element={<ProtectedRoute><Sidebar /><Enquiries /></ProtectedRoute>} />
          <Route path="/finances" element={<ProtectedRoute adminOnly={true}><Sidebar /><Finances /></ProtectedRoute>} />
          <Route path="/finances/add" element={<ProtectedRoute><Sidebar /><AddFinance /></ProtectedRoute>} />
          <Route path="/finances/recurring" element={<ProtectedRoute adminOnly={true}><Sidebar /><RecurringTransactions /></ProtectedRoute>} />
          <Route path="/finances/view" element={<ProtectedRoute adminOnly={true}><Sidebar /><FinanceProvider><ViewFinances /></FinanceProvider></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Sidebar /><Settings /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute adminOnly={true}><Sidebar /><BusinessInsights /></ProtectedRoute>} />
          <Route path="/biometric" element={<ProtectedRoute adminOnly={true}><Sidebar /><Biometric /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Sidebar /><Help /></ProtectedRoute>} />
        </Routes>
      </main>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;

