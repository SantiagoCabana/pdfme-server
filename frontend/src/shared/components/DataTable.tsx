import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

export interface DataTableColumn {
  name: string;
  sort?: boolean;
}

interface DataTableProps {
  columns: (string | DataTableColumn)[];
  data: React.ReactNode[][];
  height?: string;
}

export function DataTable({ columns, data, height = '100%' }: DataTableProps) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const cols = columns.map((c) =>
    typeof c === 'string' ? { name: c, sort: true } : { sort: true, ...c }
  );

  function handleSort(index: number) {
    if (!cols[index].sort) return;
    if (sortCol === index) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(index);
      setSortDir('asc');
    }
  }

  const sorted = sortCol !== null
    ? [...data].sort((a, b) => {
        const av = String(a[sortCol] ?? '');
        const bv = String(b[sortCol] ?? '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : data;

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: 0,
        overflow: 'auto',
        height,
        '& table': { width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' },
        '& thead th': {
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
          textAlign: 'left',
          fontWeight: 600,
          fontSize: '0.8rem',
          color: 'text.secondary',
          px: 1.5,
          py: 1,
          borderBottom: '2px solid',
          borderColor: 'divider',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        },
        '& thead th.sortable': { cursor: 'pointer', '&:hover': { color: 'primary.main' } },
        '& tbody tr': {
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: 'background 0.1s',
          '&:hover': { bgcolor: 'action.hover' },
          '&:last-child': { borderBottom: 'none' },
        },
        '& tbody td': { px: 1.5, py: 1, fontSize: '0.85rem', verticalAlign: 'middle' },
      }}
    >
      <table>
        <thead>
          <tr>
            {cols.map((col, i) => (
              <th
                key={i}
                className={col.sort ? 'sortable' : ''}
                onClick={() => handleSort(i)}
              >
                {col.name}
                {col.sort && sortCol === i ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={cols.length}>
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary', fontSize: '0.85rem' }}>
                  No se encontraron registros
                </Box>
              </td>
            </tr>
          ) : (
            sorted.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Box>
  );
}

interface PaginationBarProps {
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  rowsPerPage: number;
  setRowsPerPage: (n: number) => void;
  total: number;
}

export function PaginationBar({ page, setPage, rowsPerPage, setRowsPerPage, total }: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const from = total === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min((page + 1) * rowsPerPage, total);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        gap: 1,
        flexShrink: 0,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {total === 0 ? 'Sin registros' : <>{`Mostrando `}<b>{from}</b>{` a `}<b>{to}</b>{` de `}<b>{total}</b>{` registros`}</>}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">Filas por página:</Typography>
        <select
          value={rowsPerPage}
          onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d9d9d9', fontSize: '0.75rem', outline: 'none', cursor: 'pointer', background: 'transparent' }}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Button size="small" disabled={page === 0} onClick={() => setPage((p) => p - 1)} sx={{ minWidth: 'auto', px: 1 }}>{'<'}</Button>
          <Typography variant="caption" sx={{ px: 1, whiteSpace: 'nowrap' }}>{page + 1} / {totalPages}</Typography>
          <Button size="small" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} sx={{ minWidth: 'auto', px: 1 }}>{'>'}</Button>
        </Box>
      </Box>
    </Box>
  );
}
