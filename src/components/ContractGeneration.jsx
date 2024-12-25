import React, { useState, useEffect } from 'react';

    const ContractGeneration = () => {
      const [quotes, setQuotes] = useState([]);
      const [contracts, setContracts] = useState([]);
      const [error, setError] = useState('');
      const [success, setSuccess] = useState('');

      useEffect(() => {
        fetchQuotes();
        fetchContracts();
      }, []);

      const fetchQuotes = async () => {
        try {
          const response = await fetch('/data/quotes.json');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setQuotes(data);
        } catch (error) {
          console.error('Failed to fetch quotes:', error);
          setError('Failed to fetch quotes.');
        }
      };

      const fetchContracts = async () => {
        try {
          const response = await fetch('/data/contracts.json');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setContracts(data);
        } catch (error) {
          console.error('Failed to fetch contracts:', error);
          setError('Failed to fetch contracts.');
        }
      };

      const saveContracts = async (contracts) => {
        try {
          const response = await fetch('/data/contracts.json', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(contracts),
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (error) {
          console.error('Failed to save contracts:', error);
          throw error;
        }
      };

      const handleGenerateContract = async (quoteId) => {
        try {
          const selectedQuote = quotes.find((quote) => quote.id === quoteId);
          if (!selectedQuote) {
            setError('Quote not found.');
            return;
          }
          const newContract = {
            id: Date.now(),
            devisAssocie: selectedQuote,
            dateCreation: new Date().toISOString(),
          };
          const updatedContracts = [...contracts, newContract];
          await saveContracts(updatedContracts);
          setContracts(updatedContracts);
          setSuccess('Contract generated successfully!');
          setError('');
        } catch (err) {
          setError('Failed to generate contract.');
          setSuccess('');
        }
      };

      return (
        <div>
          <h1>Contract Generation</h1>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <h2>Quotes</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>{quote.id}</td>
                  <td>{quote.status}</td>
                  <td>
                    <button onClick={() => handleGenerateContract(quote.id)}>Generate Contract</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2>Contracts</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Quote ID</th>
                <th>Date Created</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id}>
                  <td>{contract.id}</td>
                  <td>{contract.devisAssocie.id}</td>
                  <td>{contract.dateCreation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    export default ContractGeneration;
