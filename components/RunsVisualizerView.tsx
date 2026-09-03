import React, { useState, useEffect } from 'react';
import { ImageIcon, Trash2, CheckCircleIcon, PlusIcon, SparklesIcon } from './Icons';
import { WorksheetDisplay } from './WorksheetDisplay';

interface RunInfo {
  run_id: number;
  task_id: number;
  topic: string;
  profile_id: string;
  provider: string;
  model: string;
  mode: string;
  success: boolean;
  error_message?: string;
  elapsed_ms: number;
}

interface LlmCall {
  prompt: string;
  response: string;
  provider: string;
  status: 'success' | 'failed';
}

interface RunData {
  run_info: RunInfo;
  llm_calls: LlmCall[];
  final_worksheet: any;
  filename?: string;
}

export const RunsVisualizerView: React.FC = () => {
  const [runs, setRuns] = useState<RunData[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunData | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'calls' | 'json'>('preview');
  const [expandedCallIdx, setExpandedCallIdx] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('all');
  const [taskFilter, setTaskFilter] = useState('');

  // Extract unique models
  const uniqueModels = React.useMemo(() => {
    const models = new Set<string>();
    runs.forEach(r => {
      if (r.run_info && r.run_info.model) {
        models.add(r.run_info.model);
      }
    });
    return Array.from(models).sort();
  }, [runs]);

  // Filtered runs
  const filteredRuns = React.useMemo(() => {
    return runs.filter(run => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches = 
          run.run_info.topic.toLowerCase().includes(query) ||
          run.run_info.profile_id.toLowerCase().includes(query) ||
          run.run_info.provider.toLowerCase().includes(query);
        if (!matches) return false;
      }
      if (selectedModel !== 'all') {
        if (run.run_info.model !== selectedModel) return false;
      }
      if (taskFilter) {
        if (run.run_info.task_id.toString() !== taskFilter.trim()) return false;
      }
      return true;
    });
  }, [runs, searchTerm, selectedModel, taskFilter]);

  // Load imported runs from localStorage on mount (optional convenience)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('adaptator_imported_runs');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRuns(parsed);
        if (parsed.length > 0) {
          setSelectedRun(parsed[0]);
        }
      }
    } catch (e) {
      console.error("Could not load imported runs:", e);
    }
  }, []);

  const saveRunsToLocalStorage = (newRuns: RunData[]) => {
    try {
      localStorage.setItem('adaptator_imported_runs', JSON.stringify(newRuns));
    } catch (e) {
      console.error("Could not save runs to localStorage:", e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.run_info) {
              const runItem: RunData = {
                run_info: data.run_info,
                llm_calls: data.llm_calls || [],
                final_worksheet: data.final_worksheet || {},
                filename: file.name
              };
              setRuns(prev => {
                // Prevent duplicate filenames
                const filtered = prev.filter(r => r.filename !== file.name);
                const updated = [runItem, ...filtered].sort((a, b) => b.run_info.run_id - a.run_info.run_id);
                saveRunsToLocalStorage(updated);
                // Auto-select if first
                if (updated.length > 0) {
                  setSelectedRun(runItem);
                }
                return updated;
              });
            } else {
              alert(`El archivo "${file.name}" no parece ser un JSON de corrida válido de Adaptator.`);
            }
          } catch (e) {
            alert(`Error al procesar el archivo JSON: ${e}`);
          }
        };
        reader.readAsText(file);
      } else {
        alert('Solo se admiten archivos en formato .json');
      }
    });
  };

  const handleDeleteRun = (filename?: string) => {
    if (!filename) return;
    const updated = runs.filter(r => r.filename !== filename);
    setRuns(updated);
    saveRunsToLocalStorage(updated);
    if (selectedRun?.filename === filename) {
      setSelectedRun(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("¿Seguro que quieres borrar todas las corridas importadas?")) {
      setRuns([]);
      setSelectedRun(null);
      localStorage.removeItem('adaptator_imported_runs');
    }
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
      
      {/* Sidebar Panel */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 xl:sticky xl:top-6 h-[calc(100vh-3rem)] self-start flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-sky-600" />
            Visor de Corridas
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Arrastra los JSONs generados por <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono">evaluate.py</code> en la carpeta <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono">generated_worksheets/</code> para inspeccionarlos de forma interactiva.
          </p>
        </div>

        {/* Carga e Importación */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => document.getElementById('run-file-input')?.click()}
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all text-center"
            >
              Subir Archivos
            </button>
            <button
              onClick={() => document.getElementById('run-folder-input')?.click()}
              className="flex-1 bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-all text-center"
            >
              Cargar Carpeta
            </button>
          </div>
          <input
            id="run-file-input"
            type="file"
            accept=".json"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            id="run-folder-input"
            type="file"
            {...{ webkitdirectory: "", directory: "" } as any}
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('run-file-input')?.click()}
            className={`border border-dashed rounded-xl p-3 text-center text-[10px] text-slate-500 cursor-pointer transition-all duration-200 ${
              isDragOver 
                ? 'border-sky-500 bg-sky-50/20' 
                : 'border-slate-300 hover:border-sky-500 bg-slate-50/50'
            }`}
          >
            Arrastra JSONs o carpeta aquí
          </div>
        </div>

        {/* Filtros de búsqueda */}
        <div className="flex flex-col gap-2 bg-slate-50 border border-slate-150 p-3 rounded-2xl">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
            Filtros
          </span>
          <input
            type="text"
            placeholder="Buscar tema, perfil, proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 transition-all bg-white"
          />
          <div class="flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[8px] font-bold text-slate-450 uppercase">Tarea ID</span>
              <input
                type="text"
                placeholder="P. ej. 1"
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 transition-all bg-white"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[8px] font-bold text-slate-455 uppercase font-semibold">Modelo</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-1.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 transition-all bg-white font-semibold"
              >
                <option value="all">Todos</option>
                {uniqueModels.map(m => (
                  <option key={m} value={m}>{m.split('/').pop()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Runs List */}
        {runs.length > 0 && (
          <div className="flex flex-col gap-2 flex-grow min-h-0">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-450">
                Corridas ({filteredRuns.length} de {runs.length})
              </span>
              <button
                onClick={handleClearAll}
                className="text-[11px] font-bold text-rose-600 hover:underline"
              >
                Limpiar todo
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {filteredRuns.map(run => {
                const isActive = selectedRun?.filename === run.filename;
                return (
                  <div
                    key={run.filename}
                    onClick={() => {
                      setSelectedRun(run);
                      setExpandedCallIdx(null);
                    }}
                    className={`group relative flex flex-col p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'border-sky-500 bg-sky-50/30' 
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRun(run.filename);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center justify-between mb-1.5 pr-6">
                      <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        #{run.run_info.run_id} (Tarea {run.run_info.task_id})
                      </span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${
                        run.run_info.success 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {run.run_info.success ? 'Éxito' : 'Fallo'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 leading-tight line-clamp-2 pr-6">
                      {run.run_info.topic}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {run.run_info.provider}:{run.run_info.model.split('/').pop()}
                      </span>
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {run.run_info.profile_id.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {run.run_info.mode}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Detail Area */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 flex flex-col min-h-[600px]">
        {!selectedRun ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <ImageIcon className="h-14 w-14 text-slate-350 mb-3 opacity-60" />
            <h4 className="text-base font-bold text-slate-800">Ninguna corrida seleccionada</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Sube o arrastra un archivo JSON de corrida en el panel izquierdo para renderizar la ficha final y ver el log de llamadas del MAS.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            
            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedRun.run_info.topic}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    selectedRun.run_info.success 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {selectedRun.run_info.success ? 'CORRIDA EXITOSA' : 'CORRIDA FALLIDA'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Proveedor: <span className="font-bold text-slate-700">{selectedRun.run_info.provider.toUpperCase()}</span> ({selectedRun.run_info.model})
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Perfil: <span className="font-bold text-slate-700">{selectedRun.run_info.profile_id}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Latencia: <span className="font-bold text-slate-700">{selectedRun.run_info.elapsed_ms}ms</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
              <button
                onClick={() => setActiveTab('preview')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'preview' 
                    ? 'border-sky-500 text-sky-600' 
                    : 'border-transparent text-slate-550 hover:text-slate-800'
                }`}
              >
                Ficha Generada (Preview)
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'calls' 
                    ? 'border-sky-500 text-sky-600' 
                    : 'border-transparent text-slate-550 hover:text-slate-800'
                }`}
              >
                Trazas de la IA ({selectedRun.llm_calls.length} llamadas)
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'json' 
                    ? 'border-sky-500 text-sky-600' 
                    : 'border-transparent text-slate-550 hover:text-slate-800'
                }`}
              >
                JSON Completo
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1">
              
              {activeTab === 'preview' && (
                <div className="space-y-4">
                  {selectedRun.run_info.error_message && (
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs font-semibold text-rose-800">
                      <strong>Error de ejecución:</strong> {selectedRun.run_info.error_message}
                    </div>
                  )}

                  {selectedRun.run_info.success && selectedRun.final_worksheet ? (
                    <div className="max-w-[800px] mx-auto bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
                      <WorksheetDisplay worksheet={selectedRun.final_worksheet} />
                    </div>
                  ) : (
                    <div className="text-center p-8 text-xs text-slate-500">
                      No hay información de la ficha final en esta corrida.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'calls' && (
                <div className="space-y-3">
                  {selectedRun.llm_calls.length === 0 ? (
                    <div className="text-center p-8 text-xs text-slate-500">
                      No se encontraron registros de llamadas a la IA en este JSON.
                    </div>
                  ) : (
                    selectedRun.llm_calls.map((call, idx) => {
                      const isExpanded = expandedCallIdx === idx;
                      return (
                        <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                          
                          <div
                            onClick={() => setExpandedCallIdx(isExpanded ? null : idx)}
                            className="bg-slate-50 border-b border-slate-150 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-100/60"
                          >
                            <span className="text-xs font-bold text-slate-800">
                              Llamada #{idx + 1} | Agente ({call.provider.toUpperCase()})
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              call.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {call.status === 'success' ? 'Éxito' : 'Fallo'}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="p-4 space-y-4">
                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                                  Prompt Enviado
                                </span>
                                <pre className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mt-1 text-[11px] font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto text-slate-700">
                                  <code>{call.prompt}</code>
                                </pre>
                              </div>

                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                                  Respuesta Recibida
                                </span>
                                <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 mt-1 text-[11px] font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto text-sky-400">
                                  <code>{call.response}</code>
                                </pre>
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'json' && (
                <pre className="bg-slate-900 text-sky-400 rounded-2xl p-5 text-[11px] font-mono overflow-x-auto border border-slate-850">
                  <code>{JSON.stringify(selectedRun, null, 2)}</code>
                </pre>
              )}

            </div>

          </div>
        )}
      </div>

    </div>
  );
};
export default RunsVisualizerView;
