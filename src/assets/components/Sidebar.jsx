import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import {
  FaTachometerAlt, FaUsers, FaCalendarAlt, FaBoxOpen, FaDollarSign, 
  FaCog, FaChartLine, FaUserTie, FaQuestionCircle, FaBars, FaTimes, 
  FaChevronDown, FaChevronRight, FaInstagram, FaEnvelope, FaDumbbell, FaFingerprint
} from "react-icons/fa";
import { useAuth } from '../../data/AuthContext';

const Sidebar = () => {
  const { isAdmin, isStaff } = useAuth();
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
  const [financesOpen, setFinancesOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);

  const handleToggle = () => setIsOpen(!isOpen);
  const toggleFinances = () => setFinancesOpen(!financesOpen);
  const toggleContact = () => setContactOpen(!contactOpen);
  const toggleStaff = () => setStaffOpen(!staffOpen);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { to: "/", icon: <FaTachometerAlt />, text: "Dashboard" },
    { to: "/members", icon: <FaUsers />, text: "Members" },
    { to: "/inventory", icon: <FaBoxOpen />, text: "Inventory" },
    { to: "/schedule", icon: <FaCalendarAlt />, text: "Schedule" },
    { to: "/enquiries", icon: <FaQuestionCircle />, text: "Enquiries" },
  ];

  // Add admin-only links
  const adminLinks = [
    { to: "/insights", icon: <FaChartLine />, text: "Business Insights" },
    { to: "/biometric", icon: <FaFingerprint />, text: "Biometric" },
  ];
  
  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && window.innerWidth <= 768 && (
        <div className="sidebar-backdrop" onClick={handleToggle}></div>
      )}
      
      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">
              <FaDumbbell />
            </div>
            <h1 className="logo">GymSoft</h1>
          </div>
          <button className="close-btn" onClick={handleToggle}>
            <FaTimes />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">MAIN MENU</div>
          {navLinks.map(link => (
            <NavLink 
              key={link.to} 
              to={link.to} 
              onClick={closeSidebarOnMobile}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <div className="nav-icon">{link.icon}</div>
              <span className="nav-text">{link.text}</span>
              <div className="nav-indicator"></div>
            </NavLink>
          ))}

          {/* Admin-only links */}
          {isAdmin && adminLinks.map(link => (
            <NavLink 
              key={link.to} 
              to={link.to} 
              onClick={closeSidebarOnMobile}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <div className="nav-icon">{link.icon}</div>
              <span className="nav-text">{link.text}</span>
              <div className="nav-indicator"></div>
            </NavLink>
          ))}

          {/* Admin-only: Staff Dropdown */}
          {isAdmin && (
            <div className="nav-dropdown">
              <button className="nav-dropdown-btn" onClick={toggleStaff}>
                <div className="nav-icon">
                  <FaUserTie />
                </div>
                <span className="nav-text">Staff</span>
                <div className={`dropdown-arrow ${staffOpen ? 'open' : ''}`}>
                  <FaChevronRight />
                </div>
              </button>
              <div className={`nav-dropdown-content ${staffOpen ? 'open' : ''}`}>
                <NavLink 
                  to="/staff" 
                  onClick={closeSidebarOnMobile}
                  className={({ isActive }) => isActive ? 'dropdown-item active' : 'dropdown-item'}
                >
                  <span className="dropdown-text">Staff Management</span>
                </NavLink>
                <NavLink 
                  to="/staff/log" 
                  onClick={closeSidebarOnMobile}
                  className={({ isActive }) => isActive ? 'dropdown-item active' : 'dropdown-item'}
                >
                  <span className="dropdown-text">Staff Activity Log</span>
                </NavLink>
              </div>
            </div>
          )}
          
          <div className="nav-section-title">FINANCIAL</div>
          {/* Finances Dropdown - Admin Only */}
          {isAdmin && (
            <div className="nav-dropdown">
              <button className="nav-dropdown-btn" onClick={toggleFinances}>
                <div className="nav-icon">
                  <FaDollarSign />
                </div>
                <span className="nav-text">Finances</span>
                <div className={`dropdown-arrow ${financesOpen ? 'open' : ''}`}>
                  <FaChevronRight />
                </div>
              </button>
              <div className={`nav-dropdown-content ${financesOpen ? 'open' : ''}`}>
                <NavLink 
                  to="/finances/view" 
                  onClick={closeSidebarOnMobile}
                  className={({ isActive }) => isActive ? 'dropdown-item active' : 'dropdown-item'}
                >
                  <span className="dropdown-text">View Finances</span>
                </NavLink>
                <NavLink 
                  to="/finances/add" 
                  onClick={closeSidebarOnMobile}
                  className={({ isActive }) => isActive ? 'dropdown-item active' : 'dropdown-item'}
                >
                  <span className="dropdown-text">Add Finance</span>
                </NavLink>
                <NavLink 
                  to="/finances/recurring" 
                  onClick={closeSidebarOnMobile}
                  className={({ isActive }) => isActive ? 'dropdown-item active' : 'dropdown-item'}
                >
                  <span className="dropdown-text">Recurring Transactions</span>
                </NavLink>
              </div>
            </div>
          )}

          {/* Add Finance for staff only */}
          {!isAdmin && (
            <NavLink 
              to="/finances/add" 
              onClick={closeSidebarOnMobile}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <div className="nav-icon">
                <FaDollarSign />
              </div>
              <span className="nav-text">Add Finance</span>
              <div className="nav-indicator"></div>
            </NavLink>
          )}

          <div className="nav-section-title">SUPPORT</div>
          {/* Help Link */}
          <NavLink 
            to="/help" 
            onClick={closeSidebarOnMobile} 
            className={({ isActive }) => isActive ? 'nav-item help-link active' : 'nav-item help-link'}
          >
            <div className="nav-icon">
              <FaQuestionCircle />
            </div>
            <span className="nav-text">Help & Guide</span>
            <div className="nav-indicator"></div>
          </NavLink>

          {/* Contact Us Dropdown */}
          <div className="nav-dropdown">
            <button className="nav-dropdown-btn" onClick={toggleContact}>
              <div className="nav-icon">
                <FaEnvelope />
              </div>
              <span className="nav-text" style={{paddingLeft:"12px"}}>Contact Us</span>
              <div className={`dropdown-arrow ${contactOpen ? 'open' : ''}`}>
                <FaChevronRight />
              </div>
            </button>
            <div className={`nav-dropdown-content contact-dropdown ${contactOpen ? 'open' : ''}`}> 
              <div className="contact-links-container">
                <a 
                  href="https://www.instagram.com/solsparrow.co?igsh=OTR4cjNld3Zvdms4" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="contact-link" 
                  title="Instagram"
                >
                  <FaInstagram />
                  <span>Instagram</span>
                </a>
                <a 
                  href="mailto:Solsparrowhq@gmail.com" 
                  className="contact-link" 
                  title="Email"
                >
                  <FaEnvelope />
                  <span>Email</span>
                </a>
              </div>
            </div>
            <div>
              <NavLink 
                to="/settings" 
                className={({ isActive }) => isActive ? 'settings-link active' : 'settings-link'} 
                onClick={closeSidebarOnMobile}
              >
                <div className="nav-icon">
                  <FaCog />
                </div>
                <span className="nav-text">Settings</span>
                <div className="nav-indicator"></div>
              </NavLink>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          
        </div>
      </div>
      
      <button className="menu-btn" onClick={handleToggle}>
        <FaBars />
      </button>
    </>
  );
};

export default Sidebar;
