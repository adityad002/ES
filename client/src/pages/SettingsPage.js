import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { settingsService } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import './SettingsPage.css';

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    periodsPerDay: 8,
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    startTime: "09:00:00",
    endTime: "16:00:00",
    lunchBreak: { enabled: true, period: 4, duration: 30 },
    shortBreaks: [],
    classDuration: 50,
    academic_year: new Date().getFullYear()
  });
  // State for new short break
  const [newBreak, setNewBreak] = useState({
    startTime: "10:45:00",
    duration: 10
  });
  const [editingBreakIndex, setEditingBreakIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  // Add error state
  const [error, setError] = useState(null);

  const weekdays = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];

  // Fetch settings data
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await settingsService.get();
        if (response.data.success && response.data.settings) {
          // Ensure shortBreaks is initialized as an array
          const settingsData = response.data.settings;
          if (!settingsData.shortBreaks) {
            settingsData.shortBreaks = [];
          }
          setSettings(settingsData);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    setHasChanges(true);
    
    if (type === 'number') {
      setSettings({
        ...settings,
        [name]: parseInt(value)
      });
    } else if (type === 'time') {
      setSettings({
        ...settings,
        [name]: value + ':00' // Add seconds to the time
      });
    } else {
      setSettings({
        ...settings,
        [name]: value
      });
    }
  };

  // Handle working days checkboxes
  const handleDayChange = (day, checked) => {
    setHasChanges(true);
    
    if (checked) {
      setSettings({
        ...settings,
        workingDays: [...settings.workingDays, day].sort((a, b) => 
          weekdays.indexOf(a) - weekdays.indexOf(b)
        )
      });
    } else {
      setSettings({
        ...settings,
        workingDays: settings.workingDays.filter(d => d !== day)
      });
    }
  };

  // Handle lunch break toggle
  const handleLunchBreakChange = (enabled) => {
    setHasChanges(true);
    setSettings({
      ...settings,
      lunchBreak: {
        ...settings.lunchBreak,
        enabled
      }
    });
  };

  // Handle lunch break settings
  const handleLunchBreakSettingChange = (setting, value) => {
    setHasChanges(true);
    setSettings({
      ...settings,
      lunchBreak: {
        ...settings.lunchBreak,
        [setting]: parseInt(value)
      }
    });
  };
  
  // Handle new break input changes
  const handleNewBreakChange = (e) => {
    const { name, value, type } = e.target;
    setNewBreak({
      ...newBreak,
      [name]: type === 'number' ? parseInt(value) : value + (name === 'startTime' ? ':00' : '')
    });
  };
  
  // Add a new short break
  const handleAddShortBreak = () => {
    setHasChanges(true);
    
    // Validate the new break
    if (!newBreak.startTime || newBreak.duration <= 0) {
      toast.error('Please provide a valid start time and duration');
      return;
    }
    
    // Add seconds to time if needed
    const formattedTime = newBreak.startTime.includes(':') && newBreak.startTime.split(':').length === 2
      ? newBreak.startTime + ':00'
      : newBreak.startTime;
    
    if (editingBreakIndex >= 0) {
      // Update existing break
      const updatedBreaks = [...settings.shortBreaks];
      updatedBreaks[editingBreakIndex] = {
        startTime: formattedTime,
        duration: newBreak.duration
      };
      
      setSettings({
        ...settings,
        shortBreaks: updatedBreaks
      });
      setEditingBreakIndex(-1);
    } else {
      // Add new break
      setSettings({
        ...settings,
        shortBreaks: [
          ...settings.shortBreaks,
          {
            startTime: formattedTime,
            duration: newBreak.duration
          }
        ].sort((a, b) => a.startTime.localeCompare(b.startTime))
      });
    }
    
    // Reset form
    setNewBreak({
      startTime: "10:45:00",
      duration: 10
    });
  };
  
  // Edit an existing short break
  const handleEditShortBreak = (index) => {
    const breakToEdit = settings.shortBreaks[index];
    setNewBreak({
      startTime: formatTimeForInput(breakToEdit.startTime),
      duration: breakToEdit.duration
    });
    setEditingBreakIndex(index);
  };
  
  // Delete a short break
  const handleDeleteShortBreak = (index) => {
    setHasChanges(true);
    
    const updatedBreaks = [...settings.shortBreaks];
    updatedBreaks.splice(index, 1);
    
    setSettings({
      ...settings,
      shortBreaks: updatedBreaks
    });
    
    // Reset editing state if we're deleting the break we're editing
    if (editingBreakIndex === index) {
      setEditingBreakIndex(-1);
      setNewBreak({
        startTime: "10:45:00",
        duration: 10
      });
    } else if (editingBreakIndex > index) {
      // Adjust editing index if we're deleting a break that comes before the one we're editing
      setEditingBreakIndex(editingBreakIndex - 1);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      // Reset error state
      setError(null);
      
      // Validate class duration
      if (settings.classDuration < 30 || settings.classDuration > 180) {
        toast.error('Class duration must be between 30 and 180 minutes');
        return;
      }
      
      // Validate short breaks
      if (settings.shortBreaks.some(brk => brk.duration <= 0 || brk.duration > 60)) {
        toast.error('Short break durations must be between 1 and 60 minutes');
        return;
      }
      
      setIsSaving(true);
      
      console.log('Saving settings:', settings);
      const response = await settingsService.update(settings);
      
      if (response.data.success) {
        toast.success('Settings saved successfully');
        setHasChanges(false);
      } else {
        const errorMsg = response.data.message || 'Failed to save settings';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        const errorMsg = error.response.data?.message || 'Server error while updating settings';
        setError(`Error ${error.response.status}: ${errorMsg}`);
        toast.error(errorMsg);
      } else if (error.request) {
        console.error('Request error:', error.request);
        setError('Network error: No response received from server');
        toast.error('Network error: Could not reach the server');
      } else {
        setError(`Error: ${error.message}`);
        toast.error(error.message || 'Failed to save settings');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Format time for input field (remove seconds)
  const formatTimeForInput = (timeString) => {
    return timeString ? timeString.substring(0, 5) : '';
  };

  // Check if user is admin
  const isAdmin = user && user.role === 'admin';

  if (!isAdmin) {
    return (
      <Container fluid className="settings-page">
        <Alert variant="warning">
          You don't have permission to access this page. Please contact an administrator.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="settings-page">
      <h1 className="page-title">System Settings</h1>
      
      {/* Display error message if there is one */}
      {error && (
        <Alert variant="danger" className="mb-3">
          <strong>Error:</strong> {error}
          <div className="mt-2">
            <small>Please try again or contact the administrator if the problem persists.</small>
          </div>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading settings...</p>
        </div>
      ) : (
        <>
          <Card className="mb-4">
            <Card.Header as="h5">General Settings</Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Academic Year</Form.Label>
                      <Form.Control
                        type="number"
                        name="academic_year"
                        value={settings.academic_year}
                        onChange={handleInputChange}
                        min="2000"
                        max="2100"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Periods Per Day</Form.Label>
                      <Form.Control
                        type="number"
                        name="periodsPerDay"
                        value={settings.periodsPerDay}
                        onChange={handleInputChange}
                        min="1"
                        max="12"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Time</Form.Label>
                      <Form.Control
                        type="time"
                        name="startTime"
                        value={formatTimeForInput(settings.startTime)}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Time</Form.Label>
                      <Form.Control
                        type="time"
                        name="endTime"
                        value={formatTimeForInput(settings.endTime)}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Class Duration (minutes)</Form.Label>
                      <Form.Control
                        type="number"
                        name="classDuration"
                        value={settings.classDuration}
                        onChange={handleInputChange}
                        min="30"
                        max="180"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header as="h5">Working Days</Card.Header>
            <Card.Body>
              <div className="mb-3">
                {weekdays.map(day => (
                  <Form.Check
                    key={day}
                    type="checkbox"
                    id={`day-${day}`}
                    label={day}
                    className="working-day-checkbox"
                    checked={settings.workingDays.includes(day)}
                    onChange={(e) => handleDayChange(day, e.target.checked)}
                  />
                ))}
              </div>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header as="h5">Lunch Break</Card.Header>
            <Card.Body>
              <Form.Check
                type="switch"
                id="lunch-break-switch"
                label="Enable Lunch Break"
                checked={settings.lunchBreak.enabled}
                onChange={(e) => handleLunchBreakChange(e.target.checked)}
                className="mb-3"
              />
              
              {settings.lunchBreak.enabled && (
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Lunch Break Period</Form.Label>
                      <Form.Control
                        type="number"
                        value={settings.lunchBreak.period}
                        onChange={(e) => handleLunchBreakSettingChange('period', e.target.value)}
                        min="1"
                        max={settings.periodsPerDay}
                      />
                      <Form.Text muted>
                        Which period should be used for lunch break (Period 1 is the first period of the day)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Duration (minutes)</Form.Label>
                      <Form.Control
                        type="number"
                        value={settings.lunchBreak.duration}
                        onChange={(e) => handleLunchBreakSettingChange('duration', e.target.value)}
                        min="15"
                        max="120"
                        step="5"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header as="h5">Short Breaks</Card.Header>
            <Card.Body>
              <p>Configure additional short breaks between classes.</p>
              
              <Form className="mb-4">
                <Row className="align-items-end">
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label>Start Time</Form.Label>
                      <Form.Control
                        type="time"
                        name="startTime"
                        value={formatTimeForInput(newBreak.startTime)}
                        onChange={handleNewBreakChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Duration (minutes)</Form.Label>
                      <Form.Control
                        type="number"
                        name="duration"
                        value={newBreak.duration}
                        onChange={handleNewBreakChange}
                        min="1"
                        max="60"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Button 
                      variant="primary" 
                      onClick={handleAddShortBreak}
                      className="w-100"
                    >
                      {editingBreakIndex >= 0 ? 'Update Break' : 'Add Break'}
                    </Button>
                  </Col>
                </Row>
              </Form>
              
              {settings.shortBreaks.length > 0 ? (
                <Table responsive bordered hover className="short-breaks-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Start Time</th>
                      <th>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.shortBreaks.map((breakItem, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{formatTimeForInput(breakItem.startTime)}</td>
                        <td>{breakItem.duration} minutes</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEditShortBreak(index)}
                            >
                              <FaEdit /> Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteShortBreak(index)}
                            >
                              <FaTrash /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">
                  No short breaks configured. Use the form above to add short breaks.
                </Alert>
              )}
            </Card.Body>
          </Card>
          
          <div className="d-flex justify-content-end mb-5">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSaveSettings}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default SettingsPage; 