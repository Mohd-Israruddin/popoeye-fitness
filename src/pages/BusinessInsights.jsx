import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Line, Pie } from "react-chartjs-2";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import "./BusinessInsights.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { label } from "framer-motion/client";
import { color } from "chart.js/helpers";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const userRole = "admin";

const BusinessInsights = () => {
  const navigate = useNavigate();
  const [expectedProfit, setExpectedProfit] = useState(80000);
  const [inputMode, setInputMode] = useState(true);

  useEffect(() => {
    if (userRole !== "admin") {
      navigate("/",{replace: true });
    }
  }, [navigate]);

  if (userRole !== "admin") return null;

  const revenue = 65000;
  const expense = 37000;
  const actualProfit = revenue - expense;

  const revenueData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Income",
        data: [50000, 60000, 55000, 70000, 65000],
        backgroundColor: "#4caf50",
      },
      {
        label: "Expense",
        data: [30000, 35000, 32000, 40000, 37000],
        backgroundColor: "#f44336",
      },
    ],
  };

  const profitCurveData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Expected Profit",
        data: [
          expectedProfit - 10000,
          expectedProfit - 5000,
          expectedProfit,
          expectedProfit + 5000,
          expectedProfit + 10000,
        ],
        borderColor: "#2196f3",
        backgroundColor: "rgba(33, 150, 243, 0.2)",
        fill: true,
      },
      {
        label: "Actual Profit",
        data: [20000, 25000, 23000, 30000, actualProfit],
        borderColor: "#4caf50",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        fill: true,
      },
    ],
  };

  const memberGraphData = {
    labels: ["Active", "Inactive", "Expired"],
    datasets: [
      {
        data: [145, 25, 10],
        backgroundColor: ["#4caf50", "#ff9800", "#f44336"],
      },
    ],
  };

  const expenseCategoryData = {
    labels: ["Rent", "Electricity", "Equipment", "Salaries", "Marketing"],
    datasets: [
      {
        data: [15000, 5000, 7000, 10000, 4000],
        backgroundColor: [
          "#3f51b5",
          "#2196f3",
          "#4caf50",
          "#ff5722",
          "#9c27b0",
        ],
      },
    ],
  };

  const tips = [
    "Offer referral discounts to gain new members.",
    "Reduce electricity usage during non-peak hours.",
    "Use social media to promote gym deals.",
    "Review underused equipment to lower costs.",
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay },
    }),
  };

  if (!inputMode && (isNaN(expectedProfit) || expectedProfit <= 0)) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Please enter a valid expected profit (greater than 0).</p>
        <button onClick={() => setInputMode(true)}>Back</button>
      </div>
    );
  }

  const chartOptions = {
    animation: {
      duration: 1500,
      easing: "easeOutQuart",
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#E3E3E0",
        }
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <motion.div
      className="insights-container"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <motion.h2 variants={fadeIn}>Business Insights</motion.h2>

      {inputMode ? (
        <motion.div className="expected-profit-input" variants={fadeIn}>
          <label>Enter Expected Monthly Profit (₹): </label>
          <input
            type="number"
            min="0"
            value={expectedProfit}
            onChange={(e) => setExpectedProfit(Number(e.target.value))}
          />
          <button onClick={() => setInputMode(false)}>Submit</button>
        </motion.div>
      ) : (
        <>
          <motion.div className="stats-cards" variants={fadeIn} custom={0.2}>
            <div className="card">
              Total Members: <CountUp end={180} duration={2} separator="," />
            </div>
            <div className="card">
              Monthly Revenue: ₹
              <CountUp end={revenue} duration={2} separator="," />
            </div>
            <div className="card">
              Monthly Expense: ₹
              <CountUp end={expense} duration={2} separator="," />
            </div>
            <div className="card">
              Active Plans: <CountUp end={145} duration={2} separator="," />
            </div>
          </motion.div>

          <motion.div className="chart-section" variants={fadeIn} custom={0.3}>
            <h3>Income vs Expense</h3>
            <div style={{ height: 550 }}>
              <Bar data={revenueData} options={chartOptions} />
            </div>
          </motion.div>

          <motion.div className="chart-section" variants={fadeIn} custom={0.4}>
            <h3>Profit Curve</h3>
            <div style={{ height: 550 }}>
              <Line data={profitCurveData} options={chartOptions} />
            </div>
          </motion.div>

          <motion.div className="chart-grid" variants={fadeIn} custom={0.5}>
            <div className="chart-box" >
              <h3>Member Distribution</h3>
              <Pie data={memberGraphData} options={chartOptions} />
            </div>
            <div className="chart-box" >
              <h3>Expense Categories</h3>
              <Pie data={expenseCategoryData} options={chartOptions} />
            </div>
          </motion.div>

          <motion.div className="tips-section" variants={fadeIn} custom={0.6}>
            <h3>Business Growth Tips</h3>
            <ul>
              {tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </motion.div>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              onClick={() => setInputMode(true)}
              style={{
                padding: "10px 18px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Change Expected Profit
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default BusinessInsights;
