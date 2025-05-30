import React, { useContext, useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { FaChalkboardTeacher, FaBook, FaCalendarAlt, FaUserCog } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { teacherService, subjectService, timetableService } from '../services/api';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    teachers: 0,
    subjects: 0,
    timetableEntries: 0
  });
  const [chartData, setChartData] = useState({
    byDay: {},
    byType: { regular: 0, lab: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Make parallel API calls for better performance
        const [teachersResponse, subjectsResponse, timetableStatsResponse] = await Promise.all([
          teacherService.getAll(),
          subjectService.getAll(),
          timetableService.getStats()
        ]);

        // Set stats data from responses
        setStats({
          teachers: teachersResponse.data.teachers?.length || 0,
          subjects: subjectsResponse.data.subjects?.length || 0,
          timetableEntries: timetableStatsResponse.data.data?.totalClasses || 0
        });

        // Set chart data
        setChartData({
          byDay: timetableStatsResponse.data.data?.byDay || {},
          byType: timetableStatsResponse.data.data?.byType || { regular: 0, lab: 0 }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');

        // Set fallback data in case of error
        setStats({
          teachers: 0,
          subjects: 0,
          timetableEntries: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Prepare data for pie chart - subject types
  const pieData = {
    labels: ['Regular Classes', 'Lab Classes'],
    datasets: [
      {
        data: [chartData.byType.regular, chartData.byType.lab],
        backgroundColor: [
          '#3498db',
          '#e74c3c',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for bar chart - classes per day
  const barData = {
    labels: Object.keys(chartData.byDay).filter(day =>
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)
    ),
    datasets: [
      {
        label: 'Classes per Day',
        data: Object.entries(chartData.byDay)
          .filter(([day]) => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day))
          .map(([_, count]) => count),
        backgroundColor: '#3498db',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Classes Distribution',
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Class Types',
      },
    },
  };

  return (
    <Container fluid className="dashboard">
      <h1 className="page-title">Dashboard</h1>
      <p className="welcome-message">Welcome, {user?.name || 'User'}!</p>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Stats Cards */}
      <Row className="stats-cards">
        <Col xs={12} sm={6} lg={3} className="mb-4">
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon bg-primary">
                <FaChalkboardTeacher />
              </div>
              <div className="stat-details">
                {isLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <h3>{stats.teachers}</h3>
                )}
                <p>Teachers</p>
              </div>
            </Card.Body>
            <Card.Footer>
              <Link to="/teachers">View All Teachers</Link>
            </Card.Footer>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mb-4">
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon bg-success">
                <FaBook />
              </div>
              <div className="stat-details">
                {isLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <h3>{stats.subjects}</h3>
                )}
                <p>Subjects</p>
              </div>
            </Card.Body>
            <Card.Footer>
              <Link to="/subjects">View All Subjects</Link>
            </Card.Footer>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mb-4">
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon bg-warning">
                <FaCalendarAlt />
              </div>
              <div className="stat-details">
                {isLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <h3>{stats.timetableEntries}</h3>
                )}
                <p>Classes Scheduled</p>
              </div>
            </Card.Body>
            <Card.Footer>
              <Link to="/timetable">View Timetable</Link>
            </Card.Footer>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mb-4">
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon bg-info">
                <FaUserCog />
              </div>
              <div className="stat-details">
                <h3>{user?.role === 'admin' ? 'Admin' : 'User'}</h3>
                <p>Your Role</p>
              </div>
            </Card.Body>
            <Card.Footer>
              <Link to="/settings">View Settings</Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>Class Types</Card.Header>
            <Card.Body>
              <div className="chart-container">
                {isLoading ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <Spinner animation="border" />
                  </div>
                ) : (
                  <Pie data={pieData} options={pieOptions} />
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>Weekly Classes</Card.Header>
            <Card.Body>
              <div className="chart-container">
                {isLoading ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <Spinner animation="border" />
                  </div>
                ) : (
                  <Bar options={barOptions} data={barData} />
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard; 