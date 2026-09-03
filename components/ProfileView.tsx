import React, { useEffect, useRef, useState } from 'react';
import { useAppDataManager } from '../hooks/useProfileManager';
import { SaveIcon, RotateCcwIcon, UserPlus, Trash2, Edit3, ShieldCheckIcon, PaletteIcon, SparklesIcon, CheckCircleIcon, ChevronDownIcon } from './Icons';
import { Spinner } from './Spinner';
import type { AIProvider, PictogramProvider, StudentStructuredProfile } from '../types';
import { STUDENT_PROFILE_BLOCKS } from '../services/profileSerializer';

const SCHOOL_STAGE_OPTIONS = [
  'Atención temprana',
  'Infantil 3 años',
  'Infantil 4 años',
  'Infantil 5 años',
  '1o Primaria',
  '2o Primaria',
  '3o Primaria',
  '4o Primaria',
  '5o Primaria',
  '6o Primaria',
  'Secundaria',
  'Aula específica / educación especial',
  'Otra etapa',
] as const;

const DIAGNOSIS_OPTIONS = [
  'TEA grado 1',
  'TEA grado 2',
  'TEA grado 3',
  'TEL / DLD',
  'Discapacidad intelectual',
  'TDAH',
  'Síndrome de Down',
  'Parálisis cerebral',
  'Sin diagnóstico cerrado',
  'Otro',
] as const;

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

const AutoResizeTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = '0px';
    element.style.height = `${element.scrollHeight}px`;
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      className={className}
    />
  );
};

const GeneralField: React.FC<{
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}> = ({ id, label, value, placeholder, onChange, multiline = false }) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-700">{label}</label>
    {multiline ? (
      <AutoResizeTextarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none overflow-hidden rounded-2xl border border-slate-300 px-3 py-2.5 text-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
      />
    ) : (
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
      />
    )}
  </div>
);

