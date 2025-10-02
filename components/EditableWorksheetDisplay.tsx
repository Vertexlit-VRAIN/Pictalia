import React, { useState } from 'react';
import { Worksheet, WorksheetItem, WorksheetSection, SavedWorksheet } from '../types';
import { produce } from 'immer';

// Modal component for editing image search term
const ImageEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentSearchTerm: string;
  onSave: (newSearchTerm: string) => void;
}> = ({ isOpen, onClose, currentSearchTerm, onSave }) => {
  const [searchTerm, setSearchTerm] = useState(currentSearchTerm);

  if (!isOpen) return null;

  const handleSave = () => {
    if (searchTerm.trim()) {
      onSave(searchTerm.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-800">Cambiar Imagen</h3>
        <p className="text-sm text-gray-500 mt-1">Introduce un nuevo término de búsqueda para el pictograma.</p>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Cambiar</button>
        </div>
      </div>
    </div>
  );
};


const Pictogram: React.FC<{ searchTerm: string; altText: string; className?: string }> = ({ searchTerm, altText, className }) => {
  const [imgSrc, setImgSrc] = useState<string>(`https://api.arasaac.org/api/pictograms/search/${encodeURIComponent(searchTerm)}?best=true`);

  React.useEffect(() => {
    setImgSrc(`https://api.arasaac.org/api/pictograms/search/${encodeURIComponent(searchTerm)}?best=true`);
  }, [searchTerm]);

  const handleError = () => {
    const fallbackSearchTerm = searchTerm || altText || 'fallback';
    setImgSrc(`https://picsum.photos/seed/${encodeURIComponent(fallbackSearchTerm)}/200`);
  };

  return <img src={imgSrc} alt={altText} className={className} onError={handleError} loading="lazy" />;
};

type EditableWorksheetProps = {
  worksheet: SavedWorksheet;
  onWorksheetChange: (newWorksheet: SavedWorksheet) => void;
};

export const EditableWorksheetDisplay: React.FC<EditableWorksheetProps> = ({ worksheet, onWorksheetChange }) => {
  const [editingImage, setEditingImage] = useState<{ sectionIndex: number; itemIndex: number } | null>(null);

  const handleTextChange = (path: (string | number)[], value: string) => {
    const newWorksheet = produce(worksheet, draft => {
      let current: any = draft;
      path.slice(0, -1).forEach(p => {
        current = current[p];
      });
      current[path[path.length - 1]] = value;
    });
    onWorksheetChange(newWorksheet);
  };
  
  const handleImageSave = (newSearchTerm: string) => {
    if (editingImage) {
      const { sectionIndex, itemIndex } = editingImage;
      const newWorksheet = produce(worksheet, draft => {
        draft.sections[sectionIndex].items[itemIndex].searchTerm = newSearchTerm;
        draft.sections[sectionIndex].items[itemIndex].content = newSearchTerm; // Also update content for consistency
      });
      onWorksheetChange(newWorksheet);
      setEditingImage(null);
    }
  };

  const currentEditingItem = editingImage
    ? worksheet.sections[editingImage.sectionIndex].items[editingImage.itemIndex]
    : null;


  const renderWorksheetItem = (item: WorksheetItem, sectionIndex: number, itemIndex: number) => {
    const key = `${sectionIndex}-${itemIndex}`;
    switch (item.type) {
      case 'image':
        return (
          <button key={key} onClick={() => setEditingImage({ sectionIndex, itemIndex })} className="relative flex flex-col items-center justify-center p-2 border-2 border-black rounded-lg h-32 w-32 bg-white group">
            <Pictogram 
              searchTerm={item.searchTerm || item.content} 
              altText={item.content} 
              className="max-h-20 max-w-20 object-contain"
            />
            <span className="text-sm text-center mt-2 font-mono text-gray-700 uppercase">{item.content}</span>
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                <span className="text-white font-bold text-sm">Cambiar</span>
            </div>
          </button>
        );
       case 'traceable_text':
        return (
            <div key={key} className="flex items-center justify-center h-32 w-32 text-8xl font-bold text-gray-300" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif", border: "2px dashed #d1d5db", borderRadius: "0.5rem" }}>
            {item.content}
            </div>
        );
      default:
        return <div key={key} className="flex items-center justify-center h-32 w-32 text-4xl font-bold text-gray-700">{item.content}</div>;
    }
  };

  return (
    <>
      {editingImage && currentEditingItem && (
        <ImageEditModal
          isOpen={!!editingImage}
          onClose={() => setEditingImage(null)}
          currentSearchTerm={currentEditingItem.searchTerm || currentEditingItem.content || ''}
          onSave={handleImageSave}
        />
      )}
      <div className="p-6 border-4 border-black bg-slate-50 aspect-[210/297] w-full mx-auto" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>
        <header className="flex items-center justify-center gap-4 p-4 border-b-4 border-black mb-6">
          <div className="h-16 w-16 flex items-center justify-center border-2 border-black">
             <Pictogram searchTerm={worksheet.pictogramSearchTerm} altText={worksheet.pictogramSearchTerm} className="max-h-12 max-w-12" />
          </div>
          <h2 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange(['title'], e.currentTarget.textContent || '')}
            className="text-4xl font-extrabold tracking-wider text-black uppercase outline-none focus:bg-yellow-200"
          >
            {worksheet.title}
          </h2>
        </header>
        
        <main className="space-y-4">
          {worksheet.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="p-4 border-2 border-gray-300 rounded-lg bg-white">
              <div className="text-center mb-6">
                <h3 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleTextChange(['sections', sectionIndex, 'instruction', 'text'], e.currentTarget.textContent || '')}
                  className="font-bold text-2xl text-gray-600 uppercase tracking-widest outline-none focus:bg-yellow-200"
                >
                    {section.instruction.text}
                </h3>
              </div>
              <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
                {section.items.map((item, itemIndex) => renderWorksheetItem(item, sectionIndex, itemIndex))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </>
  );
};
