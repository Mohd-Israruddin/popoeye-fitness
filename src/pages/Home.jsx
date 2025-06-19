import React from "react";
import "./Home.css";

function Home() {
  return (
    <div className="home-container">
      <h1 className="home-title">Dashboard</h1>

      <div className="cards-container">
        <div className="card total-members">
          <h2>Total Members</h2>
          <p className="card-number">120</p>
        </div>
        <div className="card active-subscriptions">
          <h2>Active Subscriptions</h2>
          <p className="card-number">87</p>
        </div>
        <div className="card pending-payments">
          <h2>Pending Payments</h2>
          <p className="card-number">15</p>
        </div>
      </div>

      <section className="recent-activity">
        <h2>Recent Activity</h2>
        <ul>
          <li>John Doe joined the gym</li>
          <li>Payment received from Jane Smith</li>
          <li>New Yoga class schedule added</li>
        </ul>
      </section>
    </div>
  );
}

export default Home;
