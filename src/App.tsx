import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
import React from 'react';


import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css';
import 'jqwidgets-scripts/jqwidgets/styles/jqx.material-purple.css';
import JqxGrid, { IGridProps, jqx, IGridColumn, IGridSource } from 'jqwidgets-scripts/jqwidgets-react-tsx/jqxgrid';

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
      convert(entries);
    })();
  }, [dir]);

  const data: IGridProps['source'] = {
    localdata: [],
    datafields:
      [
        { name: 'name', type: 'string', map: '0' },
        { name: 'path', type: 'string', map: '1' },
      ],
    datatype: 'array'
  };
  const convert = (entries: Entries) => {
    data.localdata = entries.map(
      (entry: Entry) => { return [entry.name, entry.path]; }
    );
  }
  convert(entries);

  const columns: IGridProps['columns'] =
    [
      { text: 'FIleName', datafield: 'name', width: 240 },
      { text: 'FullPath', datafield: 'path', width: 240 },
    ];
  const src = new jqx.dataAdapter(data)

  const onRowdoubleclick = (event?: Event) => {
    if (!event) { return; }

    interface Args {
      args: { rowindex: number; }
    }
    const event_ = event as any as Args;
    alert(event_.args.rowindex);
  };

  return (
    <>
      <br />
      <input type="text" value={dir} onChange={e => setDir(e.target.value)} />
      <br />
      <JqxGrid
        width={800}
        // height={500}
        source={src}
        columns={columns}
        pageable={false}
        editable={false}
        autoheight={true}
        sortable={true} theme={'material-purple'}
        altrows={true} enabletooltips={true}
        selectionmode={'multiplerowsextended'}
        onRowdoubleclick={onRowdoubleclick}
      />
    </>
  );
}


export default App;
