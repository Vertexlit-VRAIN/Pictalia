import { useState, useEffect, useCallback } from 'react';
import { APP_DATA_STORAGE_KEY, DEFAULT_AI_SETTINGS, DEFAULT_PICTOGRAM_SETTINGS } from '../constants';
import type { Profile, AppData, Worksheet, SavedWorksheet, AISettings, PictogramSettings, StudentStructuredProfile } from '../types';
import { DEFAULT_STRUCTURED_PROFILE, normalizeStructuredProfile, serializeStructuredProfile } from '../services/profileSerializer';

const DEFAULT_PROFILE_ID = 'default_profile_01';

const getDefaultProfile = (): Profile => ({
  id: DEFAULT_PROFILE_ID,
  name: 'Niño TEA 6 Años (Original)',
  content: serializeStructuredProfile(DEFAULT_STRUCTURED_PROFILE),
  structuredContent: DEFAULT_STRUCTURED_PROFILE,
  showPictogramInstructions: true,
  savedWorksheets: [],
});

const getInitialAppData = (): AppData => ({
  profiles: [getDefaultProfile()],
  activeProfileId: DEFAULT_PROFILE_ID,
  aiSettings: { ...DEFAULT_AI_SETTINGS },
  pictogramSettings: { ...DEFAULT_PICTOGRAM_SETTINGS },
});

const cloneStructuredContent = (structuredContent: StudentStructuredProfile): StudentStructuredProfile =>
  normalizeStructuredProfile(structuredContent);

const normalizeLoadedProfile = (profile: Profile): Profile => {
  const structuredContent = profile.structuredContent
    ? cloneStructuredContent(profile.structuredContent)
    : cloneStructuredContent(DEFAULT_STRUCTURED_PROFILE);

  return {
    ...profile,
    content: profile.content?.trim() ? profile.content : serializeStructuredProfile(structuredContent),
    structuredContent,
    showPictogramInstructions: profile.showPictogramInstructions ?? true,
    savedWorksheets: profile.savedWorksheets || [],
  };
};

const getStructuredContentForEditor = (profile: Profile): StudentStructuredProfile => {
  if (profile.structuredContent) {
    return cloneStructuredContent(profile.structuredContent);
  }

  return cloneStructuredContent(DEFAULT_STRUCTURED_PROFILE);
};

