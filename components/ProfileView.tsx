import React, { useState } from 'react';
import { useAppDataManager } from '../hooks/useProfileManager';
import { SaveIcon, RotateCcwIcon, UserPlus, Trash2, Edit3, ShieldCheckIcon, PaletteIcon, SparklesIcon, CheckCircleIcon } from './Icons';
import { Spinner } from './Spinner';
import type { AIProvider, PictogramProvider } from '../types';

// Simple modal component
const SaveProfileModal: React.FC<{ onSave: (name: string) => void; onClose: () => void; }> = ({ onSave, onClose }) => {
    const [name, setName] = useState('');

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <h3 id="modal-title" className="text-lg font-bold text-gray-800">Guardar Nuevo Perfil</h3>
                <p className="text-sm text-gray-500 mt-1">Dale un nombre a este nuevo perfil para identificarlo.</p>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Perfil para Juanito"
                    className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <div className="mt-5 flex justify-end gap-3">
                    <button onClick={onClose} className="rounded-xl bg-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600">Cancelar</button>
                    <button onClick={handleSave} disabled={!name.trim()} className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600">Guardar</button>
                </div>
            </div>
        </div>
    );
};


export const ProfileView: React.FC = () => {
  const {
    profiles,
    activeProfile,
    editorContent,
    setEditorContent,
    isLoading,
    hasChanges,
    saveMessage,
    selectProfile,
    updateActiveProfile,
    saveNewProfile,
    deleteProfile,
    restoreDefault,
    togglePictogramInstructions,
    aiSettings,
    updateAISettings,
    pictogramSettings,
    updatePictogramSettings,
  } = useAppDataManager();

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading || !activeProfile) {
    return (
      <div className="max-w-6xl mx-auto flex justify-center items-center p-10">
        <Spinner className="text-indigo-600" />
        <span className="ml-3 text-gray-600">Cargando perfiles...</span>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {isModalOpen && <SaveProfileModal onSave={saveNewProfile} onClose={() => setIsModalOpen(false)} />}
      
      {/* Profile List Column */}
      <div className="lg:col-span-1">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50">
          <div className="mb-4 flex items-center gap-3 px-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Perfiles guardados</h3>
              <p className="text-sm text-slate-500">Gestiona perfiles y preferencias.</p>
            </div>
          </div>
          <div className="space-y-2">
            {profiles.map(profile => (
              <div
                key={profile.id}
                className={`group flex items-center justify-between rounded-2xl p-2 transition-all duration-200 ${
                  activeProfile.id === profile.id
                    ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-sky-50'
                }`}
              >
                <button
                  onClick={() => selectProfile(profile.id)}
                  className="flex flex-1 items-center justify-between rounded-xl p-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
                  aria-pressed={activeProfile.id === profile.id}
                >
                  <span className="font-semibold text-sm">{profile.name}</span>
                  {activeProfile.id === profile.id && <CheckCircleIcon className="h-4 w-4 text-sky-700" />}
                </button>
                <button
                  onClick={() => {
                    deleteProfile(profile.id);
                  }}
                  title="Eliminar perfil"
                  className={`rounded-full p-2 opacity-50 transition-opacity group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-500 ${
                    activeProfile.id === profile.id ? 'hover:bg-sky-200' : 'hover:bg-rose-100'
                  } ${profiles.length <= 1 ? 'pointer-events-none opacity-30' : ''}`}
                  aria-label={`Eliminar perfil ${profile.name}`}
                  disabled={profiles.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-4 py-3 font-semibold text-emerald-800 transition-colors duration-200 hover:bg-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
            >
              <UserPlus className="h-5 w-5" />
              <span>Guardar como Nuevo Perfil</span>
            </button>
        </div>
      </div>

      {/* Profile Editor Column */}
      <div className="lg:col-span-2">
        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <h2 className="mb-1 flex items-center gap-2 text-xl font-black text-slate-900"><SparklesIcon className="h-5 w-5 text-amber-500" />Proveedor de IA</h2>
          <p className="mb-5 text-sm text-slate-500">
            Selecciona un único proveedor activo. La aplicación no se bloquea si falta configuración, pero las acciones de IA sí la requieren.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="ai-provider" className="block text-sm font-semibold text-gray-700 mb-1">
                  Proveedor activo
                </label>
                <select
                  id="ai-provider"
                  value={aiSettings.provider}
                  onChange={(e) => updateAISettings({ provider: e.target.value as AIProvider })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  <option value="gemini">Gemini API</option>
                  <option value="ollama">Ollama local</option>
                </select>
              </div>

              <div>
                <label htmlFor="gemini-model" className="block text-sm font-semibold text-gray-700 mb-1">
                  Modelo de Gemini
                </label>
                <input
                  id="gemini-model"
                  type="text"
                  value={aiSettings.geminiModel}
                  onChange={(e) => updateAISettings({ geminiModel: e.target.value })}
                  placeholder="gemini-2.5-flash"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label htmlFor="gemini-api-key" className="block text-sm font-semibold text-gray-700 mb-1">
                  API key de Gemini
                </label>
                <input
                  id="gemini-api-key"
                  type="password"
                  value={aiSettings.geminiApiKey}
                  onChange={(e) => updateAISettings({ geminiApiKey: e.target.value })}
                  placeholder="AIza..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="ollama-url" className="block text-sm font-semibold text-gray-700 mb-1">
                  URL base de Ollama
                </label>
                <input
                  id="ollama-url"
                  type="text"
                  value={aiSettings.ollamaBaseUrl}
                  onChange={(e) => updateAISettings({ ollamaBaseUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label htmlFor="ollama-model" className="block text-sm font-semibold text-gray-700 mb-1">
                  Modelo de Ollama
                </label>
                <input
                  id="ollama-model"
                  type="text"
                  value={aiSettings.ollamaModel}
                  onChange={(e) => updateAISettings({ ollamaModel: e.target.value })}
                  placeholder="gemma4:e4b"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="mb-1 font-semibold text-slate-700">Activo ahora: {aiSettings.provider === 'gemini' ? 'Gemini API' : 'Ollama local'}</p>
                <p>
                  {aiSettings.provider === 'gemini'
                    ? 'Se usará la clave y el modelo de Gemini para generar y refinar fichas.'
                    : 'Se usará tu servidor local de Ollama. Asegúrate de que el modelo esté descargado y el endpoint sea accesible desde el navegador.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <h2 className="mb-1 flex items-center gap-2 text-xl font-black text-slate-900"><PaletteIcon className="h-5 w-5 text-rose-500" />Proveedor de pictogramas</h2>
          <p className="mb-5 text-sm text-slate-500">
            La app puede buscar pictogramas en ARASAAC o en una API privada compatible. La interfaz queda preparada para cambiar de proveedor sin tocar el editor.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="picto-provider" className="block text-sm font-semibold text-gray-700 mb-1">
                  Proveedor activo
                </label>
                <select
                  id="picto-provider"
                  value={pictogramSettings.provider}
                  onChange={(e) => updatePictogramSettings({ provider: e.target.value as PictogramProvider })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  <option value="arasaac_official">ARASAAC oficial</option>
                  <option value="private_api">API privada</option>
                </select>
              </div>

              <div>
                <label htmlFor="arasaac-url" className="block text-sm font-semibold text-gray-700 mb-1">
                  URL base ARASAAC
                </label>
                <input
                  id="arasaac-url"
                  type="text"
                  value={pictogramSettings.arasaacApiUrl}
                  onChange={(e) => updatePictogramSettings({ arasaacApiUrl: e.target.value })}
                  placeholder="https://api.arasaac.org/api/pictograms"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="private-picto-url" className="block text-sm font-semibold text-gray-700 mb-1">
                  URL base API privada
                </label>
                <input
                  id="private-picto-url"
                  type="text"
                  value={pictogramSettings.privateApiUrl}
                  onChange={(e) => updatePictogramSettings({ privateApiUrl: e.target.value })}
                  placeholder="http://localhost:3001/api/pictograms"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-gray-700 mb-1">
                  Activo ahora: {pictogramSettings.provider === 'arasaac_official' ? 'ARASAAC oficial' : 'API privada'}
                </p>
                <p>
                  {pictogramSettings.provider === 'arasaac_official'
                    ? 'Las búsquedas de pictogramas usan la API pública de ARASAAC.'
                    : 'Las búsquedas de pictogramas usan vuestra API privada. El servicio espera un endpoint /search?query=... que devuelva items con url.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <div>
              <h2 className="mb-1 flex items-center gap-2 text-xl font-black text-slate-900">
                <Edit3 className="h-5 w-5 text-sky-600" />
                Editando: <span className="text-sky-700">{activeProfile.name}</span>
              </h2>
              <p className="text-sm text-slate-500">
                Modifica el perfil aquí. Los cambios se aplicarán a las nuevas fichas que generes.
              </p>
            </div>
            {/* Toggle Switch */}
            <div className="flex-shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <label htmlFor="picto-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            id="picto-toggle" 
                            className="sr-only"
                            checked={activeProfile.showPictogramInstructions}
                            onChange={(e) => togglePictogramInstructions(e.target.checked)}
                        />
                        <div className={`block h-7 w-12 rounded-full transition-colors ${activeProfile.showPictogramInstructions ? 'bg-sky-600' : 'bg-slate-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${activeProfile.showPictogramInstructions ? 'translate-x-full' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm font-semibold text-slate-700">
                        Instrucciones con Pictos
                    </div>
                </label>
            </div>
          </div>
          <textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            className="h-96 w-full rounded-2xl border border-slate-300 p-4 font-mono text-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
            placeholder="Describe las capacidades, dificultades e intereses del niño..."
            aria-label="Editor de perfil del niño"
          />
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-4">
              <button
                onClick={updateActiveProfile}
                disabled={!hasChanges}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
              >
                <SaveIcon className="h-5 w-5" />
                <span>Guardar Cambios</span>
              </button>
              <button
                onClick={restoreDefault}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
              >
                <RotateCcwIcon className="h-5 w-5" />
                <span>Restaurar Original</span>
              </button>
            </div>
            {saveMessage && (
              <p className="text-sm text-green-600 font-medium transition-opacity duration-300" role="status">
                {saveMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
