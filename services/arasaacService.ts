


const API_URL = 'https://api.arasaac.org/api/pictograms';

interface ArasaacPictogram {
    _id: number;
    keywords: { keyword: string }[];
}

export const searchPictograms = async (searchTerm: string): Promise<ArasaacPictogram[]> => {
    let modifiedSearchTerm = searchTerm;
    if (searchTerm.toUpperCase().startsWith('COLOR ')) {
        modifiedSearchTerm = searchTerm.substring(6).trim();
    }

    try {
        let response = await fetch(`${API_URL}/es/bestsearch/${encodeURIComponent(modifiedSearchTerm)}`);
        console.log(`ARASAAC API Response Status for "${modifiedSearchTerm}": ${response.status} ${response.statusText}`);

        if (response.ok) {
            const pictograms: ArasaacPictogram[] = await response.json();
            if (pictograms.length > 0) {
                console.log(`ARASAAC API Pictograms for "${modifiedSearchTerm}":`, pictograms);
                return pictograms;
            }
        }

        // Fallback: if no results and multiple words, try first word
        const words = searchTerm.split(' ');
        if (words.length > 1) {
            const firstWord = words[0];
            console.log(`No results for "${searchTerm}", trying fallback with first word: "${firstWord}"`);
            response = await fetch(`${API_URL}/es/bestsearch/${encodeURIComponent(firstWord)}`);
            console.log(`ARASAAC API Response Status for fallback "${firstWord}": ${response.status} ${response.statusText}`);
            if (response.ok) {
                const pictograms: ArasaacPictogram[] = await response.json();
                if (pictograms.length > 0) {
                    console.log(`ARASAAC API Pictograms for fallback "${firstWord}":`, pictograms);
                    return pictograms;
                }
            }
        }
        
        console.error(`Error fetching pictograms for "${searchTerm}": No results found.`);
        return [];
    } catch (error) {
        console.error(`Error fetching pictograms for "${searchTerm}":`, error);
        return [];
    }
};

export const getPictogramUrl = (pictogramId: number, resolution: '300' | '500' | '2500' = '500'): string => {
    return `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_${resolution}.png`;
};
