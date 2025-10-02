
import { Pictogram } from '../types';

const API_URL = 'https://api.arasaac.org/api/pictograms';

interface ArasaacPictogram {
    _id: number;
    keywords: { keyword: string }[];
}

export const searchPictograms = async (searchTerm: string): Promise<string | null> => {
    try {
        const response = await fetch(`${API_URL}/es/bestsearch/${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
            console.error(`Error fetching pictograms for "${searchTerm}": ${response.statusText}`);
            return null;
        }
        const pictograms: ArasaacPictogram[] = await response.json();

        if (pictograms.length > 0) {
            const pictogramId = pictograms[0]._id;
            return `${API_URL}/${pictogramId}`;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching pictograms for "${searchTerm}":`, error);
        return null;
    }
};
