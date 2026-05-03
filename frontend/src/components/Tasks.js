import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Fix: Get user and ensure _id exists
  const getCurrentUser = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // If _id is missing but id exists, copy it
    if (!user._id && user.id) {
      user._id = user.id;
    }
    
    // If still missing _id, try to get from token
    if (!user._id) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.userId) {
            user._id = payload.userId;
            user.id = payload.userId;
            // Save the fixed user back to localStorage
            localStorage.setItem('user', JSON.stringify(user));
            console.log('Fixed user object with ID from token:', user._id);
          }
        } catch (e) {
          console.error('Failed to parse token:', e);
        }
      }
    }
    
    return user;
  };
  
  const currentUser = getCurrentUser();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    assignedTo: '',
    dueDate: '',
    priority: 'Medium'
  });

  useEffect(() => {
    console.log('Current user loaded:', currentUser);
    console.log('User ID:', currentUser._id);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [tasksRes, projectsRes] = await Promise.all([
        axios.get('https://team-task-three.vercel.app/api/tasks', config),
        axios.get('https://team-task-three.vercel.app/api/projects', config)
      ]);
      
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      
      // Auto-select first project
      if (projectsRes.data.length > 0 && !formData.project) {
        setFormData(prev => ({ 
          ...prev, 
          project: projectsRes.data[0]._id 
        }));
      }
      
      // Only fetch users if Admin
      if (currentUser.role === 'Admin') {
        const usersRes = await axios.get('https://team-task-three.vercel.app/api/users', config);
        setUsers(usersRes.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.project) {
      toast.error('Please select a project');
      return;
    }
    
    if (!formData.title) {
      toast.error('Please enter task title');
      return;
    }
    
    if (!formData.dueDate) {
      toast.error('Please select due date');
      return;
    }
    
    // Build task data
    let taskData = {
      title: formData.title,
      description: formData.description,
      project: formData.project,
      dueDate: formData.dueDate,
      priority: formData.priority
    };
    
    // Handle assignment based on role
    if (currentUser.role === 'Admin') {
      if (!formData.assignedTo) {
        toast.error('Please select a user to assign this task to');
        return;
      }
      taskData.assignedTo = formData.assignedTo;
    } else {
      // MEMBER: Get user ID with fallback
      let userId = currentUser._id;
      
      // If still no user ID, try to get from token again
      if (!userId) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId;
            console.log('Got user ID from token:', userId);
          } catch (e) {
            console.error('Failed to get ID from token:', e);
          }
        }
      }
      
      if (!userId) {
        toast.error('User ID not found. Please logout and login again.');
        console.error('No user ID available. Current user:', currentUser);
        return;
      }
      
      taskData.assignedTo = userId;
      console.log('Member creating task for self, ID:', userId);
    }
    
    console.log('Submitting task:', taskData);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://team-task-three.vercel.app/api/tasks', taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Task created:', response.data);
      toast.success('Task created successfully!');
      setShowModal(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        project: projects.length > 0 ? projects[0]._id : '',
        assignedTo: '',
        dueDate: '',
        priority: 'Medium'
      });
      
      fetchData();
    } catch (error) {
      console.error('Create error:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to create task');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`https://team-task-three.vercel.app/api/tasks/${taskId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Task status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`https://team-task-three.vercel.app/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Task deleted successfully');
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to delete task');
      }
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': '#27ae60',
      'Medium': '#3498db',
      'High': '#f39c12',
      'Urgent': '#e74c3c'
    };
    return colors[priority] || '#95a5a6';
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

  const canDeleteTask = (task) => {
    const userId = currentUser._id;
    if (currentUser.role === 'Admin') return true;
    if (task.assignedBy?._id === userId) return true;
    if (task.assignedTo?._id === userId) return true;
    return false;
  };

  if (loading) return <div style={styles.loading}>Loading tasks...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>My Tasks</h1>
        <button onClick={() => setShowModal(true)} style={styles.addBtn}>
          + Create Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div style={styles.noData}>
          <p>📋 No tasks assigned yet.</p>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Click the <strong>"+ Create Task"</strong> button to create your first task!
          </p>
        </div>
      ) : (
        <div style={styles.tasksList}>
          {tasks.map(task => (
            <div key={task._id} style={styles.taskCard}>
              <div style={styles.taskHeader}>
                <h3 style={styles.taskTitle}>{task.title}</h3>
                <div style={styles.taskActions}>
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                    style={{
                      ...styles.statusSelect,
                      backgroundColor: getStatusColor(task.status)
                    }}
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="In Progress">🔄 In Progress</option>
                    <option value="Completed">✅ Completed</option>
                  </select>
                  {canDeleteTask(task) && (
                    <button 
                      onClick={() => handleDeleteTask(task._id)} 
                      style={styles.deleteTaskBtn}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
              <p style={styles.description}>{task.description}</p>
              <div style={styles.taskDetails}>
                <span>
                  <strong>📁 Project:</strong> {task.project?.name || 'N/A'}
                </span>
                <span>
                  <strong>👤 Assigned To:</strong> {task.assignedTo?.name || 'N/A'}
                </span>
                <span>
                  <strong>⚡ Priority:</strong>{' '}
                  <span style={{
                    ...styles.priorityBadge,
                    backgroundColor: getPriorityColor(task.priority)
                  }}>
                    {task.priority}
                  </span>
                </span>
                <span>
                  <strong>📅 Due Date:</strong>{' '}
                  <span style={task.status === 'Overdue' ? styles.overdue : {}}>
                    {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Create New Task</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Task Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                style={styles.input}
              />
              <textarea
                placeholder="Description *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                style={styles.textarea}
              />
              
              {/* Project Selection */}
              <div style={styles.projectSection}>
                <label style={styles.label}>
                  Select Project: <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                {projects.length === 0 ? (
                  <div style={styles.noProjectsWarning}>
                    <p>⚠️ No projects available!</p>
                    <p style={{ fontSize: '12px', marginTop: '5px' }}>
                      Please go to <strong>Projects</strong> page and create a project first.
                    </p>
                  </div>
                ) : (
                  <select
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    required
                    style={styles.input}
                  >
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name} ({project.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* Assignment Section - Fixed for Members */}
              {currentUser.role === 'Admin' ? (
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  required
                  style={styles.input}
                >
                  <option value="">Assign To *</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.name} ({user.role})</option>
                  ))}
                </select>
              ) : (
                <div style={styles.disabledInput}>
                  <label style={styles.label}>Assigned To:</label>
                  <input
                    type="text"
                    value={`${currentUser.name || 'You'} (Task will be assigned to you)`}
                    disabled
                    style={{...styles.input, backgroundColor: '#e8f5e9', fontWeight: 'bold', color: '#2e7d32'}}
                  />
                  <small style={styles.note}>✓ Tasks are automatically assigned to you</small>
                </div>
              )}
              
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                style={styles.input}
              >
                <option value="Low">🟢 Low Priority</option>
                <option value="Medium">🔵 Medium Priority</option>
                <option value="High">🟠 High Priority</option>
                <option value="Urgent">🔴 Urgent Priority</option>
              </select>
              
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                style={styles.input}
                min={new Date().toISOString().split('T')[0]}
              />
              
              <div style={styles.modalButtons}>
                <button 
                  type="submit" 
                  style={styles.submitBtn}
                >
                  Create Task
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
    fontWeight: 'bold'
  },
  tasksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  taskCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  taskTitle: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '1.2rem'
  },
  taskActions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  description: {
    color: '#666',
    marginBottom: '1rem',
    lineHeight: '1.5'
  },
  taskDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.75rem',
    fontSize: '0.875rem'
  },
  statusSelect: {
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  deleteTaskBtn: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem'
  },
  priorityBadge: {
    padding: '0.2rem 0.6rem',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  },
  overdue: {
    color: '#e74c3c',
    fontWeight: 'bold'
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
    maxWidth: '550px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTitle: {
    marginBottom: '1.5rem',
    color: '#2c3e50',
    borderBottom: '2px solid #3498db',
    paddingBottom: '0.5rem'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    boxSizing: 'border-box'
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
  projectSection: {
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  noProjectsWarning: {
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    color: '#856404'
  },
  disabledInput: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#333',
    fontWeight: 'bold'
  },
  note: {
    display: 'block',
    marginTop: '0.25rem',
    fontSize: '0.75rem',
    color: '#27ae60'
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

export default Tasks;