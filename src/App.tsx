import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';


type Entry = {
  type: 'dir' | 'file';
  name: string;
  path: string;
};

type Entries = Array<Entry>;


const App = () => {
  // [変数名,setter] で宣言、sette(foo) と呼び出すと、変数に foo が入る、かな？
  // 変数は <> の所で、{} で括ると参照出来るっぽい。
  const [name, setName] = useState('anonymous');

  const [hello, setHello] = useState<string>('');
  useEffect(() => {
    (async () => {
      const res = await invoke<string>("greet", { name: "Rust" });
      setHello(res);
    })();
  }, []);

  const [dir, setDir] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entries | null>(null);
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


  return (
    <>
      <div>Hello, {name}</div>
      <input type="text" value={name} onChange={e => setName(e.target.value)} />
      <br />
      {hello}
    </>
  );
}

export default App;
