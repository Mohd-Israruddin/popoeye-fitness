// SettingsPage.jsx
import React from "react";
import ProfileSettings from "../assets/components/Settings/ProfileSettings";
import GymPreferences from "../assets/components/Settings/GymPreferences";
import SubscriptionDetails from "../assets/components/Settings/SubscriptionDetails";
import ThemeSettings from "../assets/components/Settings/ThemeSettings";
import PrivacySettings from "../assets/components/Settings/PrivacySettings";
import ResetPassKey from "../assets/components/Settings/ResetPassKey";
import "./SettingsPage.css";
const SettingsPage = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Settings</h1>
      <div style={{ marginTop: "20px" }}>
        <ProfileSettings />
        <GymPreferences />
        <SubscriptionDetails />
        <ThemeSettings />
        <PrivacySettings />
        <ResetPassKey />
      </div>
    </div>
  );
};


export default SettingsPage;