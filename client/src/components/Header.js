import React, { useContext } from 'react';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';
import { AuthContext } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" fixed="top" className="app-header">
      <Container fluid>
        <Navbar.Brand as={Link} to="/">
          <img
            src="/images/eduscheduler_logo.png"
            width="40"
            height="40"
            className="d-inline-block align-top me-2 rounded-circle"
            alt="EduScheduler Logo"
          />
          EduScheduler
        </Navbar.Brand>
        {!user && <Navbar.Toggle aria-controls="basic-navbar-nav" />}
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {user ? (
              <NavDropdown title={
                <span>
                  <FaUser className="me-2" />
                  {user.name}
                </span>
              } id="user-dropdown" align="end">
                <NavDropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" />
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 