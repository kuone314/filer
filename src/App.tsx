import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';

const App = () => {
  const [name, setName] = useState('anonymous');

  const [hello, setHello] = useState<string>('');
  useEffect(() => {
    (async () => {
      const res = await invoke<string>("greet", { name: "Rust" });
      setHello(res);
    })();
  }, []);

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
