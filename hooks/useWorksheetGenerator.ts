import { useState, useCallback } from 'react';
import { generateWorksheet as generateWorksheetWithAI } from '../services/aiService';
import { searchPictograms } from '../services/pictogramService';
import { Worksheet } from '../types';
import { produce } from 'immer';
import { normalizeWorksheet } from '../services/worksheetNormalizer';

interface GenerateWorksheetOptions {
    topic?: string;
    goal?: string;
    extraDetails?: string;
    language?: 'es' | 'val' | 'en';
}

type GenerationStage =
    | 'idle'
    | 'requesting_ai'
    | 'collecting_terms'
    | 'searching_pictograms'
    | 'assembling_worksheet'
    | 'done';

interface GenerationStatus {
    stage: GenerationStage;
    message: string;
    detail?: string;
}

const createStatus = (stage: GenerationStage, message: string, detail?: string): GenerationStatus => ({
    stage,
    message,
    detail,
});

const logGenerationStep = (label: string, payload?: unknown) => {
    console.log(`[WorksheetGenerator] ${label}`);
    if (typeof payload !== 'undefined') {
        console.log(payload);
    }
};

const shouldResolveItemPictogram = (item: Worksheet['sections'][number]['items'][number]) =>
    item.type === 'image' || item.type === 'traceable_text';



const transformInstructionTerm = (term: string): string => {
    let transformed = term.toLowerCase();
    // Simple replacements for common verbs
    transformed = transformed.replace(/\bpinta\b/g, 'rodear');
    transformed = transformed.replace(/\bune con\b/g, 'unir');
    transformed = transformed.replace(/\bune\b/g, 'unir');
    transformed = transformed.replace(/\brodea\b/g, 'rodear');
    transformed = transformed.replace(/\bcolorea\b/g, 'colorear');
    transformed = transformed.replace(/\bescribe\b/g, 'copiar');
    transformed = transformed.replace(/\blee\b/g, 'leer');
    transformed = transformed.replace(/\bmarca\b/g, 'marcar');
    transformed = transformed.replace(/\bencierra\b/g, 'encerrar');
    transformed = transformed.replace(/\bsubraya\b/g, 'subrayar');
    transformed = transformed.replace(/\bseñala\b/g, 'señalar');
    transformed = transformed.replace(/\bcambia\b/g, 'cambiar');
    transformed = transformed.replace(/\bcompleta\b/g, 'completar');
    transformed = transformed.replace(/\bcuenta\b/g, 'contar');
    transformed = transformed.replace(/\bclasifica\b/g, 'clasificar');
    transformed = transformed.replace(/\bidentifica\b/g, 'identificar');
    transformed = transformed.replace(/\brelaciona\b/g, 'unir');
    transformed = transformed.replace(/\brelacionar\b/g, 'unir');
    transformed = transformed.replace(/\bcopia\b/g, 'copiar');


    // Remove common articles and prepositions that might hinder search
    transformed = transformed.replace(/\b(el|la|los|las|un|una|unos|unas|de|del|al|a)\b/g, '').trim();

    // Further simplification: take only the first significant word if it's still a phrase
    // This is a more aggressive simplification, use with caution or make configurable
    const words = transformed.split(/\s+/).filter(word => word.length > 2); // Filter out very short words
    if (words.length > 0) {
        return words[0];
    }

    return transformed;
};

