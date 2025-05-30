import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <Container fluid className="not-found-page">
      <Row className="justify-content-center align-items-center">
        <Col md={8} lg={6} className="text-center">
          <div className="error-code">404</div>
          <h1 className="error-title">Page Not Found</h1>
          <p className="error-message">
            The page you are looking for might have been removed, had its name changed,
            or is temporarily unavailable.
          </p>
          <Button as={Link} to="/" variant="primary" className="mt-4">
            <FaArrowLeft className="me-2" />
            Back to Dashboard
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage; 