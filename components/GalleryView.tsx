import React, { useState, useEffect, useRef } from 'react';
import { 
  saveGalleryImage, 
  deleteGalleryImage, 
  getAllGalleryImages, 
  resizeImage, 
  GalleryImage 
} from '../services/galleryService';
import { ImageIcon, PlusIcon, Trash2, CheckCircleIcon } from './Icons';

interface KeywordRow {
  id: string;
  lang: 'es' | 'val' | 'en';
  text: string;
}

export const GalleryView: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Upload Form states
  const [keywordRows, setKeywordRows] = useState<KeywordRow[]>([
    { id: 'initial-row-1', lang: 'es', text: '' }
  ]);
  
  // Preview states
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  
  // Status states
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load images on mount
  useEffect(() => {
    loadImages();
  }, []);

  // Update live preview when file changes
  useEffect(() => {
    if (selectedFile) {
      generateLivePreview();
    } else {
      setPreviewDataUrl(null);
    }
  }, [selectedFile]);

  const loadImages = async () => {
    try {
      const all = await getAllGalleryImages();
      setImages(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error("Could not load gallery images:", err);
    }
  };

  const generateLivePreview = async () => {
    if (!selectedFile) return;
    try {
      const dataUrl = await resizeImage(selectedFile);
      setPreviewDataUrl(dataUrl);
    } catch (err) {
      console.error("Error generating live preview:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setStatusMessage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setStatusMessage(null);
    }
  };

  // Upload keyword row managers
  const addKeywordRow = () => {
    setKeywordRows(prev => [
      ...prev,
      { id: crypto.randomUUID(), lang: 'es', text: '' }
    ]);
  };

  const removeKeywordRow = (id: string) => {
    setKeywordRows(prev => {
      const filtered = prev.filter(row => row.id !== id);
      return filtered.length > 0 ? filtered : [{ id: crypto.randomUUID(), lang: 'es', text: '' }];
    });
  };

  const updateKeywordRow = (id: string, field: 'lang' | 'text', value: string) => {
    setKeywordRows(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewDataUrl) return;

    setIsUploading(true);
    setStatusMessage(null);

    const getCleanKeywords = (rows: KeywordRow[], lang: 'es' | 'val' | 'en') => {
      return rows
        .filter(row => row.lang === lang && row.text.trim())
        .map(row => row.text.trim().toLowerCase());
    };

    const keywords = {
      es: getCleanKeywords(keywordRows, 'es'),
      val: getCleanKeywords(keywordRows, 'val'),
      en: getCleanKeywords(keywordRows, 'en')
    };

    if (keywords.es.length === 0 && keywords.val.length === 0 && keywords.en.length === 0) {
      setStatusMessage({ type: 'error', text: 'Debes añadir al menos una palabra clave.' });
      setIsUploading(false);
      return;
    }

    try {
      await saveGalleryImage(previewDataUrl, keywords);
      setStatusMessage({ type: 'success', text: 'Imagen guardada con éxito en tu galería local.' });
      
      // Reset upload form
      setSelectedFile(null);
      setKeywordRows([{ id: crypto.randomUUID(), lang: 'es', text: '' }]);
      setPreviewDataUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      await loadImages();
    } catch (err) {
      console.error("Upload error:", err);
      setStatusMessage({ type: 'error', text: 'Error al intentar guardar la imagen en IndexedDB.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar esta foto de tu galería?")) {
      try {
        await deleteGalleryImage(id);
        await loadImages();
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-[400px_minmax(0,1fr)] gap-6">
      
      {/* Upload Panel */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 self-start">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <PlusIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Subir Nueva Foto</h3>
            <p className="text-sm text-slate-500">Añade fotos reales para alumnos TEA</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Dropzone */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
              selectedFile 
                ? 'border-emerald-250 bg-emerald-50/10 cursor-default' 
                : 'border-slate-300 bg-slate-50/50 hover:border-sky-500 hover:bg-sky-50/10 cursor-pointer'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden" 
            />
            {previewDataUrl ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="relative h-32 w-32 rounded-xl border border-slate-100 bg-slate-50 p-1 shadow-inner overflow-hidden">
                  <div 
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: 'radial-gradient(#475569 20%, transparent 20%), radial-gradient(#475569 20%, transparent 20%)',
                      backgroundPosition: '0 0, 8px 8px',
                      backgroundSize: '16px 16px'
                    }}
                  />
                  <img 
                    src={previewDataUrl} 
                    alt="Vista previa" 
                    className="relative h-full w-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewDataUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    Quitar foto
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 group-hover:text-sky-500 shadow-md transition-colors duration-200">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Arrastra tu foto o haz clic para subir
                </p>
                <p className="mt-1 text-xs text-slate-500">Soporta PNG, JPG, WEBP</p>
              </div>
            )}
          </div>

          {/* Keywords input fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Palabras clave asociadas
              </label>
              <button
                type="button"
                onClick={addKeywordRow}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  borderRadius: '12px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
                  transition: 'background-color 0.2s'
                }}
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Añadir palabra
              </button>
            </div>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {keywordRows.map((row) => (
                <div key={row.id} className="flex gap-2 items-center">
                  <select
                    value={row.lang}
                    onChange={(e) => updateKeywordRow(row.id, 'lang', e.target.value as any)}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 px-2 py-2 text-xs font-semibold outline-none focus:border-sky-500 focus:bg-white"
                  >
                    <option value="es">ES</option>
                    <option value="val">VAL</option>
                    <option value="en">EN</option>
                  </select>
                  
                  <input
                    type="text"
                    placeholder="Ej: plátano"
                    value={row.text}
                    onChange={(e) => updateKeywordRow(row.id, 'text', e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none transition-all focus:border-sky-500 focus:bg-white"
                  />
                  
                  <button
                    type="button"
                    onClick={() => removeKeywordRow(row.id)}
                    disabled={keywordRows.length <= 1}
                    className="rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {statusMessage && (
            <div className={`rounded-2xl border p-3 text-xs font-semibold ${
              statusMessage.type === 'success' 
                ? 'border-emerald-250 bg-emerald-50/80 text-emerald-800' 
                : 'border-rose-250 bg-rose-50/80 text-rose-800'
            }`}>
              {statusMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={!previewDataUrl || isUploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.2)',
              width: '100%',
              transition: 'background-color 0.2s'
            }}
          >
            {isUploading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando en galería...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                Añadir a mi galería
              </>
            )}
          </button>
        </form>
      </div>

      {/* Grid Display Area */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-900">Mi Galería de Fotos Reales</h3>
            <p className="text-sm text-slate-500">
              Estas fotos se usarán automáticamente para los perfiles del estudiante cuando coincidan con sus palabras clave.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {images.length} fotos guardadas
          </span>
        </div>

        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-250 rounded-[20px] bg-slate-50/40">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-350 shadow-md">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-slate-700">Tu galería está vacía</p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Sube tus fotos reales en el formulario lateral para representar palabras clave cotidianas en los ejercicios.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map(img => (
              <div 
                key={img.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-150 bg-slate-50/30 p-3 hover:bg-white hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300 ring-1 ring-transparent hover:ring-slate-200"
              >
                {/* Floating Action Buttons */}
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleDelete(img.id)}
                    title="Eliminar de la galería"
                    className="rounded-full bg-white p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 shadow-md transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="relative aspect-square w-full rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center p-2 mb-3">
                  <div 
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                      backgroundImage: 'radial-gradient(#475569 20%, transparent 20%), radial-gradient(#475569 20%, transparent 20%)',
                      backgroundPosition: '0 0, 6px 6px',
                      backgroundSize: '12px 12px'
                    }}
                  />
                  <img 
                    src={img.dataUrl} 
                    alt="Foto de la galería" 
                    className="relative max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="space-y-1.5 mt-auto">
                  {img.keywords.es && img.keywords.es.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md flex-shrink-0">ES</span>
                      <p className="text-[11px] font-medium text-slate-650 truncate" title={img.keywords.es.join(', ')}>
                        {img.keywords.es.join(', ')}
                      </p>
                    </div>
                  )}
                  {img.keywords.val && img.keywords.val.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex-shrink-0">VAL</span>
                      <p className="text-[11px] font-medium text-slate-650 truncate" title={img.keywords.val.join(', ')}>
                        {img.keywords.val.join(', ')}
                      </p>
                    </div>
                  )}
                  {img.keywords.en && img.keywords.en.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md flex-shrink-0">EN</span>
                      <p className="text-[11px] font-medium text-slate-650 truncate" title={img.keywords.en.join(', ')}>
                        {img.keywords.en.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
export default GalleryView;
