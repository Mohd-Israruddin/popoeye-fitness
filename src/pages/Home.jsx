import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { FaUsers, FaDollarSign, FaUserTie, FaCalendarAlt, FaClipboardList, FaPlusCircle, FaClock } from 'react-icons/fa';
import CountUp from 'react-countup';
import { useNavigate } from 'react-router-dom';
import api from '../service/api';
import './Home.css';
import MemberTable from '../assets/components/MemberTable';
import FinancesWidget from '../assets/components/widgets/FinancesWidget';
import StaffWidget from '../assets/components/widgets/StaffWidget';
import EnquiriesWidget from '../assets/components/widgets/EnquiriesWidget';
import ExpiringMembersWidget from '../assets/components/widgets/ExpiringMembersWidget';
import DuePaymentsWidget from '../assets/components/widgets/DuePaymentsWidget';
import PersonalTrainingWidget from '../assets/components/widgets/PersonalTrainingWidget';
import AlertsWidget from '../assets/components/widgets/AlertsWidget';
import NotesWidget from '../assets/components/widgets/NotesWidget';
import ProfitLossWidget from '../assets/components/widgets/ProfitLossWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Mock alerts data
const mockAlerts = [
  {
    type: 'danger',
    title: 'Low Stock Alert',
    message: 'Protein powder running low (5 units left)',
    source: 'Inventory Management System',
  },
  {
    type: 'warning',
    title: 'Membership Expiring',
    message: '3 members expiring in next 7 days',
    source: 'Member Management System',
  },
  {
    type: 'success',
    title: 'Revenue Milestone',
    message: 'You crossed ₹40,000 this month!',
    source: 'Finance System',
  },
];