const ProfileBlockCard: React.FC<{
  profile: StudentStructuredProfile;
  blockKey: keyof StudentStructuredProfile['blocks'];
  title: string;
  description: string;
  questions: string[];
  isCollapsed: boolean;
  onToggle: () => void;
  onSummaryChange: (value: string) => void;
}> = ({
  profile,
  blockKey,
  title,
  description,
  questions,
  isCollapsed,
  onToggle,
  onSummaryChange,
}) => {
  const block = profile.blocks[blockKey];

  return (
    <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={!isCollapsed}
      >
        <div>
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <span className="mt-1 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
        </span>
      </button>

      {!isCollapsed && <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Contenido del bloque</label>
          <AutoResizeTextarea
            value={block.summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            placeholder="Redacta aquí la información pedagógica principal de este bloque."
            rows={5}
            className="w-full resize-none overflow-hidden rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Preguntas guía</p>
          <ul className="space-y-2 text-sm text-slate-600">
            {questions.map((question, index) => (
              <li key={`${blockKey}-${index}`}>{question}</li>
            ))}
          </ul>
        </div>
      </div>}
    </section>
  );
};

export const ProfileView: React.FC = () => {
  const {
    profiles,
    activeProfile,
    editorStructuredContent,
    setEditorStructuredContent,
    isLoading,
    hasChanges,
    saveMessage,
    selectProfile,
    updateActiveProfile,
    saveNewProfile,
    deleteProfile,
    restoreDefault,
    togglePictogramInstructions,
    setDefaultLanguage,
    aiSettings,
    updateAISettings,
    pictogramSettings,
    updatePictogramSettings,
  } = useAppDataManager();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneralCollapsed, setIsGeneralCollapsed] = useState(false);
  const [isTechnicalCollapsed, setIsTechnicalCollapsed] = useState(true);
  const [collapsedBlocks, setCollapsedBlocks] = useState<string[]>([]);
  const diagnosisIsCustom = editorStructuredContent.general.diagnosis && !DIAGNOSIS_OPTIONS.includes(editorStructuredContent.general.diagnosis as typeof DIAGNOSIS_OPTIONS[number]);

  const toggleBlockCollapsed = (blockKey: string) => {
    setCollapsedBlocks(current =>
      current.includes(blockKey)
        ? current.filter(key => key !== blockKey)
        : [...current, blockKey]
    );
  };

  const updateGeneralField = (field: keyof StudentStructuredProfile['general'], value: string) => {
    setEditorStructuredContent(current => ({
      ...current,
      general: {
        ...current.general,
        [field]: value,
      },
    }));
  };

  const updateBlockSummary = (blockKey: keyof StudentStructuredProfile['blocks'], value: string) => {
    setEditorStructuredContent(current => ({
      ...current,
      blocks: {
        ...current.blocks,
        [blockKey]: {
          ...current.blocks[blockKey],
          summary: value,
        },
      },
    }));
  };

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
                  onClick={() => deleteProfile(profile.id)}
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

      <div className="lg:col-span-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            <div>
              <h2 className="mb-1 flex items-center gap-2 text-xl font-black text-slate-900">
                <Edit3 className="h-5 w-5 text-sky-600" />
                Editando: <span className="text-sky-700">{activeProfile.name}</span>
              </h2>
              <p className="text-sm text-slate-500">
                El perfil se organiza en una cabecera breve y cinco bloques pedagógicos. Todo lo que guardes aquí se convertirá después en el texto que usa la IA.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 flex-shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-3">
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
                <div className="ml-3 text-sm font-semibold text-slate-700">Instrucciones con Pictos</div>
              </label>

              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <label htmlFor="default-lang-select" className="text-sm font-semibold text-slate-700">
                  Idioma Ficha:
                </label>
                <select
                  id="default-lang-select"
                  value={activeProfile.defaultLanguage || 'es'}
                  onChange={(e: any) => setDefaultLanguage(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="es">Castellano</option>
                  <option value="val">Valenciano</option>
                  <option value="en">Inglés</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-[24px] border border-slate-200 bg-sky-50 p-5">
            <button
              type="button"
              onClick={() => setIsGeneralCollapsed(current => !current)}
              className="flex w-full items-center justify-between gap-4 text-left"
              aria-expanded={!isGeneralCollapsed}
            >
              <div>
                <h3 className="text-lg font-black text-slate-900">Datos generales</h3>
                <p className="mt-1 text-sm text-slate-500">Contexto breve del alumno para leer el perfil con rapidez.</p>
              </div>
              <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${isGeneralCollapsed ? '-rotate-90' : ''}`} />
              </span>
            </button>
            {!isGeneralCollapsed && <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label htmlFor="profile-age" className="mb-1 block text-sm font-semibold text-slate-700">Edad</label>
                <input
                  id="profile-age"
                  type="number"
                  min={2}
                  max={25}
                  step={1}
                  value={editorStructuredContent.general.age}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    if (rawValue === '') {
                      updateGeneralField('age', '');
                      return;
                    }
                    const numericValue = Number(rawValue);
                    if (!Number.isNaN(numericValue) && numericValue >= 2 && numericValue <= 25) {
                      updateGeneralField('age', String(Math.trunc(numericValue)));
                    }
                  }}
                  placeholder="Ej: 6"
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
                <p className="mt-1 text-xs text-slate-400">Rango permitido: 2 a 25 años.</p>
              </div>
              <div className="md:col-span-1">
                <label htmlFor="profile-stage" className="mb-1 block text-sm font-semibold text-slate-700">Curso o etapa</label>
                <select
                  id="profile-stage"
                  value={editorStructuredContent.general.schoolStage}
                  onChange={(e) => updateGeneralField('schoolStage', e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">Selecciona una etapa</option>
                  {SCHOOL_STAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label htmlFor="profile-diagnosis" className="mb-1 block text-sm font-semibold text-slate-700">Diagnóstico</label>
                <select
                  id="profile-diagnosis"
                  value={diagnosisIsCustom ? 'Otro' : editorStructuredContent.general.diagnosis}
                  onChange={(e) => updateGeneralField('diagnosis', e.target.value === 'Otro' ? '' : e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">Selecciona una opción</option>
                  {DIAGNOSIS_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {(diagnosisIsCustom || editorStructuredContent.general.diagnosis === '') && (
                  <input
                    type="text"
                    value={editorStructuredContent.general.diagnosis}
                    onChange={(e) => updateGeneralField('diagnosis', e.target.value)}
                    placeholder="Especifica el diagnóstico o la condición"
                    className="mt-3 w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                )}
              </div>
              <div className="md:col-span-3">
              <GeneralField
                id="profile-goals"
                label="Objetivos prioritarios actuales"
                value={editorStructuredContent.general.priorityGoals}
                placeholder="Describe las prioridades de intervención."
                onChange={(value) => updateGeneralField('priorityGoals', value)}
                multiline
              />
              </div>
              <div className="md:col-span-3">
              <GeneralField
                id="profile-comments"
                label="Comentarios adicionales"
                value={editorStructuredContent.general.additionalComments}
                placeholder="Anota aquí información complementaria que no encaje bien en los apartados anteriores."
                onChange={(value) => updateGeneralField('additionalComments', value)}
                multiline
              />
              </div>
            </div>}
          </div>

          <div className="space-y-5">
            {STUDENT_PROFILE_BLOCKS.map(block => (
              <ProfileBlockCard
                key={block.key}
                profile={editorStructuredContent}
                blockKey={block.key}
                title={block.title}
                description={block.description}
                questions={block.questions}
                isCollapsed={collapsedBlocks.includes(block.key)}
                onToggle={() => toggleBlockCollapsed(block.key)}
                onSummaryChange={(value) => updateBlockSummary(block.key, value)}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
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

        <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <button
            type="button"
            onClick={() => setIsTechnicalCollapsed(current => !current)}
            className="flex w-full items-start justify-between gap-4 text-left"
            aria-expanded={!isTechnicalCollapsed}
          >
            <div>
              <h2 className="mb-1 flex items-center gap-2 text-xl font-black text-slate-900">
                <SparklesIcon className="h-5 w-5 text-amber-500" />
                Configuración técnica
              </h2>
              <p className="text-sm text-slate-500">
                Ajustes de modelos y proveedores. Se han separado del perfil pedagógico para no mezclar configuración con información del alumno.
              </p>
              <p className="mt-2 text-sm font-semibold text-sky-700">
                Para cambiar el selector de modelos, abre esta sección y entra en "Proveedor de IA".
              </p>
            </div>
            <span className="mt-1 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${isTechnicalCollapsed ? '-rotate-90' : ''}`} />
            </span>
          </button>

          {!isTechnicalCollapsed && <div className="mt-6 space-y-8">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-1 flex items-center gap-2 text-lg font-black text-slate-900"><SparklesIcon className="h-5 w-5 text-amber-500" />Proveedor de IA</h3>
              <p className="mb-5 text-sm text-slate-500">
                Selecciona un único proveedor activo. La aplicación no se bloquea si falta configuración, pero las acciones de IA sí la requieren.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ai-provider" className="block text-sm font-semibold text-gray-700 mb-1">Proveedor activo</label>
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

                  <div className="flex items-center gap-3 py-1">
                    <input
                      type="checkbox"
                      id="use-single-prompt"
                      checked={aiSettings.useSinglePrompt || false}
                      onChange={(e) => updateAISettings({ useSinglePrompt: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <label htmlFor="use-single-prompt" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                      Usar prompt único (desactivar MAS)
                    </label>
                  </div>

                  <div>
                    <label htmlFor="gemini-model" className="block text-sm font-semibold text-gray-700 mb-1">Modelo de Gemini</label>
                    <input
                      id="gemini-model"
                      type="text"
                      value={aiSettings.geminiModel}
                      onChange={(e) => updateAISettings({ geminiModel: e.target.value })}
                      placeholder="gemini-3.1-flash-lite-preview"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="gemini-api-key" className="block text-sm font-semibold text-gray-700 mb-1">API key de Gemini</label>
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
                    <label htmlFor="ollama-url" className="block text-sm font-semibold text-gray-700 mb-1">URL base de Ollama</label>
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
                    <label htmlFor="ollama-model" className="block text-sm font-semibold text-gray-700 mb-1">Modelo de Ollama</label>
                    <input
                      id="ollama-model"
                      type="text"
                      value={aiSettings.ollamaModel}
                      onChange={(e) => updateAISettings({ ollamaModel: e.target.value })}
                      placeholder="gemma4:e4b"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
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

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-1 flex items-center gap-2 text-lg font-black text-slate-900"><PaletteIcon className="h-5 w-5 text-rose-500" />Proveedor de pictogramas</h3>
              <p className="mb-5 text-sm text-slate-500">
                La app puede buscar pictogramas en ARASAAC o en una API privada compatible. La interfaz queda preparada para cambiar de proveedor sin tocar el editor.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="picto-provider" className="block text-sm font-semibold text-gray-700 mb-1">Proveedor activo</label>
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
                    <label htmlFor="arasaac-url" className="block text-sm font-semibold text-gray-700 mb-1">URL base ARASAAC</label>
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
                    <label htmlFor="private-picto-url" className="block text-sm font-semibold text-gray-700 mb-1">URL base API privada</label>
                    <input
                      id="private-picto-url"
                      type="text"
                      value={pictogramSettings.privateApiUrl}
                      onChange={(e) => updatePictogramSettings({ privateApiUrl: e.target.value })}
                      placeholder="http://localhost:3001/api/pictograms"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    <p className="font-semibold text-gray-700 mb-1">Activo ahora: {pictogramSettings.provider === 'arasaac_official' ? 'ARASAAC oficial' : 'API privada'}</p>
                    <p>
                      {pictogramSettings.provider === 'arasaac_official'
                        ? 'Las búsquedas de pictogramas usan la API pública de ARASAAC.'
                        : 'Las búsquedas de pictogramas usan vuestra API privada. El servicio espera un endpoint /search?query=... que devuelva items con url.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
};
