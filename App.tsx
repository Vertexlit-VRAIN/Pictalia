import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { GenerateWorksheetView } from './components/GenerateWorksheetView';
import { AdaptWorksheetView } from './components/AdaptWorksheetView';
import { ProfileView } from './components/ProfileView';
import { useAppDataManager } from './hooks/useProfileManager';
import type { SavedWorksheet } from './types';
import { WorksheetResult } from './components/WorksheetResult';
import { Trash2, Edit3 } from './components/Icons';
import { useDynamicLibraries } from './hooks/useDynamicLibraries';
import { exportWorksheetAsPdf } from './lib/pdfUtils';
import { WorksheetEditor } from './components/WorksheetEditor';
import ApiKeyManager from './components/ApiKeyManager';

type View = 'generate' | 'adapt' | 'profile' | 'library';

// ... (LibraryView component remains unchanged)
const LibraryView: React.FC = () => {
  const { savedWorksheets, deleteWorksheet, isLoading, activeProfile, updateWorksheet } = useAppDataManager();
  const [selectedWorksheet, setSelectedWorksheet] = useState<SavedWorksheet | null>(null);
  const [editingWorksheet, setEditingWorksheet] = useState<SavedWorksheet | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const worksheetRef = useRef<HTMLDivElement>(null);
  const { libsReady } = useDynamicLibraries(['jspdf', 'html2canvas']);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    if (worksheetRef.current && selectedWorksheet) {
      setIsDownloading(true);
      setDownloadError(null);
      const fileName = `ficha_${selectedWorksheet.title.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      try {
        await exportWorksheetAsPdf(worksheetRef.current, fileName);
      } catch (err: any) {
        console.error("Error exporting PDF:", err);
        setDownloadError(err.message || 'No se pudo generar el PDF. Inténtalo de nuevo.');
      } finally {
        setIsDownloading(false);
      }
    }
  }, [selectedWorksheet]);

  const handleEdit = () => {
    if (selectedWorksheet) {
      // Deep clone to avoid mutating the original state directly
      setEditingWorksheet(JSON.parse(JSON.stringify(selectedWorksheet)));
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingWorksheet(null);
  };
  
  const handleSaveChanges = () => {
    if (editingWorksheet) {
      updateWorksheet(editingWorksheet);
      setSelectedWorksheet(editingWorksheet);
      setIsEditing(false);
      setEditingWorksheet(null);
    }
  };

  if (isLoading) {
    return <div>Cargando biblioteca...</div>;
  }
  
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">
            Fichas de: <span className="text-indigo-600">{activeProfile?.name || 'Perfil Actual'}</span>
          </h3>
          {savedWorksheets.length > 0 ? (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {savedWorksheets.map(ws => (
                <div
                  key={ws.id}
                  onClick={() => {
                    if (!isEditing) {
                      setSelectedWorksheet(ws);
                      setDownloadError(null);
                    }
                  }}
                  className={`flex items-start justify-between p-3 rounded-lg transition-colors duration-200 group ${
                    isEditing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  } ${
                    selectedWorksheet?.id === ws.id
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-gray-100 hover:bg-indigo-100 text-gray-700'
                  }`}
                  role="button"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{ws.title}</p>
                    <p className={`text-xs mt-1 ${selectedWorksheet?.id === ws.id ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {new Date(ws.createdAt).toLocaleDateString()} - {ws.sourceDescription}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWorksheet(ws.id);
                      if (selectedWorksheet?.id === ws.id) {
                        setSelectedWorksheet(null);
                      }
                    }}
                    title="Eliminar ficha"
                    className={`p-1 rounded-full opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2 ${
                      selectedWorksheet?.id === ws.id ? 'hover:bg-indigo-500' : 'hover:bg-red-200'
                    } ${isEditing ? 'hidden' : ''}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 p-4 text-center">No tienes fichas guardadas para este perfil. ¡Genera una y guárdala aquí!</p>
          )}
        </div>
      </div>
      <div className="lg:col-span-2">
        {selectedWorksheet ? (
          <div className="flex flex-col">
            {isEditing && editingWorksheet ? (
              <WorksheetEditor 
                worksheet={editingWorksheet}
                setWorksheet={setEditingWorksheet}
                onSave={handleSaveChanges}
                onCancel={handleCancelEdit}
              />
            ) : (
              <WorksheetResult
                ref={worksheetRef}
                worksheet={selectedWorksheet}
                onDownload={handleDownload}
                isDownloadReady={libsReady}
                title="Vista Previa de Ficha Guardada"
                isDownloading={isDownloading}
                onEdit={handleEdit}
              />
            )}

            {downloadError && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm" role="alert">
                <strong>Error al descargar:</strong> {downloadError}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center bg-white h-full rounded-xl shadow-lg border border-gray-200 p-8">
            <p className="text-center text-gray-500">Selecciona una ficha de la biblioteca para verla aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('generate');
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key');
    if (key) {
      setIsApiKeyValid(true);
    }
  }, []);

  const handleApiKeyValid = () => {
    setIsApiKeyValid(true);
  };

  if (!isApiKeyValid) {
    return <ApiKeyManager onApiKeyValid={handleApiKeyValid} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header activeView={activeView} setActiveView={setActiveView} />
      <main className="p-4 sm:p-6 lg:p-8">
        {activeView === 'generate' && <GenerateWorksheetView />}
        {activeView === 'adapt' && <AdaptWorksheetView />}
        {activeView === 'library' && <LibraryView />}
        {activeView === 'profile' && <ProfileView />}
      </main>
      <footer className="text-center p-4 text-xs text-gray-400">
        <p>&copy; 2024 Generador de Fichas Adaptadas. Creado con IA para la educación inclusiva.</p>
      </footer>
    </div>
  );
};

export default App;
