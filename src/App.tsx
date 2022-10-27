import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
import React from 'react';

import { useTable, Column } from 'react-table';

// type Entry = {
//   type: 'dir' | 'file';
//   name: string;
//   path: string;
// };

// type Entries = Array<Entry>;

const columns: Column<Data>[] = [
  {
    Header: '名前',
    accessor: 'name'
  },
  {
    Header: 'パス',
    accessor: 'path'
  }
];

type Data = {
  type: 'dir' | 'file';
  name: string;
  path: string;
}

const data: Data[] = [
  {
    type: 'dir',
    name: 'John',
    path: 'aaa'
  },
  {
    type: 'dir',
    name: 'Jane',
    path: 'bbb'
  }
];

const App = () => {
  const [dir, setDir] = useState<string>("");
  const [entries, setEntries] = useState<Data[] | null>(null);

  useEffect(() => {
    (async () => {
      const home = await homeDir();
      setDir(home);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const entries = await invoke<Data[]>("get_entries", { path: dir })
        .catch(err => {
          console.error(err);
          return null;
        });

      setEntries(entries);
    })();
  }, [dir]);


  const FileListItem = (entry: Data) => {
    if (entry.type === "dir") {
      return <li key={entry.path} onClick={() => setDir(entry.path)}>{entry.name}</li>;
    } else {
      return <li key={entry.path}>{entry.name}</li>;
    }
  }

  // entry_list 部分の、html の生成、かな。
  const entry_list = entries ? <ul>
    {entries.map(entry => { return FileListItem(entry) })}
  </ul> : null;


  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable<Data>({ columns, data });

  return (
    <>
      <br />
      <input type="text" value={dir} onChange={e => setDir(e.target.value)} />
      <br />
      {entry_list}
      <br />
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                  return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}


export default App;
