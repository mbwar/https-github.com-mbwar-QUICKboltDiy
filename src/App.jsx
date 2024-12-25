import React from 'react';
    import { Routes, Route, Link } from 'react-router-dom';
    import QuoteWizard from './components/QuoteWizard';
    import UserManagement from './components/UserManagement';
    import ContractGeneration from './components/ContractGeneration';
    import AdminPanel from './components/AdminPanel';
    import { AuthProvider } from './contexts/AuthContext';
    import './index.css';

    function App() {
      return (
        <AuthProvider>
          <nav>
            <ul>
              <li><Link to="/">Quote Wizard</Link></li>
              <li><Link to="/users">User Management</Link></li>
              <li><Link to="/contracts">Contract Generation</Link></li>
              <li><Link to="/admin">Admin Panel</Link></li>
            </ul>
          </nav>
          <div className="container">
            <Routes>
              <Route path="/" element={<QuoteWizard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/contracts" element={<ContractGeneration />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </div>
        </AuthProvider>
      );
    }

    export default App;
