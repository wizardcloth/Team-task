import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Login = ({ updateAuth }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Login successful!');
      
      if (updateAuth) {
        updateAuth();
      }
      
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.animatedBg}>
        <div style={styles.cube}></div>
        <div style={styles.cube}></div>
        <div style={styles.cube}></div>
        <div style={styles.cube}></div>
        <div style={styles.cube}></div>
        <div style={styles.cube}></div>
      </div>
      
      {/* 3D Card */}
      <div style={styles.cardContainer}>
        <div style={styles.card3d}>
          <div style={styles.cardInner}>
            <div style={styles.cardFront}>
              <div style={styles.icon3d}>🚀</div>
              <h2 style={styles.title}>Welcome Back</h2>
              <p style={styles.subtitle}>Login to your account</p>
              <form onSubmit={handleSubmit} style={styles.form}>
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
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                  <span style={styles.inputIcon}>🔒</span>
                </div>
                <button type="submit" disabled={loading} style={styles.button}>
                  {loading ? (
                    <span style={styles.loader}></span>
                  ) : (
                    'Login →'
                  )}
                </button>
              </form>
              <p style={styles.linkText}>
                Don't have an account?{' '}
                <Link to="/signup" style={styles.link}>Create Account</Link>
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    overflow: 'hidden',
    zIndex: 0
  },
  cube: {
    position: 'absolute',
    top: '80vh',
    left: '45vw',
    width: '10px',
    height: '10px',
    border: 'solid 1px rgba(255,255,255,0.3)',
    fontSize: '24px',
    animation: 'cubeAnimation 25s infinite linear',
    transform: 'scale(0)'
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
    width: '450px',
    height: '550px',
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'color 0.3s ease'
  }
};

// Add keyframes to document
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes cubeAnimation {
    0% {
      transform: scale(0) rotate(0deg);
      opacity: 1;
      bottom: -50px;
      left: -50px;
    }
    100% {
      transform: scale(20) rotate(1000deg);
      opacity: 0;
      bottom: 150%;
      left: 150%;
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
  
  input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
    transform: scale(1.02);
  }
  
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }
  
  button:active {
    transform: translateY(0);
  }
  
  a:hover {
    color: #764ba2;
  }
  
  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  
  .cardFront {
    animation: gradientShift 3s ease infinite;
  }
`;
document.head.appendChild(styleSheet);

export default Login;