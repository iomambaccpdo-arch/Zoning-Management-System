# CPDO Zoning Management System - React Migration

This project has been migrated from vanilla HTML/CSS/JavaScript to React. All functionality and styles have been preserved.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will start on `http://localhost:3000`

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Preview Production Build**
   ```bash
   npm run preview
   ```

## Project Structure

```
/
├── src/
│   ├── components/       # Reusable React components
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── MultiSelect.jsx
│   │   └── SearchableSelect.jsx
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Documents.jsx
│   │   ├── Files.jsx
│   │   ├── Accounts.jsx
│   │   ├── Settings.jsx
│   │   ├── NewDocument.jsx
│   │   └── NewUser.jsx
│   ├── utils/           # Utility functions
│   │   └── auth.js
│   ├── App.jsx          # Main app component with routing
│   ├── main.jsx         # Entry point
│   └── index.css
├── Styles/              # All CSS files (preserved as-is)
├── Data/                # JSON data files
├── Logo/                # Logo assets
├── index.html           # HTML entry point
├── package.json
├── vite.config.js
└── README.md
```

## Features

All original features have been preserved:

- ✅ User authentication (login/logout)
- ✅ Role-based access control (Admin, User, Viewer)
- ✅ Dashboard with month cards and recent files
- ✅ Document management (create, edit, delete, view)
- ✅ File upload with drag & drop
- ✅ User account management
- ✅ Settings page with password management
- ✅ Search and filter functionality
- ✅ Dynamic dropdowns (Zoning, Project Type, Barangay, Purok)
- ✅ Multi-select component for routing
- ✅ All CSS styles preserved

## Important Notes

1. **Data Storage**: The app uses `localStorage` for data persistence, same as the original
2. **Assets**: 
   - For Vite to serve static assets, the `Logo` and `Data` folders need to be in a `public` directory at the root
   - After migration, you may need to move or copy `Logo/` and `Data/` folders into `public/` directory
   - Alternatively, you can create symlinks: `ln -s ../Logo public/Logo` and `ln -s ../Data public/Data`
3. **Routing**: Uses React Router v6 for navigation
4. **No API**: All data is stored in browser localStorage

## Default Users

You may need to create initial users through the Accounts page (Admin access required) or manually add them to localStorage.

Example user structure:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "name": "John Doe",
  "username": "admin",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "Admin",
  "designation": "CPDC",
  "section": "Plans"
}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- localStorage support required

## Development

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: CSS (all original styles preserved)
