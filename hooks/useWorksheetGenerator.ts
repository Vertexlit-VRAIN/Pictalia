import { useState, useCallback } from 'react';
import { generateWorksheet } from '../services/geminiService';
import { Worksheet } from '../types';

interface GenerateWorksheetOptions {
    topic?: string;
    adaptationDescription?: string;
    adaptationImage?: {
        mimeType: string;
        data: string;
    };
}

export const useWorksheetGenerator = () => {
    const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async (options: GenerateWorksheetOptions) => {
        setIsLoading(true);
        setError(null);
        setWorksheet(null);
        try {
            const result = await generateWorksheet(options);
            setWorksheet(result);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { worksheet, isLoading, error, generate };
};
