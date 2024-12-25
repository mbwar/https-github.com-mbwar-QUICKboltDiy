import React, { createContext, useState, useEffect } from 'react';

    export const AuthContext = createContext();

    export const AuthProvider = ({ children }) => {
      const [user, setUser] = useState(null);

      useEffect(() => {
        const fetchUsers = async () => {
          try {
            const response = await fetch('/data/users.json');
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // For simplicity, we'll just use the first user as the logged-in user
            if (data && data.length > 0) {
              setUser(data[0]);
            }
          } catch (error) {
            console.error('Failed to fetch users:', error);
          }
        };

        fetchUsers();
      }, []);

      return (
        <AuthContext.Provider value={{ user }}>
          {children}
        </AuthContext.Provider>
      );
    };
