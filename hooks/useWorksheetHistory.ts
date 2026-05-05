import { useState, useCallback } from 'react';
import type { PersistedWorksheetHistoryEntry, SavedWorksheet, WorksheetOperation } from '../types';
import { applyWorksheetOperations, describeWorksheetOperations, ensureWorksheetInternalIds } from '../services/worksheetOperations';

export interface HistoryEntry {
  state: SavedWorksheet;
  actionLabel: string;
  timestamp: Date;
  operations: WorksheetOperation[];
}

const stripWorksheetHistoryMeta = (worksheet: SavedWorksheet): SavedWorksheet => {
  const { editHistory, editHistoryIndex, ...rest } = worksheet;
  return rest;
};

const deserializeHistory = (worksheet: SavedWorksheet): { history: HistoryEntry[]; currentIndex: number } => {
  if (!worksheet.editHistory?.length) {
    return {
      history: [{
        state: ensureWorksheetInternalIds(stripWorksheetHistoryMeta(worksheet)),
        actionLabel: 'Ficha Inicial',
        timestamp: new Date(),
        operations: [],
      }],
      currentIndex: 0,
    };
  }

  const history = worksheet.editHistory.map((entry: PersistedWorksheetHistoryEntry) => ({
    state: ensureWorksheetInternalIds(stripWorksheetHistoryMeta(entry.state)),
    actionLabel: entry.actionLabel,
    timestamp: new Date(entry.timestamp),
    operations: entry.operations || [],
  }));

  const boundedIndex = Math.max(0, Math.min(worksheet.editHistoryIndex || 0, history.length - 1));
  return { history, currentIndex: boundedIndex };
};

export const useWorksheetHistory = (initialWorksheet: SavedWorksheet) => {
  const [state, setState] = useState<{
    history: HistoryEntry[];
    currentIndex: number;
  }>(() => deserializeHistory(initialWorksheet));

  const commitChange = useCallback((newState: SavedWorksheet, actionLabel: string, operations: WorksheetOperation[] = []) => {
    setState(prevState => {
      const newHistory = prevState.history.slice(0, prevState.currentIndex + 1);
      return {
        history: [...newHistory, { state: ensureWorksheetInternalIds(stripWorksheetHistoryMeta(newState)), actionLabel, timestamp: new Date(), operations }],
        currentIndex: newHistory.length
      };
    });
  }, []);

  const commitOperations = useCallback((operations: WorksheetOperation[], actionLabel = describeWorksheetOperations(operations)) => {
    setState(prevState => {
      const currentWorksheet = prevState.history[prevState.currentIndex].state;
      const newHistory = prevState.history.slice(0, prevState.currentIndex + 1);
      const nextState = applyWorksheetOperations(currentWorksheet, operations);

      return {
        history: [...newHistory, { state: nextState, actionLabel, timestamp: new Date(), operations }],
        currentIndex: newHistory.length,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prevState => {
      if (prevState.currentIndex > 0) {
        return { ...prevState, currentIndex: prevState.currentIndex - 1 };
      }
      return prevState;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prevState => {
      if (prevState.currentIndex < prevState.history.length - 1) {
        return { ...prevState, currentIndex: prevState.currentIndex + 1 };
      }
      return prevState;
    });
  }, []);

  const goToHistoryIndex = useCallback((index: number) => {
    setState(prevState => {
      if (index >= 0 && index < prevState.history.length) {
        return { ...prevState, currentIndex: index };
      }
      return prevState;
    });
  }, []);

  return {
    worksheet: state.history[state.currentIndex].state,
    history: state.history,
    currentIndex: state.currentIndex,
    commitChange,
    commitOperations,
    undo,
    redo,
    goToHistoryIndex,
    canUndo: state.currentIndex > 0,
    canRedo: state.currentIndex < state.history.length - 1,
    // Provide a way to completely replace history (e.g. on migration)
    replaceInitialState: useCallback((newState: SavedWorksheet) => {
      setState({
        history: [{ state: ensureWorksheetInternalIds(stripWorksheetHistoryMeta(newState)), actionLabel: 'Formato actualizado', timestamp: new Date(), operations: [] }],
        currentIndex: 0
      });
    }, []),
    replaceHistory: useCallback((historyEntries: PersistedWorksheetHistoryEntry[], currentIndex: number) => {
      const history = historyEntries.map(entry => ({
        state: ensureWorksheetInternalIds(stripWorksheetHistoryMeta(entry.state)),
        actionLabel: entry.actionLabel,
        timestamp: new Date(entry.timestamp),
        operations: entry.operations || [],
      }));

      setState({
        history,
        currentIndex: Math.max(0, Math.min(currentIndex, history.length - 1)),
      });
    }, []),
    serializeHistory: useCallback((): PersistedWorksheetHistoryEntry[] =>
      state.history.map(entry => ({
        state: stripWorksheetHistoryMeta(entry.state),
        actionLabel: entry.actionLabel,
        timestamp: entry.timestamp.toISOString(),
        operations: entry.operations,
      }))
    , [state.history])
  };
};
