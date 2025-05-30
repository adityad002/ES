import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { FaGoogle, FaFacebook, FaApple, FaArrowLeft } from 'react-icons/fa';
import { AuthContext } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  
  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  const { login, register, isAuthenticated, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const formRef = useRef(null);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear form data and prevent caching
  useEffect(() => {
    // Clear form data on component mount
    setEmail('');
    setPassword('');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');

    // Prevent form caching
    if (formRef.current) {
      formRef.current.reset();
    }

    // Clear browser history state to prevent back-button autofill
    if (window.history.replaceState) {
      window.history.replaceState(null, null, window.location.href);
    }

    // Disable browser password saving
    const inputs = document.querySelectorAll('input[type="password"], input[type="email"]');
    inputs.forEach(input => {
      input.setAttribute('autocomplete', 'nope');
      input.setAttribute('data-form-type', 'other');
    });

    // Clear any cached form data
    return () => {
      const formElements = document.querySelectorAll('input');
      formElements.forEach(element => {
        element.value = '';
        element.defaultValue = '';
      });
    };
  }, []);

  // Clear form when switching between login and register
  useEffect(() => {
    setEmail('');
    setPassword('');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setErrorMessage('');
  }, [showRegister]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      // Validate inputs
      if (!email || !password) {
        setErrorMessage('Please enter both email and password');
        setIsLoading(false);
        return;
      }
      
      console.log('Attempting login with:', { email, password });
      const result = await login(email, password);
      
      if (!result.success) {
        setErrorMessage(result.message || 'Invalid credentials');
        console.error('Login failed:', result.message);
      } else {
        console.log('Login successful, redirecting...');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Registration form handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      // Validate inputs
      if (!regName || !regEmail || !regPassword) {
        setErrorMessage('Please fill out all required fields');
        setIsLoading(false);
        return;
      }
      
      if (regPassword !== regConfirmPassword) {
        setErrorMessage('Passwords do not match');
        setIsLoading(false);
        return;
      }
      
      if (regPassword.length < 6) {
        setErrorMessage('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }
      
      console.log('Attempting registration with:', { name: regName, email: regEmail });
      
      // Call register API
      const result = await register(regName, regEmail, regPassword);
      
      if (!result.success) {
        setErrorMessage(result.message || 'Registration failed');
        console.error('Registration failed:', result.message);
      } else {
        console.log('Registration successful, logging in...');
        // Auto-login after successful registration
        await login(regEmail, regPassword);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Social login handlers (non-functional)
  const handleSocialLogin = (provider) => {
    console.log(`Social login with ${provider} - Not implemented`);
    setErrorMessage(`${provider} login is not implemented in this demo.`);
  };

  // Toggle between login and registration
  const toggleRegisterForm = () => {
    setShowRegister(!showRegister);
    setErrorMessage('');
  };
  
  return (
    <div className="login-page">
      <Container className="login-container">
        <div className="login-form-wrapper">
          <div className="text-center mb-4">
            <img 
              src="/images/eduscheduler_logo.png" 
              alt="EduScheduler" 
              className="login-logo rounded-circle" 
            />
            {showRegister ? (
              <h1 className="login-title">Sign up and start learning</h1>
            ) : (
              <h1 className="login-title">Log in to your account</h1>
            )}
          </div>
          
          {(errorMessage || error) && (
            <Alert variant="danger">
              {errorMessage || error}
            </Alert>
          )}
          
          {showRegister ? (
            /* Registration Form */
            <>
              <Form onSubmit={handleRegister} autoComplete="off">
                {/* Hidden fake fields to prevent autofill */}
                <input type="text" style={{display: 'none'}} autoComplete="off" />
                <input type="password" style={{display: 'none'}} autoComplete="off" />
                
                <Form.Group className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Full Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    className="login-input"
                    autoComplete="nope"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck="false"
                    name="fullname-field"
                    data-form-type="other"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Control
                    type="email"
                    placeholder="Email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="login-input"
                    autoComplete="nope"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    name="register-email-field"
                    data-form-type="other"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    className="login-input"
                    autoComplete="new-password"
                    name="register-password-field"
                    data-form-type="other"
                  />
                  <Form.Text className="text-muted small">
                    At least 6 characters
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Control
                    type="password"
                    placeholder="Confirm Password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    className="login-input"
                    autoComplete="new-password"
                    name="confirm-password-field"
                    data-form-type="other"
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg" 
                    disabled={isLoading}
                    className="login-button"
                  >
                    {isLoading ? 'Processing...' : 'Sign up'}
                  </Button>
                </div>
              </Form>
              
              <div className="mt-4 text-center login-footer">
                <p>
                  <Button 
                    variant="link" 
                    className="back-to-login" 
                    onClick={toggleRegisterForm}
                  >
                    <FaArrowLeft className="me-1" /> Back to login
                  </Button>
                </p>
                <p className="terms-text small mt-2">
                  By signing up, you agree to our Terms of Use and Privacy Policy.
                </p>
              </div>
            </>
          ) : (
            /* Login Form */
            <>
              <div className="social-login-buttons">
                <Button 
                  className="social-login-button" 
                  variant="outline-dark"
                  onClick={() => handleSocialLogin('Google')}
                >
                  <FaGoogle className="social-icon" /> Continue with Google
                </Button>
                
                <Button 
                  className="social-login-button" 
                  variant="outline-dark"
                  onClick={() => handleSocialLogin('Facebook')}
                >
                  <FaFacebook className="social-icon" /> Continue with Facebook
                </Button>
                
                <Button 
                  className="social-login-button" 
                  variant="outline-dark"
                  onClick={() => handleSocialLogin('Apple')}
                >
                  <FaApple className="social-icon" /> Continue with Apple
                </Button>
              </div>
              
              <div className="divider">
                <span>or</span>
              </div>
              
              <Form onSubmit={handleSubmit} autoComplete="off" ref={formRef}>
                {/* Hidden fake fields to prevent autofill */}
                <input type="text" style={{display: 'none'}} autoComplete="off" />
                <input type="password" style={{display: 'none'}} autoComplete="off" />
                <input type="email" style={{display: 'none'}} autoComplete="off" />
                
                <Form.Group className="mb-3">
                  <Form.Control
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="login-input"
                    autoComplete="nope"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    name="email-field"
                    data-form-type="other"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="login-input"
                    autoComplete="new-password"
                    name="password-field"
                    data-form-type="other"
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg" 
                    disabled={isLoading}
                    className="login-button"
                  >
                    {isLoading ? 'Logging in...' : 'Log in'}
                  </Button>
                </div>
                
                <div className="forgot-password mt-3 text-center">
                  <a href="#forgot-password">Forgot Password?</a>
                </div>
              </Form>
              
              <div className="mt-4 text-center login-footer">
                <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); toggleRegisterForm(); }}>Sign up</a></p>
                <p className="demo-credentials">
                  <small>Demo Credentials: <span style={{userSelect: 'text', cursor: 'text'}}>admin@example.com</span> / <span style={{userSelect: 'text', cursor: 'text'}}>password</span></small>
                </p>
              </div>
            </>
          )}
        </div>
      </Container>
    </div>
  );
};

export default LoginPage; 