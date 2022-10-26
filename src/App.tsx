import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';


type Entry = {
  type: 'dir' | 'file';
  name: string;
  path: string;
};

type Entries = Array<Entry>;


const App = () => {
  const [src, setSrc] = useState<string | null>(null);
  const [dir, setDir] = useState<string | null>(null);
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

  const entry_list = entries ? <ul>
    {entries.map(entry => {
      if (entry.type === "dir") {
        return <li key={entry.path} onClick={() => setDir(entry.path)}>{entry.name}</li>;
      } else {
        return <li key={entry.path} onClick={() => setSrc(entry.path)}>{entry.name}</li>;
      }
    })}
  </ul> : null;

  return (
    <>
      <br />
      src: {src ?? '(not selected)'}
      <br />
      dir: {dir ?? ''}
      <br />
      {entry_list}
    </>
  );
}


export default App;
