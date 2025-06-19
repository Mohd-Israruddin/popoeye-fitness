import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./assets/components/Sidebar";
import Home from "./pages/Home";
import Members from "./pages/Members";
import Schedule from "./pages/Schedule";
import Settings from "./pages/SettingsPage";
import Finances from "./pages/Finances/index";
import AddFinance from "./pages/Finances/AddFinance";
import { FinanceProvider } from "./data/FinanceContext";
import AdminRoute from "./assets/components/AdminRoute";
import ViewFinances from "./pages/Finances/ViewFinances";
import BusinessInsights from "./pages/BusinessInsights";
import { AuthProvider } from "./data/AuthContext";
import Staff from "./pages/Staff/Staff";
import Inventory from "./pages/Inventory";

function App() {
  return (
    <AuthProvider>
    <Router>
      <FinanceProvider>
        <div style={{ display: "flex", height: "100vh" }}>
          <Sidebar />
          <main style={{ flexGrow: 1, padding: "20px", overflowY: "auto" }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/members" element={<Members />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/finances" element={<Finances />} />
              <Route path="/finances/add" element={<AddFinance />} />
              <Route element={<AdminRoute />}>
              <Route path="/finances/view" element={<ViewFinances />} />
              <Route path="/insights" element={<BusinessInsights />} />
              </Route>
            </Routes>
          </main>
        </div>
      </FinanceProvider>
    </Router>
    </AuthProvider>
  );
}


export default App;

