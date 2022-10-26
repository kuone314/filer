import { useState } from 'react';

const App = () => {
  const [name, setName] = useState('anonymous');

  return (
    <>
      <div>Hello, {name}</div>
      <input type="text" value={name} onChange={e => setName(e.target.value)} />
    </>
  );
}

export default App;
