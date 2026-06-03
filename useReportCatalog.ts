import { useState, useEffect } from 'react';
import axios from 'axios';

export interface ReportFieldDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'list' | 'object' | 'table' | 'richText';
  sourcePath: string;
  groupId?: string;
  groupLabel?: string;
  repeatable?: boolean;
  children?: ReportFieldDefinition[];
  example?: any;
}

export const SCHEMA_LABELS: Record<string, string> = {
  personal_policy_analysis_v1: 'Personal Policy Analysis',
  commercial_policy_analysis_v1: 'Commercial Policy Analysis',
  sectional_title_policy_analysis_v1: 'Sectional Title Policy Analysis',
  personal_record_of_advice_v1: 'Personal Record of Advice',
  commercial_record_of_advice_v1: 'Commercial Record of Advice',
  sectional_title_record_of_advice_v1: 'Sectional Title Record of Advice',
  personal_comparison_v1: 'Personal Comparison',
  commercial_comparison_v1: 'Commercial Comparison',
  sectional_title_comparison_v1: 'Sectional Title Comparison',
  sectional_title_agm_pack_v1: 'Sectional Title AGM Pack',
};

export function useReportCatalog(caseId?: string, analysisId?: string) {
  const [catalog, setCatalog] = useState<ReportFieldDefinition[]>([]);
  const [resolvedData, setResolvedData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSchemaKey, setSelectedSchemaKey] = useState<string | null>(null);
  const [schemaKeys, setSchemaKeys] = useState<string[]>([]);

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        if (caseId) {
          // Case-aware mode: Get catalog + real preview data
          const url = `/api/cases/${caseId}/reports/field-catalog${analysisId ? `?analysisId=${analysisId}` : ''}`;
          const response = await axios.get(url);
          const data = response.data;
          
          // Handle both raw array responses and wrapped object responses
          const catalog = Array.isArray(data) ? data : (data.catalog || []);
          const previewData = Array.isArray(data) ? {} : (data.previewData || {});
          const schemaKey = Array.isArray(data) ? null : (data.schemaKey || null);

          if (schemaKey) {
            setSelectedSchemaKey(schemaKey);
          }
          
          // Also fetch schema keys even in case-aware mode so the UI knows the "family"
          const { data: keysData } = await axios.get('/api/reports/field-catalog');
          setSchemaKeys(Array.isArray(keysData) ? keysData : (keysData.schemaKeys || []));

          setCatalog(catalog);
          setResolvedData(previewData);
        } else {
          // Template-only mode: Fetch available families
          const { data } = await axios.get('/api/reports/field-catalog');
          setSchemaKeys(Array.isArray(data) ? data : (data.schemaKeys || []));
        }
      } catch (error) {
        console.error('Failed to load report catalog', error);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, [caseId, analysisId]);

  const selectSchemaKey = async (schemaKey: string) => {
    setSelectedSchemaKey(schemaKey);
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/reports/field-catalog/${schemaKey}`);
      setCatalog(data);
    } finally {
      setLoading(false);
    }
  };

  return {
    catalog,
    resolvedData,
    loading,
    selectedSchemaKey,
    schemaKeys: schemaKeys.map(key => ({
      key,
      label: SCHEMA_LABELS[key] || key
    })),
    selectSchemaKey
  };
}