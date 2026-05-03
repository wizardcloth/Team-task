import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Signup = ({ updateAuth }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Member'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('https://team-task-three.vercel.app/api/auth/signup', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Account created successfully!');
      
      if (updateAuth) {
        updateAuth();
      }
      
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 3D Animated Background */}
      <div style={styles.animatedBg}>
        <div style={styles.floatingShape}></div>
        <div style={styles.floatingShape}></div>
        <div style={styles.floatingShape}></div>
        <div style={styles.floatingShape}></div>
        <div style={styles.floatingShape}></div>
      </div>
      
      {/* 3D Card */}
      <div style={styles.cardContainer}>
        <div style={styles.card3d}>
          <div style={styles.cardInner}>
            <div style={styles.cardFront}>
              <div style={styles.icon3d}>✨</div>
              <h2 style={styles.title}>Create Account</h2>
              <p style={styles.subtitle}>Join our community today</p>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                  <span style={styles.inputIcon}>👤</span>
                </div>
                <div style={styles.inputGroup}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                  <span style={styles.inputIcon}>📧</span>
                </div>
                <div style={styles.inputGroup}>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password (min 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                    style={styles.input}
                  />
                  <span style={styles.inputIcon}>🔒</span>
                </div>
                <div style={styles.inputGroup}>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    <option value="Member">👥 Member</option>
                    <option value="Admin">👑 Admin</option>
                  </select>
                  <span style={styles.inputIcon}>⚡</span>
                </div>
                <button type="submit" disabled={loading} style={styles.button}>
                  {loading ? (
                    <span style={styles.loader}></span>
                  ) : (
                    'Sign Up →'
                  )}
                </button>
              </form>
              <p style={styles.linkText}>
                Already have an account?{' '}
                <Link to="/login" style={styles.link}>Login here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
    fontFamily: "'Poppins', 'Segoe UI', sans-serif"
  },
  animatedBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    overflow: 'hidden',
    zIndex: 0
  },
  floatingShape: {
    position: 'absolute',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '50%',
    animation: 'floatShape 20s infinite linear'
  },
  cardContainer: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    perspective: '1000px'
  },
  card3d: {
    width: '500px',
    height: '650px',
    position: 'relative',
    transformStyle: 'preserve-3d',
    animation: 'float 3s ease-in-out infinite'
  },
  cardInner: {
    position: 'relative',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    transition: 'transform 0.8s',
    transformStyle: 'preserve-3d'
  },
  cardFront: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 25px 45px rgba(0,0,0,0.2), 0 0 30px rgba(0,0,0,0.1) inset',
    padding: '40px',
    transform: 'rotateY(0deg)',
    border: '1px solid rgba(255,255,255,0.3)'
  },
  icon3d: {
    fontSize: '60px',
    marginBottom: '20px',
    animation: 'bounce 2s ease-in-out infinite',
    display: 'inline-block'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    color: '#666',
    marginBottom: '30px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    position: 'relative'
  },
  input: {
    width: '100%',
    padding: '15px 45px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(255,255,255,0.9)',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '15px 45px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(255,255,255,0.9)',
    boxSizing: 'border-box',
    cursor: 'pointer'
  },
  inputIcon: {
    position: 'absolute',
    left: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
    opacity: 0.6
  },
  button: {
    padding: '15px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    position: 'relative',
    overflow: 'hidden'
  },
  loader: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 1s ease-in-out infinite'
  },
  linkText: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666'
  },
  link: {
    color: '#f5576c',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'color 0.3s ease'
  }
};

// Add keyframes to document
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes floatShape {
    0% {
      transform: translate(0, 0) rotate(0deg) scale(1);
      opacity: 0.8;
      width: 50px;
      height: 50px;
    }
    50% {
      transform: translate(100px, 200px) rotate(180deg) scale(2);
      opacity: 0.4;
      width: 150px;
      height: 150px;
    }
    100% {
      transform: translate(500px, 100px) rotate(360deg) scale(1);
      opacity: 0;
      width: 100px;
      height: 100px;
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px) rotateX(0deg);
    }
    50% {
      transform: translateY(-20px) rotateX(5deg);
    }
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: #f5576c;
    box-shadow: 0 0 10px rgba(245, 87, 108, 0.3);
    transform: scale(1.02);
  }
  
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(245, 87, 108, 0.3);
  }
  
  button:active {
    transform: translateY(0);
  }
  
  a:hover {
    color: #f093fb;
  }
  
  /* Generate floating shapes */
  .floatingShape:nth-child(1) {
    top: 10%;
    left: 10%;
    animation-duration: 15s;
    animation-delay: 0s;
  }
  .floatingShape:nth-child(2) {
    top: 70%;
    left: 20%;
    animation-duration: 18s;
    animation-delay: 2s;
  }
  .floatingShape:nth-child(3) {
    top: 30%;
    left: 80%;
    animation-duration: 20s;
    animation-delay: 4s;
  }
  .floatingShape:nth-child(4) {
    top: 80%;
    left: 70%;
    animation-duration: 22s;
    animation-delay: 1s;
  }
  .floatingShape:nth-child(5) {
    top: 50%;
    left: 50%;
    animation-duration: 25s;
    animation-delay: 3s;
  }
`;
document.head.appendChild(styleSheet);

export default Signup;