function formatTime(timeString) {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const Home = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    prevMonthMembers: 0,
    monthlyRevenue: 0,
    prevMonthRevenue: 0,
    activeStaff: 0,
    todaysClasses: 0,
    prevMonthClasses: 0,
    membersIncrease: 0,
    revenueIncrease: 0,
    classesIncrease: 0,
  });
  const [schedule, setSchedule] = useState([]);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [loading, setLoading] = useState(true);
  const [layouts, setLayouts] = useState({ lg: [] });
  const [widgets, setWidgets] = useState([]);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // Create widget components for additional dashboard widgets
  const availableWidgets = React.useMemo(() => [
    { id: 'alerts', name: 'Alerts', component: <AlertsWidget />, defaultLayout: { w: 1, h: 2, x: 0, y: 0, minW: 1, minH: 2 } },
    { id: 'expiringMembers', name: 'Members Expiring Soon', component: <ExpiringMembersWidget />, defaultLayout: { w: 1, h: 2, x: 0, y: 2, minW: 1, minH: 2 } },
    { id: 'duePayments', name: 'Due Payments', component: <DuePaymentsWidget />, defaultLayout: { w: 1, h: 2, x: 1, y: 2, minW: 1, minH: 2 } },
    { id: 'personalTraining', name: 'Personal Training', component: <PersonalTrainingWidget />, defaultLayout: { w: 1, h: 2, x: 0, y: 4, minW: 1, minH: 2 } },
    { id: 'staff', name: 'Staff Overview', component: <StaffWidget />, defaultLayout: { w: 1, h: 2, x: 1, y: 4, minW: 1, minH: 2 } },
    { id: 'notes', name: 'Notes', component: <NotesWidget />, defaultLayout: { w: 1, h: 2, x: 0, y: 6, minW: 1, minH: 2 } },
    { id: 'enquiries', name: 'Recent Enquiries', component: <EnquiriesWidget />, defaultLayout: { w: 1, h: 2, x: 1, y: 6, minW: 1, minH: 2 } },
  ], []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (isInitialized) return;
    
    try {
      console.log('Fetching dashboard data...');
      const [statsRes, scheduleRes, layoutRes] = await Promise.all([
        api.get('/insights/key-stats'),
        api.get('/insights/todays-schedule'),
        api.get('/settings/dashboard-layout'),
      ]);
      
      console.log('Stats response:', statsRes.data);
      console.log('Schedule response:', scheduleRes.data);
      
      setStats(statsRes.data);
      setSchedule(scheduleRes.data);
      setBackendAvailable(true);
      
      let savedLayouts;
      try {
        savedLayouts = layoutRes.data && typeof layoutRes.data === 'string' ? JSON.parse(layoutRes.data) : layoutRes.data;
        if (typeof savedLayouts !== 'object' || savedLayouts === null) {
          savedLayouts = { lg: [] };
        }
      } catch(e) {
        console.error("Error parsing layout JSON:", e);
        savedLayouts = { lg: [] };
      }

      if (savedLayouts && savedLayouts.lg && savedLayouts.lg.length > 0) {
        const duePaymentsWidget = availableWidgets.find(w => w.id === 'duePayments');
        if (duePaymentsWidget && !savedLayouts.lg.some(l => l.i === 'duePayments')) {
          savedLayouts.lg.push({ ...duePaymentsWidget.defaultLayout, i: 'duePayments' });
        }
        const personalTrainingWidget = availableWidgets.find(w => w.id === 'personalTraining');
        if (personalTrainingWidget && !savedLayouts.lg.some(l => l.i === 'personalTraining')) {
          savedLayouts.lg.push({ ...personalTrainingWidget.defaultLayout, i: 'personalTraining' });
        }
        setLayouts(savedLayouts);
        const activeWidgets = savedLayouts.lg
          .map(layoutItem => availableWidgets.find(w => w.id === layoutItem.i))
          .filter(Boolean);
        setWidgets(activeWidgets);
      } else {
        const defaultWidgets = availableWidgets.filter(w => ['alerts', 'expiringMembers', 'duePayments', 'personalTraining', 'staff', 'notes', 'enquiries'].includes(w.id));
        setWidgets(defaultWidgets);
        const defaultLayouts = { lg: defaultWidgets.map(w => ({ ...w.defaultLayout, i: w.id })) };
        setLayouts(defaultLayouts);
      }
      setIsInitialized(true);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setBackendAvailable(false);
      
      // Fallback mock data
      const mockStats = {
        totalMembers: 25,
        prevMonthMembers: 20,
        monthlyRevenue: 45000,
        prevMonthRevenue: 38000,
        activeStaff: 8,
        todaysClasses: 3,
        prevMonthClasses: 2,
        membersIncrease: 25,
        revenueIncrease: 18,
        classesIncrease: 50,
      };
      const mockSchedule = [
        { class_name: 'Morning Yoga', instructor: 'Sarah Johnson', start_time: '2024-01-15T06:00:00', end_time: '2024-01-15T07:00:00', slots: '12/15' },
        { class_name: 'HIIT Training', instructor: 'Mike Wilson', start_time: '2024-01-15T08:00:00', end_time: '2024-01-15T09:00:00', slots: '8/10' },
        { class_name: 'Zumba Dance', instructor: 'Lisa Garcia', start_time: '2024-01-15T10:00:00', end_time: '2024-01-15T11:00:00', slots: '20/25' },
      ];
      
      setStats(mockStats);
      setSchedule(mockSchedule);
      
      const defaultWidgets = availableWidgets.filter(w => ['alerts', 'expiringMembers', 'duePayments', 'personalTraining', 'staff', 'notes', 'enquiries'].includes(w.id));
      setWidgets(defaultWidgets);
      const defaultLayouts = { lg: defaultWidgets.map(w => ({ ...w.defaultLayout, i: w.id })) };
      setLayouts(defaultLayouts);
      setIsInitialized(true);
      setLoading(false);
    }
  }, [availableWidgets, isInitialized]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onLayoutChange = useCallback(async (layout, allLayouts) => {
    if (!allLayouts.lg || allLayouts.lg.length === 0) return;
    
    if(JSON.stringify(allLayouts) === JSON.stringify(layouts)) return;

    setLayouts(allLayouts);
    try {
      await api.post('/settings/dashboard-layout', { layout: allLayouts });
    } catch (error) {
      console.error("Failed to save layout:", error);
    }
  },[layouts]);

  const addWidget = useCallback((widgetId) => {
    const widgetToAdd = availableWidgets.find(w => w.id === widgetId);
    if (widgetToAdd && !widgets.find(w => w.id === widgetId)) {
      const newWidgets = [...widgets, widgetToAdd];
      setWidgets(newWidgets);
      
      const newLayoutItem = { ...widgetToAdd.defaultLayout, i: widgetId, x: (widgets.length * 2) % (layouts.lg ? layouts.lg.length : 2) , y: Infinity };
      const newLayouts = { lg: [...layouts.lg, newLayoutItem] };
      setLayouts(newLayouts);
      onLayoutChange(newLayouts.lg, newLayouts);
    }
  }, [availableWidgets, widgets, layouts, onLayoutChange]);

  const removeWidget = useCallback((widgetId) => {
    setWidgets(prevWidgets => prevWidgets.filter(w => w.id !== widgetId));
    setLayouts(prevLayouts => {
      const newLayouts = { lg: prevLayouts.lg.filter(l => l.i !== widgetId) };
      onLayoutChange(newLayouts.lg, newLayouts);
      return newLayouts;
    });
  }, [onLayoutChange]);

  // Summary cards config
  const summaryCards = [
    {
      label: 'Total Members',
      icon: <FaUsers />,
      key: 'totalMembers',
      color: 'users',
      sub: `${stats.membersIncrease >= 0 ? '+' : ''}${stats.membersIncrease}% from last month`,
      subColor: '#28B295',
      onClick: () => navigate('/members'),
    },
    {
      label: 'Active Staff',
      icon: <FaUserTie />,
      key: 'activeStaff',
      color: 'staff',
      sub: '2 new this week',
      subColor: '#28B295',
      onClick: () => navigate('/staff'),
    },
    {
      label: "Today's Classes",
      icon: <FaCalendarAlt />,
      key: 'todaysClasses',
      color: 'classes',
      sub: `${stats.classesIncrease >= 0 ? '+' : ''}${stats.classesIncrease}% from last month`,
      subColor: '#28B295',
      onClick: () => navigate('/schedule'),
    },
  ];

  // Quick actions
  const quickActions = [
    { label: 'Add Member', icon: <FaUsers />, path: '/members' },
    { label: 'Add Finance', icon: <FaPlusCircle />, path: '/finances/add' },
    { label: 'Full Schedule', icon: <FaCalendarAlt />, path: '/schedule' },
    { label: 'Enquiries', icon: <FaClipboardList />, path: '/enquiries' },
  ];

  // Alerts box click handlers
  const handleAlertClick = (alert) => {
    if (alert.type === 'danger') {
      navigate('/settings');
    } else if (alert.type === 'warning') {
      navigate('/members');
    } else if (alert.type === 'success') {
      navigate('/finances/view');
    }
  };

  return (
    <div className="home-container">
      {!backendAvailable && (
        <div className="backend-warning">
          <p>⚠️ Backend server is not available. Showing mock data for demonstration.</p>
          <p>To see real data, please start the backend server.</p>
        </div>
      )}
      
      {/* Header */}
      <div className="home-header">
        <div className="header-content">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">
              Welcome back! Your gym's mission control. Customize your view below.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        {summaryCards.map(card => (
          <div
            className={`home-stat-card ${card.color}`}
            key={card.key}
            onClick={card.onClick}
          >
            <div className="stat-card-icon">
              {card.icon}
            </div>
            <div className="stat-info">
              <p className="stat-label">{card.label}</p>
              <span className="stat-value">
                {card.prefix || ''}
                {loading ? <span className="loading-text">...</span> : <CountUp end={stats[card.key] || 0} duration={1.2} separator="," />}
              </span>
              <div className="stat-sub" style={{ color: card.subColor }}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions - single row */}
      <div className="quick-actions-container">
        <div className="quick-actions-title">
          Quick Actions
        </div>
        <div className="dashboard-quick-actions">
          {quickActions.map(action => (
            <button
              key={action.label}
              className="dashboard-quick-link-btn"
              onClick={() => navigate(action.path)}
            >
              <span className="quick-action-icon">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Draggable Widgets Grid Only */}
      {isInitialized && (
        <>
          <div className="widget-controls">
            <p>Add additional widgets:</p>
            {availableWidgets.map(w => (
              !widgets.find(active => active.id === w.id) &&
              <button key={w.id} onClick={() => addWidget(w.id)}>{w.name}</button>
            ))}
          </div>

          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={onLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 2, md: 2, sm: 1, xs: 1, xxs: 1 }}
            rowHeight={200}
            draggableHandle=".widget-title"
            key={JSON.stringify(layouts)}
          >
            {widgets.map(widget => (
              <div key={widget.id} className="widget">
                <div className="widget-header">
                  <div className="widget-title">
                    <h3>{widget.name}</h3>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeWidget(widget.id);
                    }} 
                    className="remove-widget-btn"
                    type="button"
                    title="Remove widget"
                  >
                    &times;
                  </button>
                </div>
                {widget.component}
              </div>
            ))}
          </ResponsiveGridLayout>
        </>
      )}
    </div>
  );
};

export default Home;