export const useAppDataManager = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [editorStructuredContent, setEditorStructuredContent] = useState<StudentStructuredProfile>(() => normalizeStructuredProfile(DEFAULT_STRUCTURED_PROFILE));
  const [initialEditorContent, setInitialEditorContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string>('');

  useEffect(() => {
    try {
      const savedDataRaw = localStorage.getItem(APP_DATA_STORAGE_KEY);
      if (savedDataRaw) {
        const parsedData = JSON.parse(savedDataRaw) as Partial<AppData>;
        const profiles = Array.isArray(parsedData.profiles) && parsedData.profiles.length > 0
          ? parsedData.profiles.map(profile => normalizeLoadedProfile(profile as Profile))
          : [getDefaultProfile()];
        const activeProfileId = parsedData.activeProfileId && profiles.some(profile => profile.id === parsedData.activeProfileId)
          ? parsedData.activeProfileId
          : profiles[0].id;

        setAppData({
          profiles,
          activeProfileId,
          aiSettings: {
            ...DEFAULT_AI_SETTINGS,
            ...parsedData.aiSettings,
          },
          pictogramSettings: {
            ...DEFAULT_PICTOGRAM_SETTINGS,
            ...parsedData.pictogramSettings,
          },
        });
      } else {
        setAppData(getInitialAppData());
      }
    } catch (error) {
      console.error("Error loading app data:", error);
      setAppData(getInitialAppData());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (appData) {
      localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData));
        const activeProfile = appData.profiles.find(p => p.id === appData.activeProfileId);
      if (activeProfile) {
        setEditorStructuredContent(getStructuredContentForEditor(activeProfile));
        setInitialEditorContent(activeProfile.content || serializeStructuredProfile(DEFAULT_STRUCTURED_PROFILE));
      }
    }
  }, [appData]);

  const showSaveMessage = (message: string) => {
    setSaveMessage(message);
    const timer = setTimeout(() => setSaveMessage(''), 3000);
    return () => clearTimeout(timer);
  };

  const selectProfile = useCallback((id: string | null) => {
    if (!id || !appData) return;
    const profileToSelect = appData.profiles.find(p => p.id === id);
    if (profileToSelect) {
      setAppData(prev => prev ? { ...prev, activeProfileId: id } : null);
    }
  }, [appData]);

  const updateActiveProfile = useCallback(() => {
    if (!appData?.activeProfileId) return;
    const serializedContent = serializeStructuredProfile(editorStructuredContent);
    const persistedStructuredContent = cloneStructuredContent(editorStructuredContent);
    setAppData(prev => {
      if (!prev) return null;
      const updatedProfiles = prev.profiles.map(p =>
        p.id === prev.activeProfileId
          ? { ...p, content: serializedContent, structuredContent: persistedStructuredContent }
          : p
      );
      return { ...prev, profiles: updatedProfiles };
    });
    setInitialEditorContent(serializedContent);
    showSaveMessage('Perfil actualizado con éxito.');
  }, [editorStructuredContent, appData]);

  const saveNewProfile = useCallback((name: string) => {
    if (!name.trim() || !appData) return;
    const serializedContent = serializeStructuredProfile(editorStructuredContent);
    const persistedStructuredContent = cloneStructuredContent(editorStructuredContent);
    const newProfile: Profile = {
      id: `profile_${Date.now()}`,
      name: name.trim(),
      content: serializedContent,
      structuredContent: persistedStructuredContent,
      showPictogramInstructions: appData.profiles.find(p => p.id === appData.activeProfileId)?.showPictogramInstructions ?? true,
      savedWorksheets: [],
    };
    setAppData(prev => {
        if (!prev) return null;
        const newProfiles = [...prev.profiles, newProfile];
        return { ...prev, profiles: newProfiles, activeProfileId: newProfile.id };
    });
    showSaveMessage('Nuevo perfil guardado.');
  }, [editorStructuredContent, appData]);
  
  const deleteProfile = useCallback((idToDelete: string) => {
    if (!appData || appData.profiles.length <= 1) {
      alert("No se puede eliminar el último perfil.");
      return;
    }
    if (window.confirm('¿Estás seguro de que quieres eliminar este perfil? Se borrarán también sus fichas guardadas.')) {
      setAppData(prev => {
        if (!prev) return null;
        const newProfiles = prev.profiles.filter(p => p.id !== idToDelete);
        const newActiveId = prev.activeProfileId === idToDelete ? (newProfiles[0]?.id || null) : prev.activeProfileId;
        return { ...prev, profiles: newProfiles, activeProfileId: newActiveId };
      });
    }
  }, [appData]);

  const restoreDefault = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres restaurar el contenido del perfil original? Perderás los cambios no guardados.')) {
      setEditorStructuredContent(normalizeStructuredProfile(DEFAULT_STRUCTURED_PROFILE));
    }
  }, []);
  
  const togglePictogramInstructions = useCallback((enabled: boolean) => {
    if (!appData?.activeProfileId) return;
    setAppData(prev => {
      if (!prev) return null;
      const updatedProfiles = prev.profiles.map(p => 
        p.id === prev.activeProfileId ? { ...p, showPictogramInstructions: enabled } : p
      );
      return { ...prev, profiles: updatedProfiles };
    });
    showSaveMessage('Ajuste guardado.');
  }, [appData]);

  const saveWorksheet = useCallback((worksheet: Worksheet, sourceDescription: string) => {
    if (!appData?.activeProfileId) return;
    const newSavedWorksheet: SavedWorksheet = {
      ...worksheet,
      id: `ws_${Date.now()}`,
      createdAt: new Date().toISOString(),
      sourceDescription,
    };
    setAppData(prev => {
      if (!prev) return null;
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === prev.activeProfileId) {
          return {
            ...p,
            savedWorksheets: [newSavedWorksheet, ...(p.savedWorksheets || [])]
          };
        }
        return p;
      });
      return { ...prev, profiles: updatedProfiles };
    });
    showSaveMessage('Ficha guardada en la Biblioteca.');
  }, [appData]);

  const deleteWorksheet = useCallback((idToDelete: string) => {
    if (!appData) return;
    if (window.confirm('¿Estás seguro de que quieres eliminar esta ficha guardada?')) {
      setAppData(prev => {
        if (!prev) return null;
        const updatedProfiles = prev.profiles.map(p => {
            const worksheetIndex = p.savedWorksheets.findIndex(ws => ws.id === idToDelete);
            if (worksheetIndex > -1) {
                const updatedWorksheets = [...p.savedWorksheets];
                updatedWorksheets.splice(worksheetIndex, 1);
                return { ...p, savedWorksheets: updatedWorksheets };
            }
            return p;
        });
        return { ...prev, profiles: updatedProfiles };
      });
    }
  }, [appData]);

  const updateWorksheet = useCallback((worksheetToUpdate: SavedWorksheet) => {
    if (!appData?.activeProfileId) return;

    setAppData(prev => {
      if (!prev) return null;

      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === prev.activeProfileId) {
          const updatedWorksheets = p.savedWorksheets.map(ws =>
            ws.id === worksheetToUpdate.id
              ? {
                ...worksheetToUpdate,
                editHistory: worksheetToUpdate.editHistory ?? ws.editHistory,
                editHistoryIndex: typeof worksheetToUpdate.editHistoryIndex === 'number'
                  ? worksheetToUpdate.editHistoryIndex
                  : ws.editHistoryIndex,
              }
              : ws
          );
          return { ...p, savedWorksheets: updatedWorksheets };
        }
        return p;
      });

      return { ...prev, profiles: updatedProfiles };
    });
    showSaveMessage('Ficha actualizada con éxito.');
  }, [appData]);

  const updateAISettings = useCallback((partialSettings: Partial<AISettings>) => {
    setAppData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        aiSettings: {
          ...DEFAULT_AI_SETTINGS,
          ...prev.aiSettings,
          ...partialSettings,
        },
      };
    });
  }, []);

  const updatePictogramSettings = useCallback((partialSettings: Partial<PictogramSettings>) => {
    setAppData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pictogramSettings: {
          ...DEFAULT_PICTOGRAM_SETTINGS,
          ...prev.pictogramSettings,
          ...partialSettings,
        },
      };
    });
  }, []);

  const activeProfile = appData?.profiles.find(p => p.id === appData.activeProfileId) || null;
  const hasChanges = serializeStructuredProfile(editorStructuredContent) !== initialEditorContent;

  return {
    isLoading,
    profiles: appData?.profiles || [],
    activeProfile,
    editorStructuredContent,
    setEditorStructuredContent,
    hasChanges,
    saveMessage,
    selectProfile,
    updateActiveProfile,
    saveNewProfile,
    deleteProfile,
    restoreDefault,
    togglePictogramInstructions,
    savedWorksheets: activeProfile?.savedWorksheets || [],
    saveWorksheet,
    deleteWorksheet,
    updateWorksheet,
    aiSettings: appData?.aiSettings || { ...DEFAULT_AI_SETTINGS },
    updateAISettings,
    pictogramSettings: appData?.pictogramSettings || { ...DEFAULT_PICTOGRAM_SETTINGS },
    updatePictogramSettings,
  };
};
