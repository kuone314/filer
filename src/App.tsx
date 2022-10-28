import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
import React from 'react';


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

      if (!entries) { return; }

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

  return (
    <>
      <br />
      <input type="text" value={dir} onChange={e => setDir(e.target.value)} />
      <br />
      {entry_list}
    </>
  );
}


export default App;
