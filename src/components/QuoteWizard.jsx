import React, { useState, useContext, useEffect } from 'react';
    import { v4 as uuidv4 } from 'uuid';
    import { AuthContext } from '../contexts/AuthContext';
    import { Document, Packer, Paragraph, TextRun } from 'docx';

    const QuoteWizard = () => {
      const { user } = useContext(AuthContext);
      const [step, setStep] = useState(1);
      const [quoteData, setQuoteData] = useState({
        id: uuidv4(),
        souscripteur: {
          nom: user ? user.nom : '',
          adresse: '',
          maitreOuvrage: '',
          adresseMaitreOuvrage: '',
        },
        chantier: {
          numeroMarche: '',
          natureTravaux: '',
          situationTravaux: '',
          montantTravaux: '',
          dureeTravaux: '1',
          dateDebut: '',
          dateFin: '',
        },
        garanties: [],
        prime: {
          primeNette: '',
          primeEvcat: 0,
          taxes: 0,
          accessoires: 25,
          primeTotale: 0,
        },
        status: 'draft',
      });
      const [error, setError] = useState('');
      const [success, setSuccess] = useState('');

      const guaranteeOptions = {
        dommage: {
          montantFranchise: [
            'Dommages à l\'ouvrage',
            'Evénements naturels + clause 72h',
            'Grèves Emeutes Mouvements Populaires',
            'Erreur de conception, partie viciée exclue',
            'Erreur de conception, y compris la partie viciée',
            'Dommages aux existants et aux biens adjacents',
            'Transport intérieur',
            'Plans & documents',
            'Vol avec effraction',
            'Equipements de lutte contre l\'incendie & mesures de protection contre l\'incendie',
            'Parties réceptionnées ou mises en service',
            'Sue & Labor',
            'Biens entreposés hors chantier',
            'Baraquements et dépôts',
            'Installations provisoires du chantier',
            'Installations, équipements et engins de chantiers',
          ],
          dureeFranchise: [
            'Tests & Essais',
            'Maintenance visite',
            'Maintenance étendue',
            'Dérogation au planning',
          ],
          montant: [
            'Frais de déblais et démolition',
            'Frais de déblais suite à un glissement de terrain',
            'Frais supplémentaires pour travail de nuit et transport à grande vitesse',
            'Frais supplémentaires pour transport aérien',
            'Honoraires d\'experts',
          ],
        },
        responsabiliteCivile: {
          montantFranchise: [
            'Responsabilité Civile pendant les travaux',
            'Tuyaux, câbles et canalisations enterrées',
            'Vibrations, suppression ou affaiblissement des points d’appui',
          ],
          none: ['RC croisée'],
        },
      };

      useEffect(() => {
        if (quoteData.chantier.dateDebut && quoteData.chantier.dureeTravaux) {
          calculateEndDate();
        }
      }, [quoteData.chantier.dateDebut, quoteData.chantier.dureeTravaux]);

      useEffect(() => {
        calculatePrime();
      }, [quoteData.prime.primeNette, quoteData.garanties]);

      useEffect(() => {
        if (step === 3 && quoteData.chantier.montantTravaux && quoteData.garanties.length === 0) {
          setQuoteData((prevData) => ({
            ...prevData,
            garanties: [
              {
                id: uuidv4(),
                nom: 'Dommages à l\'ouvrage',
                type: 'montantFranchise',
                montant: prevData.chantier.montantTravaux,
                duree: '',
                franchise: '',
                volet: 'dommage',
              },
            ],
          }));
        }
      }, [step, quoteData.chantier.montantTravaux, quoteData.garanties]);

      const handleInputChange = (e, section = null) => {
        const { name, value } = e.target;
        setQuoteData((prevData) => {
          if (section) {
            return {
              ...prevData,
              [section]: {
                ...prevData[section],
                [name]: value,
              },
            };
          }
          return { ...prevData, [name]: value };
        });
      };

      const handleAddGarantie = () => {
        setQuoteData((prevData) => ({
          ...prevData,
          garanties: [...prevData.garanties, { id: uuidv4(), nom: '', type: '', montant: '', duree: '', franchise: '', volet: '' }],
        }));
      };

      const handleGarantieChange = (e, index) => {
        const { name, value } = e.target;
        setQuoteData((prevData) => {
          const updatedGaranties = [...prevData.garanties];
          updatedGaranties[index] = { ...updatedGaranties[index], [name]: value };
          return { ...prevData, garanties: updatedGaranties };
        });
      };

      const handleRemoveGarantie = (index) => {
        setQuoteData((prevData) => ({
          ...prevData,
          garanties: prevData.garanties.filter((_, i) => i !== index),
        }));
      };

      const nextStep = () => {
        if (step === 1 && !quoteData.souscripteur.nom) {
          setError('Souscripteur name is required.');
          return;
        }
        if (step === 2 && (!quoteData.chantier.natureTravaux || !quoteData.chantier.situationTravaux || !quoteData.chantier.montantTravaux || !quoteData.chantier.dureeTravaux || !quoteData.chantier.dateDebut)) {
          setError('Please fill in all required fields.');
          return;
        }
        if (step === 4 && !quoteData.prime.primeNette) {
          setError('Prime Nette is required.');
          return;
        }
        setStep(step + 1);
        setError('');
      };

      const prevStep = () => {
        setStep(step - 1);
      };

      const handleSubmit = async () => {
        try {
          if (step === 4) {
            await generateAndDownloadDocument();
          }
          const quotes = await fetchQuotes();
          const updatedQuotes = [...quotes, quoteData];
          await saveQuotes(updatedQuotes);
          setSuccess('Quote saved successfully!');
          setError('');
          setQuoteData({
            id: uuidv4(),
            souscripteur: {
              nom: user ? user.nom : '',
              adresse: '',
              maitreOuvrage: '',
              adresseMaitreOuvrage: '',
            },
            chantier: {
              numeroMarche: '',
              natureTravaux: '',
              situationTravaux: '',
              montantTravaux: '',
              dureeTravaux: '1',
              dateDebut: '',
              dateFin: '',
            },
            garanties: [],
            prime: {
              primeNette: '',
              primeEvcat: 0,
              taxes: 0,
              accessoires: 25,
              primeTotale: 0,
            },
            status: 'draft',
          });
          setStep(1);
        } catch (err) {
          setError('Failed to save quote.');
          setSuccess('');
        }
      };

      const fetchQuotes = async () => {
        try {
          const response = await fetch('/data/quotes.json');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
        } catch (error) {
          console.error('Failed to fetch quotes:', error);
          return [];
        }
      };

      const saveQuotes = async (quotes) => {
        try {
          const response = await fetch('/data/quotes.json', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(quotes),
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (error) {
          console.error('Failed to save quotes:', error);
          throw error;
        }
      };

      const calculateEndDate = () => {
        if (quoteData.chantier.dateDebut && quoteData.chantier.dureeTravaux) {
          const startDate = new Date(quoteData.chantier.dateDebut);
          const durationInMonths = parseInt(quoteData.chantier.dureeTravaux, 10);
          const endDate = new Date(startDate);
          endDate.setMonth(startDate.getMonth() + durationInMonths);
          setQuoteData((prevData) => ({
            ...prevData,
            chantier: {
              ...prevData.chantier,
              dateFin: endDate.toISOString().split('T')[0],
            },
          }));
        }
      };

      const calculatePrime = () => {
        const { primeNette } = quoteData.prime;
        if (!primeNette) {
          setQuoteData((prevData) => ({
            ...prevData,
            prime: {
              ...prevData.prime,
              primeEvcat: 0,
              taxes: 0,
              primeTotale: 0,
            },
          }));
          return;
        }
        const hasDommage = quoteData.garanties.some((garantie) => garantie.volet === 'dommage');
        const hasResponsabiliteCivile = quoteData.garanties.some((garantie) => garantie.volet === 'responsabiliteCivile');
        const primeEvcatRate = hasDommage && hasResponsabiliteCivile ? 0.068 : 0.08;
        const primeEvcat = Number(primeNette) * primeEvcatRate;
        const taxes = (Number(primeNette) + primeEvcat) * 0.15;
        const primeTotale = Number(primeNette) + primeEvcat + taxes + 25;

        setQuoteData((prevData) => ({
          ...prevData,
          prime: {
            ...prevData.prime,
            primeEvcat: primeEvcat,
            taxes: taxes,
            primeTotale: primeTotale,
          },
        }));
      };

      const formatNumber = (value) => {
        if (value === null || value === undefined) return '';
        const num = Number(value);
        if (isNaN(num)) return value;
        return num.toLocaleString('fr-FR');
      };

      const generateAndDownloadDocument = async () => {
        try {
          const doc = new Document({
            sections: [
              {
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Souscripteur: ${quoteData.souscripteur.nom}`,
                        bold: true,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Adresse Souscripteur: ${quoteData.souscripteur.adresse}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Maitre d'Ouvrage: ${quoteData.souscripteur.maitreOuvrage}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Adresse Maitre d'Ouvrage: ${quoteData.souscripteur.adresseMaitreOuvrage}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Numéro de Marché: ${quoteData.chantier.numeroMarche}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Nature des Travaux: ${quoteData.chantier.natureTravaux}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Situation des Travaux: ${quoteData.chantier.situationTravaux}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Montant des Travaux: ${formatNumber(quoteData.chantier.montantTravaux)}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Durée des Travaux: ${quoteData.chantier.dureeTravaux} mois`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Date de Début des Travaux: ${quoteData.chantier.dateDebut}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Date de Fin des Travaux: ${quoteData.chantier.dateFin}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Prime Nette: ${formatNumber(quoteData.prime.primeNette)}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Prime EVCAT: ${formatNumber(quoteData.prime.primeEvcat)}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Taxes: ${formatNumber(quoteData.prime.taxes)}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Accessoires: ${formatNumber(quoteData.prime.accessoires)}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Prime Totale: ${formatNumber(quoteData.prime.primeTotale)}`,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Garanties:',
                        bold: true,
                      }),
                    ],
                  }),
                  ...quoteData.garanties.map((garantie, index) => (
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Garantie ${index + 1}: ${garantie.nom} - Volet: ${garantie.volet} - Montant: ${formatNumber(garantie.montant)} - Franchise: ${formatNumber(garantie.franchise)} - Durée: ${garantie.duree}`,
                        }),
                      ],
                    })
                  )),
                ],
              },
            ],
          });

          const buffer = await Packer.toBuffer(doc);
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'Devis.docx';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error generating document:', error);
          setError('Failed to generate document.');
        }
      };

      const renderStep = () => {
        switch (step) {
          case 1:
            return (
              <div>
                <h2>Informations sur le Souscripteur</h2>
                <label>Souscripteur (obligatoire)</label>
                <input type="text" name="nom" value={quoteData.souscripteur.nom} onChange={(e) => handleInputChange(e, 'souscripteur')} />
                <label>Adresse du Souscripteur</label>
                <input type="text" name="adresse" value={quoteData.souscripteur.adresse} onChange={(e) => handleInputChange(e, 'souscripteur')} />
                <label>Maitre d'Ouvrage</label>
                <input type="text" name="maitreOuvrage" value={quoteData.souscripteur.maitreOuvrage} onChange={(e) => handleInputChange(e, 'souscripteur')} />
                <label>Adresse du Maitre d'Ouvrage</label>
                <input type="text" name="adresseMaitreOuvrage" value={quoteData.souscripteur.adresseMaitreOuvrage} onChange={(e) => handleInputChange(e, 'souscripteur')} />
                <button onClick={nextStep}>Next</button>
              </div>
            );
          case 2:
            return (
              <div>
                <h2>Informations sur le Chantier</h2>
                <label>Numéro de Marché</label>
                <input type="text" name="numeroMarche" value={quoteData.chantier.numeroMarche} onChange={(e) => handleInputChange(e, 'chantier')} />
                <label>Nature des Travaux (obligatoire)</label>
                <input type="text" name="natureTravaux" value={quoteData.chantier.natureTravaux} onChange={(e) => handleInputChange(e, 'chantier')} />
                <label>Situation des Travaux (obligatoire)</label>
                <input type="text" name="situationTravaux" value={quoteData.chantier.situationTravaux} onChange={(e) => handleInputChange(e, 'chantier')} />
                <label>Montant des Travaux (obligatoire)</label>
                <input type="number" name="montantTravaux" value={quoteData.chantier.montantTravaux} onChange={(e) => handleInputChange(e, 'chantier')} />
                <label>Durée des Travaux (obligatoire)</label>
                <select name="dureeTravaux" value={quoteData.chantier.dureeTravaux} onChange={(e) => handleInputChange(e, 'chantier')}>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>{month} mois</option>
                  ))}
                  <option value="specific">Spécifique</option>
                </select>
                <label>Date de Début des Travaux (obligatoire)</label>
                <input type="date" name="dateDebut" value={quoteData.chantier.dateDebut} onChange={(e) => handleInputChange(e, 'chantier')} />
                <label>Date de Fin des Travaux</label>
                <input type="date" name="dateFin" value={quoteData.chantier.dateFin} readOnly />
                <button onClick={prevStep}>Previous</button>
                <button onClick={nextStep}>Next</button>
              </div>
            );
          case 3:
            return (
              <div>
                <h2>Garanties</h2>
                {quoteData.garanties.map((garantie, index) => (
                  <div key={garantie.id}>
                    <h3>Garantie {index + 1}</h3>
                    <label>Volet</label>
                    <select name="volet" value={garantie.volet} onChange={(e) => handleGarantieChange(e, index)}>
                      <option value="">Select Volet</option>
                      <option value="dommage">Dommage</option>
                      <option value="responsabiliteCivile">Responsabilité Civile</option>
                    </select>
                    {garantie.volet && (
                      <>
                        <label>Nom</label>
                        <select name="nom" value={garantie.nom} onChange={(e) => handleGarantieChange(e, index)}>
                          <option value="">Select Garantie</option>
                          {guaranteeOptions[garantie.volet] &&
                            Object.values(guaranteeOptions[garantie.volet]).flat().map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                      </>
                    )}
                    {garantie.nom && (
                      <>
                        {Object.keys(guaranteeOptions.dommage).some(key => guaranteeOptions.dommage[key].includes(garantie.nom)) && (
                          <>
                            {guaranteeOptions.dommage.montantFranchise.includes(garantie.nom) && (
                              <>
                                <label>Montant</label>
                                <input type="number" name="montant" value={garantie.montant} onChange={(e) => handleGarantieChange(e, index)} />
                                <label>Franchise</label>
                                <input type="number" name="franchise" value={garantie.franchise} onChange={(e) => handleGarantieChange(e, index)} />
                                <p>Montant: {formatNumber(garantie.montant)}</p>
                                <p>Franchise: {formatNumber(garantie.franchise)}</p>
                              </>
                            )}
                            {guaranteeOptions.dommage.dureeFranchise.includes(garantie.nom) && (
                              <>
                                <label>Durée</label>
                                <input type="number" name="duree" value={garantie.duree} onChange={(e) => handleGarantieChange(e, index)} />
                                <label>Franchise</label>
                                <input type="number" name="franchise" value={garantie.franchise} onChange={(e) => handleGarantieChange(e, index)} />
                                <p>Franchise: {formatNumber(garantie.franchise)}</p>
                              </>
                            )}
                            {guaranteeOptions.dommage.montant.includes(garantie.nom) && (
                              <>
                                <label>Montant</label>
                                <input type="number" name="montant" value={garantie.montant} onChange={(e) => handleGarantieChange(e, index)} />
                                <p>Montant: {formatNumber(garantie.montant)}</p>
                              </>
                            )}
                          </>
                        )}
                        {Object.keys(guaranteeOptions.responsabiliteCivile).some(key => guaranteeOptions.responsabiliteCivile[key].includes(garantie.nom)) && (
                          <>
                            {guaranteeOptions.responsabiliteCivile.montantFranchise.includes(garantie.nom) && (
                              <>
                                <label>Montant</label>
                                <input type="number" name="montant" value={garantie.montant} onChange={(e) => handleGarantieChange(e, index)} />
                                <label>Franchise</label>
                                <input type="number" name="franchise" value={garantie.franchise} onChange={(e) => handleGarantieChange(e, index)} />
                                <p>Montant: {formatNumber(garantie.montant)}</p>
                                <p>Franchise: {formatNumber(garantie.franchise)}</p>
                              </>
                            )}
                          </>
                        )}
                      </>
                    )}
                    <button onClick={() => handleRemoveGarantie(index)}>Remove</button>
                  </div>
                ))}
                <button onClick={handleAddGarantie}>Add Garantie</button>
                <button onClick={prevStep}>Previous</button>
                <button onClick={nextStep}>Next</button>
              </div>
            );
          case 4:
            return (
              <div>
                <h2>Prime</h2>
                <label>Prime Nette (obligatoire)</label>
                <input type="number" name="primeNette" value={quoteData.prime.primeNette} onChange={(e) => handleInputChange(e, 'prime')} />
                <label>Prime EVCAT</label>
                <input type="text" value={formatNumber(quoteData.prime.primeEvcat)} readOnly />
                <label>Taxes</label>
                <input type="text" value={formatNumber(quoteData.prime.taxes)} readOnly />
                <label>Accessoires</label>
                <input type="text" value={formatNumber(quoteData.prime.accessoires)} readOnly />
                <label>Prime Totale</label>
                <input type="text" value={formatNumber(quoteData.prime.primeTotale)} readOnly />
                <button onClick={prevStep}>Previous</button>
                <button onClick={handleSubmit}>Submit</button>
              </div>
            );
          default:
            return null;
        }
      };

      return (
        <div>
          <h1>Quote Wizard</h1>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          {renderStep()}
        </div>
      );
    };

    export default QuoteWizard;
