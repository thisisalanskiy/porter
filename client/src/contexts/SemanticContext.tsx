import React, { createContext, useContext, useState, useEffect } from 'react';
import { SemanticField, SemanticLayer } from '../types';

interface SemanticContextValue {
  semanticLayer: SemanticLayer;
  addField: (field: Omit<SemanticField, 'id'>) => void;
  updateField: (id: string, updates: Partial<SemanticField>) => void;
  removeField: (id: string) => void;
  clearFields: () => void;
}

const STORAGE_KEY = 'semanticLayer';

const defaultLayer: SemanticLayer = { fields: [] };

const SemanticContext = createContext<SemanticContextValue>({
  semanticLayer: defaultLayer,
  addField: () => {},
  updateField: () => {},
  removeField: () => {},
  clearFields: () => {},
});

export const SemanticProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [semanticLayer, setSemanticLayer] = useState<SemanticLayer>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultLayer;
    } catch {
      return defaultLayer;
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(semanticLayer));
    } catch {
      // storage quota exceeded — silently ignore
    }
  }, [semanticLayer]);

  const addField = (field: Omit<SemanticField, 'id'>) => {
    const newField: SemanticField = {
      ...field,
      id: `sf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setSemanticLayer(prev => ({ fields: [...prev.fields, newField] }));
  };

  const updateField = (id: string, updates: Partial<SemanticField>) => {
    setSemanticLayer(prev => ({
      fields: prev.fields.map(f => (f.id === id ? { ...f, ...updates } : f)),
    }));
  };

  const removeField = (id: string) => {
    setSemanticLayer(prev => ({
      fields: prev.fields.filter(f => f.id !== id),
    }));
  };

  const clearFields = () => {
    setSemanticLayer(defaultLayer);
  };

  return (
    <SemanticContext.Provider value={{ semanticLayer, addField, updateField, removeField, clearFields }}>
      {children}
    </SemanticContext.Provider>
  );
};

export const useSemanticLayer = () => useContext(SemanticContext);

export default SemanticContext;
