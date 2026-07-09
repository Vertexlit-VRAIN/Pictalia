import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { GenerateWorksheetView } from './components/GenerateWorksheetView';
import { ProfileView } from './components/ProfileView';
import { useAppDataManager } from './hooks/useProfileManager';
import type { SavedWorksheet } from './types';
import { Trash2, FolderOpenIcon, DownloadIcon, CheckCircleIcon } from './components/Icons';
import { useDynamicLibraries } from './hooks/useDynamicLibraries';
import { exportWorksheetAsPdf } from './lib/worksheetExport';
import { WorksheetEditor } from './components/WorksheetEditor';
import { TranslatorView } from './components/TranslatorView';
import { InteractiveWorksheetPlay } from './components/exercises/InteractiveWorksheetPlay';

type View = 'generate' | 'profile' | 'library' | 'translator';

// ... (LibraryView component remains unchanged)
const GamepadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="6" x2="10" y1="12" y2="12" />
    <line x1="8" x2="8" y1="10" y2="14" />
    <line x1="15" x2="15.01" y1="13" y2="13" />
    <line x1="18" x2="18.01" y1="11" y2="11" />
    <rect width="20" height="12" x="2" y="6" rx="3" />
  </svg>
);

const LibraryView: React.FC = () => {
  const { 
    savedWorksheets, 
    deleteWorksheet, 
    isLoading, 
    activeProfile, 
    updateWorksheet,
    pictogramSettings,
    updatePictogramSettings
  } = useAppDataManager();
  const [selectedWorksheet, setSelectedWorksheet] = useState<SavedWorksheet | null>(null);
  const [activePlayWorksheet, setActivePlayWorksheet] = useState<SavedWorksheet | null>(null);

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

  const handleUpdateWorksheet = useCallback((ws: SavedWorksheet) => {
    updateWorksheet(ws);
    setSelectedWorksheet(ws);
  }, [updateWorksheet]);

  if (isLoading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-600 shadow-xl shadow-slate-200/50">Cargando biblioteca...</div>;
  }

  if (activePlayWorksheet) {
    return (
      <InteractiveWorksheetPlay
        worksheet={activePlayWorksheet}
        onClose={() => setActivePlayWorksheet(null)}
      />
    );
  }
  
  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-5">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50">
            <div className="mb-4 flex items-center gap-3 px-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <FolderOpenIcon className="h-5 w-5" />
              </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Biblioteca</h3>
              <p className="text-sm text-slate-500">
                Fichas de <span className="font-semibold text-sky-700">{activeProfile?.name || 'Perfil actual'}</span>
              </p>
            </div>
          </div>
          {savedWorksheets.length > 0 ? (
            <div className="space-y-2 max-h-[72vh] overflow-y-auto">
              {savedWorksheets.map(ws => (
                <div
                  key={ws.id}
                  className={`group flex items-start justify-between rounded-2xl p-2 transition-all duration-200 ${
                    selectedWorksheet?.id === ws.id
                      ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-sky-50'
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedWorksheet(ws);
                      setDownloadError(null);
                    }}
                    className="flex flex-1 items-start text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600 rounded-xl p-1"
                    aria-pressed={selectedWorksheet?.id === ws.id}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm leading-tight">{ws.title}</p>
                      <p className={`mt-1 text-xs ${selectedWorksheet?.id === ws.id ? 'text-sky-700/80' : 'text-slate-500'}`}>
                        {new Date(ws.createdAt).toLocaleDateString()} - {ws.sourceDescription}
                      </p>
                    </div>
                    {selectedWorksheet?.id === ws.id && <CheckCircleIcon className="ml-2 h-4 w-4 flex-shrink-0 text-sky-700" />}
                  </button>
                   <button
                    onClick={() => setActivePlayWorksheet(ws)}
                    title="Modo Alumno"
                    className={`ml-2 rounded-full p-2 opacity-50 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
                      selectedWorksheet?.id === ws.id 
                        ? 'hover:bg-sky-200 text-indigo-900' 
                        : 'hover:bg-indigo-50 text-indigo-650'
                    }`}
                    aria-label={`Jugar ficha ${ws.title}`}
                  >
                    <GamepadIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      deleteWorksheet(ws.id);
                      if (selectedWorksheet?.id === ws.id) {
                        setSelectedWorksheet(null);
                      }
                    }}
                    title="Eliminar ficha"
                    className={`ml-2 rounded-full p-2 opacity-50 transition-opacity group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-500 ${
                      selectedWorksheet?.id === ws.id ? 'hover:bg-sky-200' : 'hover:bg-rose-100'
                    }`}
                    aria-label={`Eliminar ficha ${ws.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-4 text-center text-sm text-slate-500">No tienes fichas guardadas para este perfil. Genera una y aparecerá aquí.</p>
          )}
        </div>
      </div>
      <div className="min-w-0">
        {selectedWorksheet ? (
          <div className="flex flex-col">
            <WorksheetEditor 
              worksheet={selectedWorksheet}
              setWorksheet={(ws) => {
                updateWorksheet(ws);
                setSelectedWorksheet(ws);
              }}
              onSave={(ws) => {
                updateWorksheet(ws);
                setSelectedWorksheet(ws);
              }}
              onCancel={() => setSelectedWorksheet(null)}
              onDownload={handleDownload}
              isDownloadReady={libsReady}
              isDownloading={isDownloading}
              onPlay={() => setActivePlayWorksheet(selectedWorksheet)}
              searchLanguage={pictogramSettings.searchLanguage || 'es'}
              onSearchLanguageChange={(lang) => updatePictogramSettings({ searchLanguage: lang })}
              worksheetRef={worksheetRef}
              isSaved={true}
            />

            {downloadError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
                <strong>Error al descargar:</strong> {downloadError}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-[28px] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <DownloadIcon className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-slate-800">Selecciona una ficha de la biblioteca para verla aquí.</p>
              <p className="mt-2 text-sm text-slate-500">Desde esta vista podrás descargarla en PDF o abrir el modo edición.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('generate');

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(167,243,208,0.18),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] font-sans text-slate-800">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido principal
      </a>
      <Header activeView={activeView} setActiveView={setActiveView} />
      <main id="main-content" className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {activeView === 'generate' && <GenerateWorksheetView />}
        {activeView === 'library' && <LibraryView />}
        {activeView === 'profile' && <ProfileView />}
        {activeView === 'translator' && <TranslatorView />}
      </main>
    </div>
  );
};

export default App;
