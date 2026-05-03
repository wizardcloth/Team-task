import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [projectsRes, tasksRes] = await Promise.all([
        axios.get('https://team-task-three.vercel.app/api/projects', config),
        axios.get('https://team-task-three.vercel.app/api/tasks', config)
      ]);
      
      const tasks = tasksRes.data;
      const overdue = tasks.filter(task => task.status === 'Overdue');
      const completed = tasks.filter(task => task.status === 'Completed');
      
      setStats({
        totalProjects: projectsRes.data.length,
        totalTasks: tasks.length,
        completedTasks: completed.length,
        overdueTasks: overdue.length
      });
      
      setRecentTasks(tasks.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#f39c12',
      'In Progress': '#3498db',
      'Completed': '#27ae60',
      'Overdue': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Dashboard</h1>
      
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>Total Projects</h3>
          <p style={styles.statNumber}>{stats.totalProjects}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Total Tasks</h3>
          <p style={styles.statNumber}>{stats.totalTasks}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Completed Tasks</h3>
          <p style={styles.statNumber}>{stats.completedTasks}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Overdue Tasks</h3>
          <p style={{...styles.statNumber, color: '#e74c3c'}}>{stats.overdueTasks}</p>
        </div>
      </div>
      
      <div style={styles.recentTasks}>
        <h2>Recent Tasks</h2>
        {recentTasks.length === 0 ? (
          <p>No tasks assigned yet</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Project</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map(task => (
                  <tr key={task._id} style={styles.tableRow}>
                    <td style={styles.td}>{task.title}</td>
                    <td style={styles.td}>{task.project?.name || 'N/A'}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(task.status)
                      }}>
                        {task.status}
                      </span>
                    </td>
                    <td style={styles.td}>{format(new Date(task.dueDate), 'MMM dd, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '2rem auto',
    padding: '0 1rem'
  },
  header: {
    marginBottom: '2rem',
    color: '#2c3e50'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginTop: '0.5rem',
    color: '#3498db'
  },
  recentTasks: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  tableContainer: {
    overflowX: 'auto',
    marginTop: '1rem'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '500px'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#495057',
    borderBottom: '2px solid #dee2e6'
  },
  td: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #dee2e6',
    verticalAlign: 'middle'
  },
  tableRow: {
    transition: 'background-color 0.2s',
    cursor: 'pointer'
  },
  statusBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    color: 'white',
    fontSize: '0.875rem',
    display: 'inline-block',
    minWidth: '90px',
    textAlign: 'center'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem'
  }
};

// Add hover effect
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  tr:hover {
    background-color: #f8f9fa;
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;