export const useWorksheetGenerator = () => {
    const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<GenerationStatus>(createStatus('idle', 'Listo para generar.'));

    const generate = useCallback(async (options: GenerateWorksheetOptions) => {
        setIsLoading(true);
        setError(null);
        setWorksheet(null);
        setStatus(createStatus('requesting_ai', 'Generando estructura con IA...', options.topic || options.goal || options.extraDetails || 'Preparando la ficha.'));
        console.groupCollapsed('[WorksheetGenerator] Start generation');
        logGenerationStep('Input options', options);
        try {
            const rawWorksheet = await generateWorksheetWithAI(options);
            const baseWorksheet = normalizeWorksheet(rawWorksheet);
            logGenerationStep('Base worksheet from AI provider', baseWorksheet);

            // 1. Collect all search terms
            setStatus(createStatus('collecting_terms', 'Preparando la búsqueda de pictogramas...'));
            const searchTerms: { type: 'main' | 'item' | 'instruction'; path: (number | string)[]; term: string }[] = [];
            searchTerms.push({ type: 'main', path: [], term: baseWorksheet.pictogramSearchTerm });
            baseWorksheet.sections.forEach((section, sectionIndex) => {
                const instructionTerms = (section.instruction.pictograms || []).map((picto, pictoIndex) => ({
                    type: 'instruction' as const,
                    path: [sectionIndex, pictoIndex],
                    term: transformInstructionTerm(picto.searchTerm || picto.content || section.instruction.text),
                }));
                searchTerms.push(...instructionTerms);

                section.items.forEach((item, itemIndex) => {
                    if (shouldResolveItemPictogram(item)) {
                        searchTerms.push({ type: 'item', path: [sectionIndex, itemIndex], term: item.searchTerm || item.content });
                    }
                });
            });
            logGenerationStep('Collected search terms', searchTerms);

            // 2. Fetch all pictograms in parallel
            setStatus(createStatus('searching_pictograms', 'Buscando pictogramas...', `${searchTerms.length} búsquedas pendientes.`));
            searchTerms.forEach((searchTerm, index) => {
                logGenerationStep(`Searching pictograms [${index + 1}/${searchTerms.length}]`, searchTerm);
            });
            const pictogramPromises = searchTerms.map(st => searchPictograms(st.term, options.language || 'es'));
            const pictogramResults = await Promise.all(pictogramPromises);
            logGenerationStep('Raw pictogram results after Promise.all', pictogramResults);

            // 3. Apply updates synchronously with produce
            setStatus(createStatus('assembling_worksheet', 'Montando la ficha final...', 'Asignando pictogramas y opciones.'));
            const processedWorksheet = produce(baseWorksheet, draft => {
                searchTerms.forEach((st, index) => {
                    const pictos = pictogramResults[index];
                    const urls = pictos.map(p => p.url);
                    logGenerationStep(`Processing search term "${st.term}"`, {
                        type: st.type,
                        path: st.path,
                        pictogramCount: pictos.length,
                        firstUrl: urls.length > 0 ? urls[0] : 'none',
                    });

                    if (st.type === 'main') {
                        draft.pictoOptions = urls;
                        draft.selectedPictoUrl = urls.length > 0 ? urls[0] : '';
                        logGenerationStep('Main pictogram assigned', draft.selectedPictoUrl);
                    } else if (st.type === 'instruction') {
                        const [sectionIndex, pictoIndex] = st.path;
                        const instructionPicto = draft.sections[sectionIndex as number].instruction.pictograms?.[pictoIndex as number];
                        if (instructionPicto) {
                            instructionPicto.searchTerm = st.term;
                            instructionPicto.url = pictos.length > 0 ? pictos[0].url : '';
                            logGenerationStep(`Instruction pictogram "${st.term}" assigned`, instructionPicto.url || 'none');
                        }
                    } else {
                        const [sectionIndex, itemIndex] = st.path;
                        const item = draft.sections[sectionIndex as number].items[itemIndex as number];
                        item.searchTerm = st.term;
                        item.pictoOptions = urls;
                        item.selectedPictoUrl = urls.length > 0 ? urls[0] : '';
                        logGenerationStep(`Item pictogram "${st.term}" assigned`, item.selectedPictoUrl);
                    }
                });
            });
            logGenerationStep('Processed worksheet (after picto assignment)', processedWorksheet);

            setWorksheet(processedWorksheet);
            setStatus(createStatus('done', 'Ficha lista.', `${searchTerms.length} búsquedas de pictogramas completadas.`));
        } catch (err: any) {
            logGenerationStep('Generation failed', err);
            setError(err.message || 'Ocurrió un error inesperado.');
            setStatus(createStatus('idle', 'La generación ha fallado.'));
        } finally {
            setIsLoading(false);
            console.groupEnd();
        }
    }, []);

    return { worksheet, isLoading, error, generate, status };
};
