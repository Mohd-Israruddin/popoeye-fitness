import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Members", path: "/members" },
  { label: "Schedule", path: "/schedule" },
  { label: "Staff", path: "/staff" },
  { label: "Settings", path: "/settings" },
  { label: "Insights", path: "/insights" },
  { label: "Inventory", path: "/inventory" }
];

function Sidebar() {
  const [financeOpen, setFinanceOpen] = useState(false);

  return (
    <nav className="sidebar">
      <div>
        <div className="logo">GymSoft</div>

        <ul className="nav-list">
          {navItems.map(({ label, path }) => (
            <li key={path} className="nav-item">
              <NavLink
                to={path}
                end
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                {label}
              </NavLink>
            </li>
          ))}

          {/* Finances Dropdown */}
          <li className="nav-item">
            <button
              className="nav-link dropdown-toggle"
              onClick={() => setFinanceOpen(!financeOpen)}
            >
              <span>Finances</span>
              {financeOpen ? (
                <FaChevronDown className="chevron-icon" />
              ) : (
                <FaChevronRight className="chevron-icon" />
              )}
            </button>

            {financeOpen && (
              <ul className="dropdown-menu">
                <li>
                  <NavLink
                    to="/finances/add"
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                  >
                    Add Finance
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/finances/view"
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                  >
                    View Finances
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </div>

      <div className="social-container">
        <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
          <FaFacebookF className="social-icon" />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
          <FaTwitter className="social-icon" />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
          <FaInstagram className="social-icon" />
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
          <FaLinkedinIn className="social-icon" />
        </a>
      </div>
    </nav>
  );
}

export default Sidebar;
