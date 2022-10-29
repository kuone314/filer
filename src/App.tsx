import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
// import DataGrid from "react-data-grid";
import React from 'react';

import { DataGrid, GridRowsProp, GridColDef, GridRowParams } from '@mui/x-data-grid';



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


  function convert(entries: Entries): GridRowsProp {
    return entries.map(
      (entry, idx) => { return { id: idx, name: entry.name, path: entry.path } }
    );
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'name', width: 150 },
    { field: 'path', headerName: 'path', width: 400 },
  ];
  const onRowDoubleClick = (params: GridRowParams) => {
    const entry = entries[params.row.id];
    if (entry.type === "dir") {
      setDir(params.row.path)
    }
  }

  return (
    <>
      <br />
      <input type="text" value={dir} onChange={e => setDir(e.target.value)} />
      <br />

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={convert(entries)}
          columns={columns}
          onRowDoubleClick={onRowDoubleClick}
        />
      </div>
    </>
  );
}


export default App;
