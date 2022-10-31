import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
import React from 'react';

import JqxGrid, { IGridProps, jqx, IGridColumn, IGridSource } from 'jqwidgets-scripts/jqwidgets-react-tsx/jqxgrid';

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


  const data: IGridProps['source'] = {
    localdata:
      [
        ['Maria Anders', 'Sales Representative', 'Berlin', 'Germany'],
        ['Ana Trujillo', 'Owner', 'Mxico D.F.', 'Mexico'],
        ['Antonio Moreno', 'Owner', 'Mxico D.F.', 'Mexico'],
        ['Thomas Hardy', 'Sales Representative', 'London', 'UK'],
        ['Christina Berglund', 'Order Administrator', 'Lule', 'Sweden'],
        ['Hanna Moos', 'Sales Representative', 'Mannheim', 'Germany'],
        ['Frdrique Citeaux', 'Marketing Manager', 'Strasbourg', 'France'],
        ['Martn Sommer', 'Owner', 'Madrid', 'Spain'],
        ['Owner', 'Marseille', 'France'],
        ['Elizabeth Lincoln', 'Accounting Manager', 'Tsawassen', 'Canada'],
        ['Victoria Ashworth', 'Sales Representative', 'London', 'UK'],
        ['Patricio Simpson', 'Sales Agent', 'Buenos Aires', 'Argentina'],
        ['Francisco Chang', 'Marketing Manager', 'Mxico D.F.', 'Mexico'],
        ['Yang Wang', 'Owner', 'Bern', 'Switzerland'],
        ['Pedro Afonso', 'Sales Associate', 'Sao Paulo', 'Brazil'],
        ['Elizabeth Brown', 'Sales Representative', 'London', 'UK'],
        ['Sven Ottlieb', 'Order Administrator', 'Aachen', 'Germany'],
        ['Janine Labrune', 'Owner', 'Nantes', 'France'],
        ['Ann Devon', 'Sales Agent', 'London', 'UK'],
        ['Roland Mendel', 'Sales Manager', 'Graz', 'Austria']
      ],
    datafields:
      [
        { name: 'ContactName', type: 'string', map: '0' },
        { name: 'Title', type: 'string', map: '1' },
        { name: 'City', type: 'string', map: '2' },
        { name: 'Country', type: 'string', map: '3' }
      ],
    datatype: 'array'
  };

  // const columns: IGridColumn[] =
  //   [
  //     { text: 'Product Name', columngroup: 'ProductDetails', datafield: 'ProductName', width: 250 },
  //     { text: 'Quantity per Unit', columngroup: 'ProductDetails', datafield: 'QuantityPerUnit', cellsalign: 'right', align: 'right', width: 200 },
  //     { text: 'Unit Price', columngroup: 'ProductDetails', datafield: 'UnitPrice', align: 'right', cellsalign: 'right', cellsformat: 'c2', width: 200 },
  //     // { text: 'Units In Stock', datafield: 'UnitsInStock', cellsalign: 'right', cellsrenderer: cellsrenderer, width: 100 },
  //     { text: 'Discontinued', columntype: 'checkbox', datafield: 'Discontinued' }
  //   ];
  const columns: IGridProps['columns'] =
    [
      { text: 'Contact Name', datafield: 'ContactName', width: 240 },
      { text: 'Contact Title', datafield: 'Title', width: 240 },
      { text: 'City', datafield: 'City', width: 150 },
      { text: 'Country', datafield: 'Country' }
    ];

  return (
    <>
      <br />
      <input type="text" value={dir} onChange={e => setDir(e.target.value)} />
      <br />
      <JqxGrid
        width={500}
        height={500}
        source={data}
        columns={columns}
      />
    </>
  );
}


export default App;
