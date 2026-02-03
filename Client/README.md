# CPDO Zoning Management System - React Migration

This project has been migrated from vanilla HTML/CSS/JavaScript to React. All functionality and styles have been preserved.

## Clone and run (e.g. on another desktop)

**Important:** The app must be run from inside the **`Client`** folder.

```bash
git clone https://github.com/iomambaccpdo-arch/Zoning-Management-System.git
cd Zoning-Management-System/Client
npm install
npm run dev
```

Then open `http://localhost:3000`. Log in (seed an admin user in localStorage if needed; see Default Users below).

## Setup Instructions

1. **Install Dependencies** (from the `Client` folder)
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
const users = [{
  firstName: "Admin",
  lastName: "User",
  name: "Admin User",
  username: "admin",
  email: "admin@example.com",
  password: "admin123",
  role: "Admin",
  designation: "CPDC",
  section: "Plans"
}];
localStorage.setItem('users', JSON.stringify(users));
```

## If the Settings page is blank

1. **Use the latest code:** `git pull origin main` (commit should include "Fix Settings page" – Layout, flex CSS, and safe formData checks).
2. **Run from the right folder:** Always `cd Client` then `npm run dev`. Do not run from the repo root.
3. **Hard refresh:** In the browser press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to clear cache.
4. **Be logged in:** Settings requires a logged-in user. If you have no users, seed one in the browser console (see Default Users), then log in and open Settings again.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- localStorage support required

## Development

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: CSS (all original styles preserved)
