import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';

import { DataGrid, GridRowsProp, GridColDef, GridRowParams } from '@mui/x-data-grid';


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
      (entry, idx) => { return { id: idx, name: entry.name } }
    );
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'name', width: 150 },
  ];
  const onRowDoubleClick = (params: GridRowParams) => {
    const entry = entries[params.row.id];
    if (entry.type === "dir") {
      setDir(entry.path)
    }
  }

  return (
    <>
      <br />
      <input type="text" value={dir} onChange={e => setDir(e.target.value)} />
      <br />

      <div style={{ width: '100%' }}>
        <DataGrid
          rows={convert(entries)}
          columns={columns}
          autoHeight
          onRowDoubleClick={onRowDoubleClick}
          rowsPerPageOptions={[100]}
        />
      </div>
    </>
  );
}


export default App;
