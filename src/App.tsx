import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
import React from 'react';

import { Box } from '@mui/material';

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

  return (
    <div style={
      {
        color: '#ff0201',
        flex: 1,
        width: '95%',
        height: '90vh',
        // flexDirection: 'row',
      }
    }>
      <Box
        sx={
          {
            display: 'flex',
            height: '50%',
            width: '100%',
            m: 1,
            p: 1,
            bgcolor: '#fff201',
            overflow: 'scroll'
          }
        }
      >
        {<MainPanel/>}
      </Box>
      <Box
        sx={
          {
            display: 'inline-flex',
            m: 1,
            p: 1,
            height: '50%',
            width: '100%',
            bgcolor: '#00f201',
            overflow: 'scroll'
          }
        }
      >
        {<MainPanel/>}
      </Box>
    </div>
  );
}
const MainPanel = () => {
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
    accessItemByIdx(event_.args.rowindex);
  };

  const accessItemByIdx = (rowIdx: number) => {
    const entry = entries[rowIdx];
    if (entry.type === "dir") {
      setDir(entry.path)
    }
  }
  const accessSelectingItem = () => {
    const rowIdxAry = myGrid.current?.getselectedrowindexes();
    if (!rowIdxAry) { return; }
    if (rowIdxAry.length !== 1) { return; }
    accessItemByIdx(rowIdxAry[0]);
  }

  const handlekeyboardnavigation = (event: Event) => {
    const keyboard_event = event as KeyboardEvent;
    if (keyboard_event.type !== 'keydown') { return false; }
    if (keyboard_event.key === 'Enter') {
      accessSelectingItem();
    }
    return false;
  };

  const myGrid = React.createRef<JqxGrid>();

  return (
    <div style={
      {
        color: '#ff0201',
        flex: 1,
        width: '95%',
        height: '90vh',
      }
    }>
      <br />
      <input
        type="text"
        value={dir}
        onChange={e => setDir(e.target.value)}
        style={
          {
            width: '96%',
          }
        }
      />
      <br />
      <JqxGrid
        width={'100%'}
        source={src}
        columns={columns}
        pageable={false}
        editable={false}
        autoheight={true}
        sortable={true} theme={'material-purple'}
        altrows={true} enabletooltips={true}
        selectionmode={'multiplerowsextended'}
        onRowdoubleclick={onRowdoubleclick}
        handlekeyboardnavigation={handlekeyboardnavigation}
        ref={myGrid}
      />
    </div>
  );
}


export default App;
