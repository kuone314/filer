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


  const data: IGridSource[] = [
    {
      url: "aaa", // ?: string;
      data: "aaa", // ?: any;
      localdata: ["aaa","bb","cc"], // ?: any;
      datatype:"array", // ?: 'xml' | 'json' | 'jsonp' | 'tsv' | 'csv' | 'local' | 'array' | 'observablearray';
      // type:"aaa", // ?: 'GET' | 'POST';
      id: "aaa", // ?: string;
      root: "aaa", // ?: string;
      record: "aaa", // ?: string;
      // datafields:"aaa", // ?: IGridSourceDataFields[];
      // pagenum:"aaa", // ?: number;
      // pagesize:"aaa", // ?: number;
      // pager:"aaa", // ?: (pagenum?: number, pagesize?: number, oldpagenum?: number) => any;
      sortcolumn: "aaa", // ?: string;
      // sortdirection:"aaa", // ?: 'asc' | 'desc';
      // sort:"aaa", // ?: (column?: any, direction?: any) => void;
      // filter:"aaa", // ?: (filters?: any, recordsArray?: any) => void;
      // addrow:"aaa", // ?: (rowid?: any, rowdata?: any, position?: any, commit?: boolean) => void;
      // deleterow:"aaa", // ?: (rowid?: any, commit?: boolean) => void;
      // updaterow:"aaa", // ?: (rowid?: any, newdata?: any, commit?: any) => void;
      // processdata:"aaa", // ?: (data: any) => void;
      // formatdata:"aaa", // ?: (data: any) => any;
      // async:"aaa", // ?: boolean;
      // totalrecords:"aaa", // ?: number;
      // unboundmode:"aaa", // ?: boolean;
    }
  ];
  const columns: IGridColumn[] =
    [
      { text: 'Product Name', columngroup: 'ProductDetails', datafield: 'ProductName', width: 250 },
      { text: 'Quantity per Unit', columngroup: 'ProductDetails', datafield: 'QuantityPerUnit', cellsalign: 'right', align: 'right', width: 200 },
      { text: 'Unit Price', columngroup: 'ProductDetails', datafield: 'UnitPrice', align: 'right', cellsalign: 'right', cellsformat: 'c2', width: 200 },
      // { text: 'Units In Stock', datafield: 'UnitsInStock', cellsalign: 'right', cellsrenderer: cellsrenderer, width: 100 },
      { text: 'Discontinued', columntype: 'checkbox', datafield: 'Discontinued' }
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
