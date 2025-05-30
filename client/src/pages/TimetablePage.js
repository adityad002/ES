import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaSync, FaTrash, FaCalendarAlt, FaBook, FaChalkboardTeacher, FaFilePdf, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { timetableService } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Dropdown from 'react-bootstrap/Dropdown';
import './TimetablePage.css';

const TimetablePage = () => {
  const { user } = useContext(AuthContext);
  const [timetables, setTimetables] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [error, setError] = useState(null);
  const [labStats, setLabStats] = useState({ count: 0, subjects: [] });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = Array.from({ length: 8 }, (_, i) => i + 1); // Periods 1-8
  const semesters = Array.from({ length: 8 }, (_, i) => (i + 1).toString()); // Semesters 1-8
  const sections = ['A', 'B'];

  // Time slots corresponding to periods
  const timeSlots = [
    '9:00 - 9:50',
    '9:50 - 10:40',
    '10:40 - 11:30',
    '11:30 - 12:20',
    '12:20 - 13:10',
    '13:10 - 14:00',
    '14:00 - 14:50',
    '14:50 - 15:40'
  ];

  useEffect(() => {
    fetchTimetable();
  }, [selectedSemester]);

  const fetchTimetable = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await timetableService.getBySemester(selectedSemester);
      setTimetables(prevTimetables => ({
        ...prevTimetables,
        ...response.data.data || {}
      }));

      // After setting timetables, calculate lab stats
      calculateLabStats(response.data.data || {});
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setError('Failed to load timetable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load all semesters' data
  const fetchAllTimetables = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let allData = {};
      
      // Create a queue of promises to fetch all semesters
      const fetchPromises = semesters.map(semester => 
        timetableService.getBySemester(semester)
          .then(response => {
            console.log(`Fetched data for semester ${semester}:`, 
              response.data.data ? Object.keys(response.data.data).length : 0, 'items');
            
            if (response.data.data && Object.keys(response.data.data).length > 0) {
              allData = { ...allData, ...response.data.data };
            }
          })
          .catch(error => {
            console.error(`Error fetching semester ${semester}:`, error);
          })
      );
      
      // Wait for all requests to complete
      await Promise.all(fetchPromises);
      
      console.log('All timetable data loaded:', Object.keys(allData));
      
      // Only update state if we found data
      if (Object.keys(allData).length > 0) {
        setTimetables(allData);
        calculateLabStats(allData);
      } else {
        console.warn('No timetable data found for any semester');
      }
    } catch (error) {
      console.error('Error fetching all timetables:', error);
      setError('Failed to load all timetables. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Use this effect to load all timetables when the component mounts
  useEffect(() => {
    fetchAllTimetables();
  }, []);

  // Calculate statistics about labs in the timetable
  const calculateLabStats = (data) => {
    const labSubjects = new Set();
    let totalLabSlots = 0;

    // Loop through all timetable data to find labs
    Object.values(data).forEach(classTimetable => {
      Object.values(classTimetable).forEach(dayTimetable => {
        Object.values(dayTimetable).forEach(slot => {
          if (slot && slot.subject && slot.subject.is_lab) {
            totalLabSlots++;
            labSubjects.add(`${slot.subject.name} (${slot.subject.code})`);
          }
        });
      });
    });

    setLabStats({
      count: totalLabSlots,
      subjects: Array.from(labSubjects)
    });
  };

  const generateTimetable = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      console.log('Starting timetable generation...');
      const response = await timetableService.generate();
      console.log('Timetable generation response:', response);

      toast.success('Timetable generated successfully!');
      await fetchTimetable();
    } catch (error) {
      console.error('Error generating timetable:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      setError(`Failed to generate timetable: ${error.response?.data?.message || error.message}`);
      toast.error('Failed to generate timetable. See console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearTimetable = async () => {
    if (!window.confirm('Are you sure you want to clear all timetable data?')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await timetableService.clear();

      toast.success('Timetable cleared successfully!');
      setTimetables({});
    } catch (error) {
      console.error('Error clearing timetable:', error);
      setError('Failed to clear timetable. Please try again.');
      toast.error('Failed to clear timetable.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimetableForSelectedView = () => {
    if (
      !timetables ||
      !timetables[`${selectedSemester}${selectedSection}`] ||
      !timetables[`${selectedSemester}${selectedSection}`][selectedDay]
    ) {
      return {};
    }

    return timetables[`${selectedSemester}${selectedSection}`][selectedDay];
  };

  const currentTimetable = getTimetableForSelectedView();

  const exportToPDF = async (dayView = true) => {
    try {
      toast.info('Preparing PDF for download...', { autoClose: 2000 });
      
      // Create a new PDF document
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Timetable - Semester ${selectedSemester}, Section ${selectedSection}`, 14, 15);
      
      if (dayView) {
        // Add subtitle with day
        pdf.setFontSize(14);
        pdf.text(`${selectedDay}`, 14, 22);
      } else {
        // Add subtitle indicating full week
        pdf.setFontSize(14);
        pdf.text('Full Week View', 14, 22);
      }
      
      // Add metadata line
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
      
      if (dayView) {
        // Day view: Periods as rows, single day as column
        
        // Set up table headers and configuration
        const headers = ['Period', 'Time', 'Subject', 'Teacher'];
        
        // Table configuration
        const tableStartY = 35;
        const cellPadding = 3;
        const subjectColumnWidth = 90;
        const teacherColumnWidth = 50;
        const timeColumnWidth = 30;
        const periodColumnWidth = 15;
        const rowHeight = 20;
        const tableWidth = periodColumnWidth + timeColumnWidth + subjectColumnWidth + teacherColumnWidth;
        
        // Draw table header
        pdf.setFillColor(230, 230, 230);
        pdf.rect(14, tableStartY, tableWidth, 8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        
        // Draw header cells
        let currentX = 14;
        pdf.text(headers[0], currentX + cellPadding, tableStartY + 5);
        currentX += periodColumnWidth;
        
        pdf.text(headers[1], currentX + cellPadding, tableStartY + 5);
        currentX += timeColumnWidth;
        
        pdf.text(headers[2], currentX + cellPadding, tableStartY + 5);
        currentX += subjectColumnWidth;
        
        pdf.text(headers[3], currentX + cellPadding, tableStartY + 5);
        
        // Draw horizontal line after header
        pdf.line(14, tableStartY + 8, 14 + tableWidth, tableStartY + 8);
        
        // Draw table rows
        let currentY = tableStartY + 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        
        periods.forEach((period, index) => {
          const slot = currentTimetable[period];
          
          // Draw period number
          currentX = 14;
          pdf.text(period.toString(), currentX + cellPadding, currentY + 5);
          currentX += periodColumnWidth;
          
          // Draw time
          pdf.text(timeSlots[period - 1], currentX + cellPadding, currentY + 5);
          currentX += timeColumnWidth;
          
          // Draw subject
          if (slot && slot.type === 'break') {
            pdf.text(slot.name, currentX + cellPadding, currentY + 5);
          } else if (slot && slot.subject) {
            pdf.text(slot.subject.name, currentX + cellPadding, currentY + 3);
            pdf.text(`(${slot.subject.code})`, currentX + cellPadding, currentY + 7);
            
            if (slot.subject.is_lab) {
              pdf.text('Lab Session', currentX + cellPadding, currentY + 11);
            }
          } else {
            pdf.text('—', currentX + cellPadding, currentY + 5);
          }
          currentX += subjectColumnWidth;
          
          // Draw teacher
          if (slot && slot.teacher && slot.type !== 'break') {
            pdf.text(slot.teacher.name, currentX + cellPadding, currentY + 5);
          } else if (slot && slot.type !== 'break') {
            pdf.text('—', currentX + cellPadding, currentY + 5);
          }
          
          // Draw horizontal line
          currentY += rowHeight;
          pdf.line(14, currentY, 14 + tableWidth, currentY);
          
          // Reset X position for next row
          currentX = 14;
        });
        
        // Draw vertical lines for all columns
        let lineX = 14;
        pdf.line(lineX, tableStartY, lineX, currentY);
        lineX += periodColumnWidth;
        pdf.line(lineX, tableStartY, lineX, currentY);
        lineX += timeColumnWidth;
        pdf.line(lineX, tableStartY, lineX, currentY);
        lineX += teacherColumnWidth;
        pdf.line(lineX, tableStartY, lineX, currentY);
        
      } else {
        // Full week view: Periods as rows, days as columns
        
        // Set up table headers and configuration
        const headers = ['Period', 'Time', ...days];
        const periodData = periods.map(period => ({
          period,
          time: timeSlots[period - 1],
          days: days.map(day => {
            const classTimetable = timetables[`${selectedSemester}${selectedSection}`];
            if (!classTimetable || !classTimetable[day] || !classTimetable[day][period]) return '—';
            
            const slot = classTimetable[day][period];
            
            if (slot.type === 'break') return slot.name;
            
            // Return subject and teacher info
            return `${slot.subject.name}\n(${slot.subject.code})\n${slot.teacher.name}`;
          })
        }));
        
        // Table configuration
        const tableStartY = 35;
        const cellPadding = 3;
        const columnWidth = 38;
        const timeColumnWidth = 30;
        const periodColumnWidth = 15;
        const rowHeight = 20;
        const tableWidth = periodColumnWidth + timeColumnWidth + (columnWidth * days.length);
        
        // Draw table header
        pdf.setFillColor(230, 230, 230);
        pdf.rect(14, tableStartY, tableWidth, 8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        
        // Draw header cells
        let currentX = 14;
        pdf.text(headers[0], currentX + cellPadding, tableStartY + 5);
        currentX += periodColumnWidth;
        
        pdf.text(headers[1], currentX + cellPadding, tableStartY + 5);
        currentX += timeColumnWidth;
        
        for (let i = 2; i < headers.length; i++) {
          pdf.text(headers[i], currentX + cellPadding, tableStartY + 5);
          currentX += columnWidth;
        }
        
        // Draw horizontal line after header
        pdf.line(14, tableStartY + 8, 14 + tableWidth, tableStartY + 8);
        
        // Draw table rows
        let currentY = tableStartY + 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        
        periodData.forEach((row, rowIndex) => {
          // Draw period number
          currentX = 14;
          pdf.text(row.period.toString(), currentX + cellPadding, currentY + 5);
          currentX += periodColumnWidth;
          
          // Draw time
          pdf.text(row.time, currentX + cellPadding, currentY + 5);
          currentX += timeColumnWidth;
          
          // Draw day data
          row.days.forEach(dayData => {
            const lines = dayData.split('\n');
            lines.forEach((line, lineIndex) => {
              pdf.text(line, currentX + cellPadding, currentY + 3 + (lineIndex * 3));
            });
            currentX += columnWidth;
          });
          
          // Draw horizontal line
          currentY += rowHeight;
          pdf.line(14, currentY, 14 + tableWidth, currentY);
          
          // Reset X position for next row
          currentX = 14;
          
          // Draw vertical lines for all columns
          let lineX = 14;
          pdf.line(lineX, tableStartY, lineX, currentY);
          lineX += periodColumnWidth;
          pdf.line(lineX, tableStartY, lineX, currentY);
          lineX += timeColumnWidth;
          for (let i = 0; i < days.length; i++) {
            pdf.line(lineX, tableStartY, lineX, currentY);
            lineX += columnWidth;
          }
          pdf.line(lineX, tableStartY, lineX, currentY);
        });
      }
      
      // Add footer
      pdf.setFontSize(10);
      pdf.text('© EduScheduler - Automated Timetable Management System', 14, pdf.internal.pageSize.height - 10);
      
      // Save the PDF
      const filename = dayView 
        ? `Timetable_Sem${selectedSemester}_Sec${selectedSection}_${selectedDay}.pdf`
        : `Timetable_Sem${selectedSemester}_Sec${selectedSection}_FullWeek.pdf`;
      
      pdf.save(filename);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to create PDF. Please try again.');
    }
  };

  const exportAllTimetablesToPDF = async () => {
    try {
      // Check if we have any data
      const semesterSections = Object.keys(timetables);
      if (semesterSections.length === 0) {
        toast.info('Loading timetable data first...', { autoClose: 2000 });
        await fetchAllTimetables();
        
        // Check again if we have data after loading
        if (Object.keys(timetables).length === 0) {
          toast.error('No timetable data available to export');
          return;
        }
      }
      
      toast.info('Preparing all timetables for download... This may take a moment.', { autoClose: 3000 });
      
      // Create a new PDF document
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      let currentPage = 1;
      let exportCount = 0;
      
      // Get all available semester-section combinations directly from the data
      const availableCombinations = Object.keys(timetables);
      console.log('Available timetable combinations:', availableCombinations);
      
      // Loop through all available semester-section combinations
      for (const semesterSection of availableCombinations) {
        // Skip if this doesn't have valid data
        if (!timetables[semesterSection] || Object.keys(timetables[semesterSection]).length === 0) {
          continue;
        }
        
        // Extract semester and section from the key (format: '1A', '2B', etc.)
        const semester = semesterSection.charAt(0);
        const section = semesterSection.charAt(1);
        
        // Add a new page for each semester-section except the first one
        if (currentPage > 1) {
          pdf.addPage();
        }
        
        // Add title for each semester-section
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Timetable - Semester ${semester}, Section ${section}`, 14, 15);
        
        // Add subtitle indicating full week
        pdf.setFontSize(14);
        pdf.text('Full Week View', 14, 22);
        
        // Add metadata line
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
        
        // Full week view: Periods as rows, days as columns
        // Set up table headers and configuration
        const headers = ['Period', 'Time', ...days];
        const periodData = periods.map(period => ({
          period,
          time: timeSlots[period - 1],
          days: days.map(day => {
            const classTimetable = timetables[semesterSection];
            if (!classTimetable || !classTimetable[day] || !classTimetable[day][period]) return '—';
            
            const slot = classTimetable[day][period];
            
            if (slot.type === 'break') return slot.name;
            
            // Return subject and teacher info
            return `${slot.subject.name}\n(${slot.subject.code})\n${slot.teacher.name}`;
          })
        }));
        
        // Table configuration
        const tableStartY = 35;
        const cellPadding = 3;
        const columnWidth = 38;
        const timeColumnWidth = 30;
        const periodColumnWidth = 15;
        const rowHeight = 20;
        const tableWidth = periodColumnWidth + timeColumnWidth + (columnWidth * days.length);
        
        // Draw table header
        pdf.setFillColor(230, 230, 230);
        pdf.rect(14, tableStartY, tableWidth, 8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        
        // Draw header cells
        let currentX = 14;
        pdf.text(headers[0], currentX + cellPadding, tableStartY + 5);
        currentX += periodColumnWidth;
        
        pdf.text(headers[1], currentX + cellPadding, tableStartY + 5);
        currentX += timeColumnWidth;
        
        for (let i = 2; i < headers.length; i++) {
          pdf.text(headers[i], currentX + cellPadding, tableStartY + 5);
          currentX += columnWidth;
        }
        
        // Draw horizontal line after header
        pdf.line(14, tableStartY + 8, 14 + tableWidth, tableStartY + 8);
        
        // Draw table rows
        let currentY = tableStartY + 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        
        periodData.forEach((row, rowIndex) => {
          // Draw period number
          currentX = 14;
          pdf.text(row.period.toString(), currentX + cellPadding, currentY + 5);
          currentX += periodColumnWidth;
          
          // Draw time
          pdf.text(row.time, currentX + cellPadding, currentY + 5);
          currentX += timeColumnWidth;
          
          // Draw day data
          row.days.forEach(dayData => {
            const lines = dayData.split('\n');
            lines.forEach((line, lineIndex) => {
              pdf.text(line, currentX + cellPadding, currentY + 3 + (lineIndex * 3));
            });
            currentX += columnWidth;
          });
          
          // Draw horizontal line
          currentY += rowHeight;
          pdf.line(14, currentY, 14 + tableWidth, currentY);
          
          // Reset X position for next row
          currentX = 14;
        });
        
        // Draw vertical lines for all columns
        let lineX = 14;
        pdf.line(lineX, tableStartY, lineX, currentY);
        lineX += periodColumnWidth;
        pdf.line(lineX, tableStartY, lineX, currentY);
        lineX += timeColumnWidth;
        for (let i = 0; i < days.length; i++) {
          pdf.line(lineX, tableStartY, lineX, currentY);
          lineX += columnWidth;
        }
        pdf.line(lineX, tableStartY, lineX, currentY);
        
        // Add footer
        pdf.setFontSize(10);
        pdf.text('© EduScheduler - Automated Timetable Management System', 14, pdf.internal.pageSize.height - 10);
        
        currentPage++;
        exportCount++;
      }
      
      if (exportCount === 0) {
        toast.error('No timetable data available to export');
        return;
      }
      
      // Save the PDF
      const filename = `All_Timetables_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
      pdf.save(filename);
      
      toast.success(`All timetables (${exportCount} semester-sections) downloaded successfully!`);
    } catch (error) {
      console.error('Error exporting all timetables to PDF:', error);
      toast.error('Failed to create PDF. Please try again.');
    }
  };

  return (
    <Container fluid className="timetable-page">
      <h1 className="page-title">
        <FaCalendarAlt className="me-3" />
        Timetable
      </h1>

      {/* Lab Status Summary */}
      {!isLoading && !isGenerating && labStats.count > 0 && (
        <Alert variant="info" className="mb-4 d-flex align-items-center">
          <div>
            <strong>Labs Scheduled:</strong> {labStats.count} slots
            {labStats.subjects.length > 0 && (
              <div className="mt-1 small">
                <strong>Lab Subjects:</strong> {labStats.subjects.join(', ')}
              </div>
            )}
          </div>
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Filters</h5>
              <div>
                {user?.role === 'admin' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      className="me-2"
                      onClick={generateTimetable}
                      disabled={isGenerating}
                    >
                      <FaSync className={`me-2 ${isGenerating ? 'fa-spin' : ''}`} />
                      {isGenerating ? 'Generating...' : 'Generate Timetable'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={clearTimetable}
                      disabled={isLoading || isGenerating}
                    >
                      <FaTrash className="me-2" />
                      Clear Timetable
                    </Button>
                  </>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Semester</Form.Label>
                    <Form.Select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                    >
                      {semesters.map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Section</Form.Label>
                    <Form.Select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                    >
                      {sections.map((section) => (
                        <option key={section} value={section}>
                          Section {section}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Day</Form.Label>
                    <Form.Select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                    >
                      {days.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="d-flex justify-content-end align-items-start">
          {!isLoading && !isGenerating && Object.keys(timetables).length > 0 && (
            <Dropdown className="pdf-export-dropdown">
              <Dropdown.Toggle variant="outline-primary" size="sm" id="dropdown-pdf">
                <FaFilePdf className="me-2" />
                Export Timetable
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Header>Current Selection</Dropdown.Header>
                <Dropdown.Item onClick={() => exportToPDF(true)}>
                  <FaDownload className="me-2" /> Single Day View (Current)
                </Dropdown.Item>
                <Dropdown.Item onClick={() => exportToPDF(false)}>
                  <FaDownload className="me-2" /> Full Week View (Current)
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Header>Batch Export</Dropdown.Header>
                <Dropdown.Item onClick={exportAllTimetablesToPDF}>
                  <FaDownload className="me-2" /> All Semesters & Sections
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <h5 className="mb-0">
            Timetable for Semester {selectedSemester}, Section {selectedSection} - {selectedDay}
          </h5>
        </Card.Header>
        <Card.Body>
          {isLoading || isGenerating ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">
                {isGenerating ? 'Generating timetable...' : 'Loading timetable...'}
              </p>
            </div>
          ) : (
            <div className="table-responsive timetable-container">
              <Table bordered hover className="timetable-table">
                <thead>
                  <tr className="bg-light">
                    <th width="8%" className="text-center">Period</th>
                    <th width="15%" className="text-center">Time</th>
                    <th width="35%">Subject</th>
                    <th width="25%">Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period, index) => {
                    const slot = currentTimetable[period];

                    // Check if this is a lab subject
                    const isLab = slot && slot.subject && slot.subject.is_lab;

                    // Skip this row if it's the second period of a lab (should be covered by rowspan)
                    if (index > 0 && isLab) {
                      const prevPeriod = periods[index - 1];
                      const prevSlot = currentTimetable[prevPeriod];

                      // If previous slot exists, is a lab, has the same subject ID AND same assignment ID
                      if (prevSlot &&
                        prevSlot.subject &&
                        prevSlot.subject.is_lab &&
                        prevSlot.subject.id === slot.subject.id &&
                        prevSlot.assignment_id === slot.assignment_id) {
                        // This is a continuation of the previous lab period
                        return null;
                      }
                    }

                    // Special rendering for break periods
                    if (slot && slot.type === 'break') {
                      return (
                        <tr key={period} className="break-row">
                          <td className="text-center">{period}</td>
                          <td className="text-center">{timeSlots[period - 1]}</td>
                          <td colSpan="2" className="text-center break-cell">
                            <Badge bg="secondary" className="px-3 py-2">{slot.name}</Badge>
                          </td>
                        </tr>
                      );
                    }

                    // For labs, check if this lab continues to the next period (for rowspan)
                    const hasNextPeriod = index < periods.length - 1;
                    const nextSlot = hasNextPeriod ? currentTimetable[periods[index + 1]] : null;

                    // A lab is continuous if the next slot exists, is a lab, and has the same subject and assignment
                    const isContinuousLab = isLab && hasNextPeriod &&
                      nextSlot &&
                      nextSlot.subject &&
                      nextSlot.subject.is_lab &&
                      nextSlot.subject.id === slot.subject.id &&
                      nextSlot.assignment_id === slot.assignment_id;

                    return (
                      <tr key={period} className={slot ? (isLab ? 'lab-row' : 'subject-row') : ''}>
                        <td className="text-center period-cell">
                          {period}
                          {isContinuousLab && <div className="mt-1">to {period + 1}</div>}
                        </td>
                        <td className="text-center time-cell">
                          {isContinuousLab ? (
                            <>
                              {timeSlots[period - 1].split(' - ')[0]} - {timeSlots[period].split(' - ')[1]}
                            </>
                          ) : (
                            timeSlots[period - 1]
                          )}
                        </td>
                        <td rowSpan={isContinuousLab ? 2 : 1}>
                          {slot ? (
                            <div className="d-flex align-items-center">
                              <FaBook className="me-2 text-primary" />
                              <div>
                                <div className="subject-name">{slot.subject.name}</div>
                                <div className="text-muted subject-code">
                                  {slot.subject.code}
                                  {isLab && (
                                    <Badge bg="info" className="ms-2">
                                      {isContinuousLab ? "Lab (Double Period)" : "Lab"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td rowSpan={isContinuousLab ? 2 : 1}>
                          {slot ? (
                            <div className="d-flex align-items-center">
                              <FaChalkboardTeacher className="me-2 text-success" />
                              <div className="teacher-name">{slot.teacher.name}</div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {!isLoading && !isGenerating && Object.keys(timetables).length === 0 && (
            <Alert variant="info" className="text-center my-4">
              <p className="mb-2">No timetable data available.</p>
              {user?.role === 'admin' && (
                <Button variant="primary" size="sm" onClick={generateTimetable}>
                  <FaSync className="me-2" />
                  Generate Timetable
                </Button>
              )}
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TimetablePage; 