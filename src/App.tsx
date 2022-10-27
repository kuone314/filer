import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
import React from 'react';

import { useTable, Column } from 'react-table';

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';


///////////////////////////////////////////////////////////////////////////////////////////////////

type Entry = {
  type: 'dir' | 'file';
  name: string;
  path: string;
};

type Entries = Array<Entry>;


///////////////////////////////////////////////////////////////////////////////////////////////////

const App = () => {
  const [dir, setDir] = useState<string>("");
  const [entries, setEntries] = useState<Entries>([]);

  useEffect(() => {
    (async () => {
      const home = await homeDir();
      setDir(home);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const entries = await invoke<Entries>("get_entries", { path: dir })
        .catch(err => {
          console.error(err);
          return null;
        });

      setEntries(entries ? entries : []);
    })();
  }, [dir]);


  const FileListItem = (entry: Entry) => {
    if (entry.type === "dir") {
      return <li key={entry.path} onClick={() => setDir(entry.path)}>{entry.name}</li>;
    } else {
      return <li key={entry.path}>{entry.name}</li>;
    }
  }

  const columns: ColumnDef<Entry, any>[] = [
    {
      header: 'ファイル名',
      accessorKey: 'name',
    },
    {
      header: 'パス',
      accessorKey: 'path',
    },
  ];
  const BasicTable: React.FC = () => {
    const table = useReactTable<Entry>({
      data: entries,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });
    return (
      <div>
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // entry_list 部分の、html の生成、かな。
  const entry_list = entries ? <ul>
    {entries.map(entry => { return FileListItem(entry) })}
  </ul> : null;

  return (
    <>
      <br />
      <input type="text" value={dir} onChange={e => setDir(e.target.value)} />
      <br />
      {BasicTable(entries)}
      <br />
    </>
  );
}


export default App;
