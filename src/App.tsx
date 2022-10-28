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
  const [entries, setEntries] = useState<Entries | null>(null);

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

      setEntries(entries);
    })();
  }, [dir]);


  const FileListItem = (entry: Entry) => {
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

  const dt =
    [
      ['John', 'john@example.com'],
      ['Mike', 'mike@gmail.com']
    ];


  return (
    <>
      <br />
      <input type="text" value={dir} onChange={e => setDir(e.target.value)} />
      <br />
      <Grid
        data={dt}
        columns={['Name', 'Email']}
        search={true}
        pagination={{
          enabled: true,
          limit: 1,
        }}
      />
    </>
  );
}


export default App;
