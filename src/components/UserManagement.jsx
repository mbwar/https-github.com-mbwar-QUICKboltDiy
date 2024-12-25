import React, { useState, useEffect } from 'react';
    import { v4 as uuidv4 } from 'uuid';

    const UserManagement = () => {
      const [users, setUsers] = useState([]);
      const [newUser, setNewUser] = useState({
        id: '',
        nom: '',
        email: '',
        role: 'souscripteur',
      });
      const [error, setError] = useState('');
      const [success, setSuccess] = useState('');

      useEffect(() => {
        fetchUsers();
      }, []);

      const fetchUsers = async () => {
        try {
          const response = await fetch('/data/users.json');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setUsers(data);
        } catch (error) {
          console.error('Failed to fetch users:', error);
          setError('Failed to fetch users.');
        }
      };

      const saveUsers = async (users) => {
        try {
          const response = await fetch('/data/users.json', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(users),
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (error) {
          console.error('Failed to save users:', error);
          throw error;
        }
      };

      const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser({ ...newUser, [name]: value });
      };

      const handleAddUser = async () => {
        if (!newUser.nom || !newUser.email || !newUser.role) {
          setError('Please fill in all fields.');
          return;
        }
        try {
          const updatedUser = { ...newUser, id: uuidv4() };
          const updatedUsers = [...users, updatedUser];
          await saveUsers(updatedUsers);
          setUsers(updatedUsers);
          setNewUser({ id: '', nom: '', email: '', role: 'souscripteur' });
          setSuccess('User added successfully!');
          setError('');
        } catch (err) {
          setError('Failed to add user.');
          setSuccess('');
        }
      };

      const handleRemoveUser = async (id) => {
        try {
          const updatedUsers = users.filter((user) => user.id !== id);
          await saveUsers(updatedUsers);
          setUsers(updatedUsers);
          setSuccess('User removed successfully!');
          setError('');
        } catch (err) {
          setError('Failed to remove user.');
          setSuccess('');
        }
      };

      return (
        <div>
          <h1>User Management</h1>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <h2>Add New User</h2>
          <label>Nom</label>
          <input type="text" name="nom" value={newUser.nom} onChange={handleInputChange} />
          <label>Email</label>
          <input type="email" name="email" value={newUser.email} onChange={handleInputChange} />
          <label>Role</label>
          <select name="role" value={newUser.role} onChange={handleInputChange}>
            <option value="souscripteur">Souscripteur</option>
            <option value="responsableSouscription">Responsable Souscription</option>
            <option value="gestionnaire">Gestionnaire</option>
            <option value="responsableGestion">Responsable Gestion</option>
            <option value="administrateur">Administrateur</option>
          </select>
          <button onClick={handleAddUser}>Add User</button>
          <h2>Current Users</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.nom}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button onClick={() => handleRemoveUser(user.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    export default UserManagement;
