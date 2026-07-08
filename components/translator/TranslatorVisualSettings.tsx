import React from 'react';
import { SlidersHorizontalIcon } from '../Icons';

export interface Sliders {
  noun: number;
  verb: number;
  adjective: number;
  adverb: number;
  determiner: number;
  preposition: number;
  conjunction: number;
  pronoun: number;
  other: number;
}

interface TranslatorVisualSettingsProps {
  sliders: Sliders;
  setSliders: React.Dispatch<React.SetStateAction<Sliders>>;
  hideTextUnderPicto: boolean;
  setHideTextUnderPicto: (val: boolean) => void;
}

export const TranslatorVisualSettings: React.FC<TranslatorVisualSettingsProps> = ({
  sliders,
  setSliders,
  hideTextUnderPicto,
  setHideTextUnderPicto,
}) => {
  const updateSlider = (key: keyof Sliders, value: number) => {
    setSliders(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <SlidersHorizontalIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900">Ajustes visuales</h3>
          <p className="text-xs text-slate-500">Ajusta los sliders en tiempo real</p>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Controla qué porcentaje de palabras de cada categoría gramatical se muestran con apoyo de pictogramas.
      </p>

      <div className="space-y-4">
        {/* NOUN SLIDER */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="slider-noun" className="text-xs font-bold text-slate-700">Nombres (Sustantivos)</label>
            <span className="text-xs font-extrabold text-sky-700">{sliders.noun}%</span>
          </div>
          <input
            id="slider-noun"
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliders.noun}
            onChange={(e) => updateSlider('noun', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        {/* VERB SLIDER */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="slider-verb" className="text-xs font-bold text-slate-700">Verbos</label>
            <span className="text-xs font-extrabold text-sky-700">{sliders.verb}%</span>
          </div>
          <input
            id="slider-verb"
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliders.verb}
            onChange={(e) => updateSlider('verb', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        {/* ADJECTIVE SLIDER */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="slider-adjective" className="text-xs font-bold text-slate-700">Adjetivos</label>
            <span className="text-xs font-extrabold text-sky-700">{sliders.adjective}%</span>
          </div>
          <input
            id="slider-adjective"
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliders.adjective}
            onChange={(e) => updateSlider('adjective', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        {/* ADVERB SLIDER */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="slider-adverb" className="text-xs font-bold text-slate-700">Adverbios</label>
            <span className="text-xs font-extrabold text-sky-700">{sliders.adverb}%</span>
          </div>
          <input
            id="slider-adverb"
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliders.adverb}
            onChange={(e) => updateSlider('adverb', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        {/* DETERMINER SLIDER */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="slider-determiner" className="text-xs font-bold text-slate-700">Determinantes (Artículos, etc.)</label>
            <span className="text-xs font-extrabold text-sky-700">{sliders.determiner}%</span>
          </div>
          <input
            id="slider-determiner"
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliders.determiner}
            onChange={(e) => updateSlider('determiner', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        {/* PRONOUN SLIDER */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="slider-pronoun" className="text-xs font-bold text-slate-700">Pronombres</label>
            <span className="text-xs font-extrabold text-sky-700">{sliders.pronoun}%</span>
          </div>
          <input
            id="slider-pronoun"
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliders.pronoun}
            onChange={(e) => updateSlider('pronoun', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        {/* PREPOSITION SLIDER */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="slider-preposition" className="text-xs font-bold text-slate-700">Preposiciones</label>
            <span className="text-xs font-extrabold text-sky-700">{sliders.preposition}%</span>
          </div>
          <input
            id="slider-preposition"
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliders.preposition}
            onChange={(e) => updateSlider('preposition', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        {/* CONJUNCTION SLIDER */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="slider-conjunction" className="text-xs font-bold text-slate-700">Conjunciones</label>
            <span className="text-xs font-extrabold text-sky-700">{sliders.conjunction}%</span>
          </div>
          <input
            id="slider-conjunction"
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliders.conjunction}
            onChange={(e) => updateSlider('conjunction', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        {/* OTHER SLIDER */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="slider-other" className="text-xs font-bold text-slate-700">Otros</label>
            <span className="text-xs font-extrabold text-sky-700">{sliders.other}%</span>
          </div>
          <input
            id="slider-other"
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliders.other}
            onChange={(e) => updateSlider('other', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* HIDE TEXT TOGGLE */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
        <div>
          <span className="block text-xs font-bold text-slate-800">Ocultar texto</span>
          <span className="block text-[10px] text-slate-500">Bajo los pictogramas</span>
        </div>
        <label htmlFor="hide-text-toggle" className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="hide-text-toggle"
            className="sr-only peer"
            checked={hideTextUnderPicto}
            onChange={(e) => setHideTextUnderPicto(e.target.checked)}
          />
          <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
        </label>
      </div>
    </div>
  );
};
