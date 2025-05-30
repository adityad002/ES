# Smart Academic Scheduler - Client

This is the frontend client for the Smart Academic Scheduler application. It's built with React and provides an intuitive interface for managing academic schedules, including teachers, subjects, and timetables.

## Features

- Authentication and user management
- Dashboard with statistics and charts
- Teacher management
- Subject management
- Timetable generation and visualization
- System settings configuration

## Technologies Used

- React 18.x
- React Router 6.x
- React Bootstrap for UI components
- Chart.js for data visualization
- Axios for API requests
- React Toastify for notifications
- Context API for state management

## Getting Started

### Prerequisites

- Node.js (v14.x or later)
- npm (v6.x or later)

### Installation

1. Clone the repository
2. Navigate to the client directory:
   ```
   cd ES_V3/client
   ```
3. Install dependencies:
   ```
   npm install
   ```

### Running the Application

Start the development server:

```
npm start
```

The application will be available at http://localhost:3000.

### Building for Production

To create a production build:

```
npm run build
```

## Project Structure

- `public/` - Static assets and HTML template
- `src/` - Source code
  - `components/` - Reusable UI components
  - `contexts/` - React Context providers
  - `pages/` - Main application views
  - `services/` - API services and utilities
  - `App.js` - Main application component
  - `index.js` - Application entry point

## API Integration

The client communicates with a backend API at `/api`. API requests are configured with axios and include authentication headers when needed. The API provides endpoints for managing teachers, subjects, timetables, and user authentication.

## Responsive Design

The application is designed to work on various screen sizes, from desktop to mobile devices, using responsive design principles.

## Authentication

The application uses token-based authentication. The token is stored in localStorage and included in API requests. Protected routes require authentication. 