import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
import React from 'react';

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

  const grid = new Grid({
    columns: ['Name', 'Email', 'Phone Number'],
    sort: true,
    search: true,
    data: [
      ['John', 'john@example.com', '(353) 01 222 3333'],
      ['Mark', 'mark@gmail.com',   '(01) 22 888 4444'],
      ['Eoin', 'eo3n@yahoo.com',   '(05) 10 878 5554'],
      ['Nisen', 'nis900@gmail.com',   '313 333 1923']
    ]
  });

  const tst_grid = new Grid({
    data: convert(entries),
    columns: ['Name', 'Email'],
    width: "30"
  });
  // tst_grid.on();

  return (
    <>
      <br />
      <input type="text" value={dir} onChange={e => setDir(e.target.value)} />
      <br />
      {tst_grid}
    </>
  );
}


export default App;
