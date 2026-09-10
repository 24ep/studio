import { useEffect, useState } from 'react';
import {
  fetchCustomizeBoardPreferences,
  fetchCustomizeBoardReferenceData,
} from './customize-board-api';
import {
  DEFAULT_VISIBLE_BOARD_FIELDS,
  parsePreferenceList,
  type BoardApplicant,
  type BoardPosition,
  type BoardRecruiter,
  type BoardStage,
  type UserPreference,
} from './customize-board-utils';

export function useCustomizeBoardModalState(open: boolean) {
  const [recruiters, setRecruiter] = useState<BoardRecruiter[]>([]);
  const [positions, setPositions] = useState<BoardPosition[]>([]);
  const [stages, setStages] = useState<BoardStage[]>([]);
  const [applicants, setApplicants] = useState<BoardApplicant[]>([]);
  const [rowField, setRowField] = useState('status');
  const [columnField, setColumnField] = useState('recruiterId');
  const [visibleRowValues, setVisibleRowValues] = useState<string[]>([]);
  const [visibleColumnValues, setVisibleColumnValues] = useState<string[]>([]);
  const [visibleFields, setVisibleFields] = useState<string[]>(DEFAULT_VISIBLE_BOARD_FIELDS);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    if (!open) return;

    setInitializing(true);

    const fetchActualData = async () => {
      try {
        const data = await fetchCustomizeBoardReferenceData();
        setRecruiter(data.recruiters);
        setPositions(data.positions);
        setStages(data.stages);
        setApplicants(data.applicants);
      } catch (error) {
        console.error('CustomizeBoardModal: Error fetching actual data:', error);
      } finally {
        setInitializing(false);
      }
    };

    fetchActualData();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setInitializing(true);

    fetchCustomizeBoardPreferences()
      .then((prefs: UserPreference[]) => {
        const rowPref = prefs.find((preference) => preference.attributeKey === 'mytasks_rowField');
        const colPref = prefs.find((preference) => preference.attributeKey === 'mytasks_columnField');
        const visibleRowPref = prefs.find((preference) => preference.attributeKey === 'mytasks_visibleRowValues');
        const visibleColPref = prefs.find((preference) => preference.attributeKey === 'mytasks_visibleColumnValues');
        const visibleFieldsPref = prefs.find((preference) => preference.attributeKey === 'mytasks_visibleFields');

        if (rowPref) setRowField(rowPref.customNote || 'status');
        if (colPref) setColumnField(colPref.customNote || 'recruiterId');

        setVisibleRowValues(parsePreferenceList(visibleRowPref?.customNote));
        setVisibleColumnValues(parsePreferenceList(visibleColPref?.customNote));
        setVisibleFields(parsePreferenceList(visibleFieldsPref?.customNote, DEFAULT_VISIBLE_BOARD_FIELDS));
      })
      .catch(() => {
        setVisibleRowValues([]);
        setVisibleColumnValues([]);
        setVisibleFields(DEFAULT_VISIBLE_BOARD_FIELDS);
      })
      .finally(() => setInitializing(false));
  }, [open]);

  useEffect(() => {
    if (open) return;

    setLoading(false);
    setInitializing(false);
    setRecruiter([]);
    setPositions([]);
    setStages([]);
    setApplicants([]);
  }, [open]);

  return {
    applicants,
    columnField,
    initializing,
    loading,
    positions,
    recruiters,
    rowField,
    setColumnField,
    setLoading,
    setRowField,
    setVisibleColumnValues,
    setVisibleFields,
    setVisibleRowValues,
    stages,
    visibleColumnValues,
    visibleFields,
    visibleRowValues,
  };
}
