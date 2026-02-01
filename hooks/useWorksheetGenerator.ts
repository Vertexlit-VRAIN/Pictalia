import { useState, useCallback } from 'react';
import { generateWorksheet as geminiGenerateWorksheet } from '../services/geminiService';
import { searchPictograms, getPictogramUrl } from '../services/arasaacService';
import { Worksheet } from '../types';
import { produce } from 'immer';

interface GenerateWorksheetOptions {
    topic?: string;
    adaptationDescription?: string;
    adaptationImage?: {
        mimeType: string;
        data: string;
    };
}



const transformInstructionTerm = (term: string): string => {
    let transformed = term.toLowerCase();
    // Simple replacements for common verbs
    transformed = transformed.replace(/\bpinta\b/g, 'pintar');
    transformed = transformed.replace(/\bune\b/g, 'relacionar');
    transformed = transformed.replace(/\bune con\b/g, 'unir'); // Handle "une con"
    transformed = transformed.replace(/\brodea\b/g, 'rodear');
    transformed = transformed.replace(/\bcolorea\b/g, 'colorear');
    transformed = transformed.replace(/\bescribe\b/g, 'escribir');
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
    transformed = transformed.replace(/\brelaciona\b/g, 'relacionar');


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

    const generate = useCallback(async (options: GenerateWorksheetOptions) => {
        setIsLoading(true);
        setError(null);
        setWorksheet(null);
        try {
            const baseWorksheet = await geminiGenerateWorksheet(options);
            console.log('Base Worksheet from Gemini:', baseWorksheet);

            // 1. Collect all search terms
            const searchTerms: { type: 'main' | 'item' | 'instruction'; path: (number | string)[]; term: string }[] = [];
            searchTerms.push({ type: 'main', path: [], term: baseWorksheet.pictogramSearchTerm });
            baseWorksheet.sections.forEach((section, sectionIndex) => {
                if (section.instruction.pictogramSearchTerm) {
                    const transformedTerm = transformInstructionTerm(section.instruction.pictogramSearchTerm);
                    searchTerms.push({ type: 'instruction', path: [sectionIndex], term: transformedTerm });
                }
                section.items.forEach((item, itemIndex) => {
                    if (item.type === 'image') {
                        searchTerms.push({ type: 'item', path: [sectionIndex, itemIndex], term: item.content });
                    }
                });
            });

            // 2. Fetch all pictograms in parallel
            const pictogramPromises = searchTerms.map(st => searchPictograms(st.term));
            const pictogramResults = await Promise.all(pictogramPromises);
            console.log('Raw Pictogram Results after Promise.all:', pictogramResults);

            // 3. Apply updates synchronously with produce
            const processedWorksheet = produce(baseWorksheet, draft => {
                searchTerms.forEach((st, index) => {
                    const pictos = pictogramResults[index];
                    const urls = pictos.map(p => getPictogramUrl(p._id));
                    console.log(`Processing search term "${st.term}": found pictos count=${pictos.length}, urls=${urls.length > 0 ? urls[0] : 'none'}`);

                    if (st.type === 'main') {
                        draft.pictoOptions = urls;
                        draft.selectedPictoUrl = urls.length > 0 ? urls[0] : '';
                        console.log('Main Picto assigned:', draft.selectedPictoUrl);
                    } else if (st.type === 'instruction') {
                        const [sectionIndex] = st.path;
                        if (pictos.length > 0) {
                            draft.sections[sectionIndex as number].instruction.pictograms = pictos.map(p => {
                                const pictoUrl = getPictogramUrl(p._id);
                                console.log(`Instruction Picto "${st.term}" assigned URL: ${pictoUrl}`);
                                return { url: pictoUrl, searchTerm: st.term, content: st.term };
                            });
                        } else {
                            draft.sections[sectionIndex as number].instruction.pictograms = [{ url: '', searchTerm: st.term, content: st.term }];
                            console.log(`Instruction Picto "${st.term}": No pictos found, assigned empty URL placeholder.`);
                        }
                    } else {
                        const [sectionIndex, itemIndex] = st.path;
                        const item = draft.sections[sectionIndex as number].items[itemIndex as number];
                        item.searchTerm = st.term;
                        item.pictoOptions = urls;
                        item.selectedPictoUrl = urls.length > 0 ? urls[0] : '';
                        console.log(`Item Picto "${st.term}" assigned URL:`, item.selectedPictoUrl);
                    }
                });
            });
            console.log('Processed Worksheet (after picto assignment):', processedWorksheet);

            setWorksheet(processedWorksheet);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { worksheet, isLoading, error, generate };
};
