import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
// import DataGrid from "react-data-grid";
import React from 'react';

import { DataGrid, GridRowsProp, GridColDef } from '@mui/x-data-grid';



// import { Grid } from "gridjs";
// import "gridjs/dist/theme/mermaid.css";

// function helloWorld() {
//   const wrapperRef = useRef(null);

//   const grid = new Grid({
//     columns: ['Name', 'Email', 'Phone Number'],
//     data: [
//       ['John', 'john@example.com', '(353) 01 222 3333'],
//       ['Mark', 'mark@gmail.com', '(01) 22 888 4444']
//     ]
//   });

//   useEffect(() => {
//     grid.render(wrapperRef.current);
//   });

//   return <div ref={wrapperRef} />;
// }

import { Grid } from 'gridjs-react';


type Entry = {
  type: 'dir' | 'file';
  name: string;
  path: string;
};

type Entries = Array<Entry>;

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


  function convert(entries: Entries): string[][] {
    return entries.map(entry => [entry.name, entry.path]);
  }

  const columns: GridColDef[] = [
    { field: 'col1', headerName: 'Column 1', width: 150 },
    { field: 'col2', headerName: 'Column 2', width: 150 },
  ];
  const rows: GridRowsProp = [
    { id: 1, col1: 'Hello', col2: 'World' },
    { id: 2, col1: 'DataGridPro', col2: 'is Awesome' },
    { id: 3, col1: 'MUI', col2: 'is Amazing' },
  ];

  return (
    <>
      <br />
      <input type="text" value={dir} onChange={e => setDir(e.target.value)} />
      <br />

      <div style={{ height: 300, width: '100%' }}>
        <DataGrid rows={rows} columns={columns} />
      </div>
    </>
  );
}


export default App;
