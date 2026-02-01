import React, { useState } from 'react';

interface ApiKeyManagerProps {
  onApiKeyValid: () => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onApiKeyValid }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey);
      onApiKeyValid();
    } else {
      setError('Por favor, introduce una clave de API válida.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h2>Configurar Clave de API de Gemini</h2>
      <p>
        Para usar esta aplicación, necesitas una clave de API de Google Gemini.
        Puedes obtener una en{' '}
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
          Google AI Studio
        </a>.
      </p>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Introduce tu clave de API"
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />
      <button onClick={handleSaveApiKey} style={{ padding: '10px 20px' }}>
        Guardar Clave
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ApiKeyManager;
