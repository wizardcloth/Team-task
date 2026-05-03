import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: ''
  });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        return;
      }
      
      console.log('Fetching projects...');
      const response = await axios.get('http://localhost:5000/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Fetched projects:', response.data);
      setProjects(response.data);
    } catch (error) {
      console.error('Fetch error:', error.response?.data || error.message);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.dueDate) {
      toast.error('Please fill all fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      console.log('Creating project with data:', formData);
      console.log('Current user:', user);
      
      const response = await axios.post('http://localhost:5000/api/projects', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Project created:', response.data);
      toast.success('Project created successfully!');
      
      // Reset form and close modal
      setFormData({ name: '', description: '', dueDate: '' });
      setShowModal(false);
      
      // Refresh projects list
      await fetchProjects();
      
    } catch (error) {
      console.error('Create error:', error.response?.data || error.message);
      toast.error(error.response?.data?.error || 'Failed to create project');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project? This will also delete all tasks in this project.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Project deleted successfully');
        fetchProjects();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error(error.response?.data?.error || 'Failed to delete project');
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': '#27ae60',
      'Completed': '#3498db',
      'On Hold': '#f39c12'
    };
    return colors[status] || '#95a5a6';
  };

  if (loading) {
    return <div style={styles.loading}>Loading projects...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>My Projects</h1>
        {/* Everyone can create projects - no role restriction */}
        <button 
          onClick={() => setShowModal(true)} 
          style={styles.addBtn}
        >
          + Create Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={styles.noData}>
          <p>📁 No projects found.</p>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Click the <strong>"+ Create Project"</strong> button to create your first project!
          </p>
        </div>
      ) : (
        <div style={styles.projectsGrid}>
          {projects.map(project => (
            <div key={project._id} style={styles.projectCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.projectTitle}>{project.name}</h3>
                {(user.role === 'Admin' || project.owner?._id === user._id) && (
                  <button 
                    onClick={() => handleDelete(project._id)} 
                    style={styles.deleteBtn}
                    title="Delete Project"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
              <p style={styles.description}>{project.description}</p>
              <div style={styles.cardFooter}>
                <span style={{
                  ...styles.status,
                  backgroundColor: getStatusColor(project.status)
                }}>
                  {project.status}
                </span>
                <span style={styles.dueDate}>
                  📅 Due: {format(new Date(project.dueDate), 'MMM dd, yyyy')}
                </span>
              </div>
              <div style={styles.teamInfo}>
                <strong>👤 Owner:</strong> {project.owner?.name || 'You'}
              </div>
              <div style={styles.teamInfo}>
                <strong>👥 Team Members:</strong> {project.teamMembers?.length || 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Create New Project</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Project Name (e.g., ARMS, CMMS, Website)"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
              <textarea
                name="description"
                placeholder="Project Description"
                value={formData.description}
                onChange={handleInputChange}
                required
                style={styles.textarea}
                rows="4"
              />
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.submitBtn}>
                  Create Project
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  addBtn: {
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'background-color 0.2s'
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem'
  },
  projectCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  projectTitle: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '1.25rem'
  },
  description: {
    color: '#666',
    marginBottom: '1rem',
    lineHeight: '1.5'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  status: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 'bold'
  },
  dueDate: {
    color: '#e74c3c',
    fontSize: '0.875rem'
  },
  teamInfo: {
    fontSize: '0.875rem',
    color: '#666',
    marginTop: '0.5rem'
  },
  deleteBtn: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'background-color 0.2s'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTitle: {
    marginBottom: '1.5rem',
    color: '#2c3e50'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    minHeight: '100px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  modalButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '1rem'
  },
  submitBtn: {
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 'bold'
  },
  cancelBtn: {
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem'
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.2rem',
    color: '#666'
  },
  noData: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  }
};

export default Projects;