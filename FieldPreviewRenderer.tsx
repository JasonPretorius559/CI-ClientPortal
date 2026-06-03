import React from 'react';
import { ReportFieldDefinition } from './useReportCatalog';

interface Props {
  fieldKey: string;
  definition?: ReportFieldDefinition;
  value: any;
}

export const FieldPreviewRenderer: React.FC<Props> = ({ fieldKey, definition, value }) => {
  if (value === undefined || value === null) {
    return <span className="text-gray-400 italic">{"{{"} {fieldKey} {"}}"}</span>;
  }

  const type = definition?.type || 'string';

  switch (type) {
    case 'list':
      return (
        <ul className="list-disc ml-4">
          {Array.isArray(value) && value.map((item, i) => (
            <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
          ))}
        </ul>
      );

    case 'table':
      // Even if value is empty, we show the table headers if definition children exist
      const rows = Array.isArray(value) ? value : [];
      
      const headers = definition?.children && definition.children.length > 0
        ? definition.children.map(c => ({ key: c.key, label: c.label }))
        : rows.length > 0 
          ? Object.keys(rows[0]).map(k => ({ key: k, label: k }))
          : [];

      if (headers.length === 0) return <span className="text-ink-400 italic">Empty Table</span>;

      return (
        <table className="min-w-full divide-y divide-ink-200 border border-ink-200 rounded-sm">
          <thead className="bg-ink-50">
            <tr>
              {headers.map(h => <th key={h.key} className="px-2 py-1 bg-gray-50 text-left text-xs">{h.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row, i) => (
              <tr key={i}>
                {headers.map(h => (
                  <td key={h.key} className="px-2 py-1 text-xs border-t text-ink-700">
                    {String(row[h.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-2 py-4 text-center text-xs text-ink-400 italic">
                  No data available for preview
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );

    case 'richText':
      return <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: value }} />;

    case 'date':
      return <span>{new Date(value).toLocaleDateString()}</span>;

    case 'object':
      return <pre className="text-xs bg-gray-50 p-2">{JSON.stringify(value, null, 2)}</pre>;

    default:
      return <span>{String(value)}</span>;
  }
};