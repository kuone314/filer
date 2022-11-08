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
          }
        }
      >
        {<MainPanel />}
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
          }
        }
      >
        {<MainPanel />}
      </Box>
    </div>
  );
}
const MainPanel = () => {
  const [addressbatStr, setAddressbatStr] = useState<string>("");
  const [entries, setEntries] = useState<Entries>([]);

  useEffect(() => {
    (async () => {
      const home = await homeDir();
      update(home);
    })();
  }, []);

  const update = async (path: string) => {
    const entries = await invoke<Entries>("get_entries", { path: path })
      .catch(err => {
        console.error(err);
        return null;
      });

    if (!entries) { return; }

    setAddressbatStr(path);
    setEntries(entries);
  }

  const convert = (entries: Entries) => {
    const data: IGridProps['source'] = {
      localdata: entries.map(
        (entry: Entry) => { return [entry.name, entry.path]; }
      ),
      datafields:
        [
          { name: 'name', type: 'string', map: '0' },
          { name: 'path', type: 'string', map: '1' },
        ],
      datatype: 'array'
    };
    return data;
  }

  const columns: IGridProps['columns'] =
    [
      { text: 'FIleName', datafield: 'name', width: 240 },
      { text: 'FullPath', datafield: 'path', width: 240 },
    ];

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
      update(entry.path)
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

  const onEnterDown = async () => {
    type AdjustedAddressbarStr = {
      dir: string,
    };
    const adjusted = await invoke<AdjustedAddressbarStr>("adjust_addressbar_str", { str: addressbatStr });

    update(adjusted.dir);
    myGrid.current?.focus();
  }
  const onEscapeDown = () => {
    myGrid.current?.focus();
  }
  const onKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') { onEnterDown(); return; }
    if (event.key === 'Escape') { onEscapeDown(); return; }
  };

  const myGrid = React.createRef<JqxGrid>();

  return (
    <div style={
      {
        color: '#ff0201',
        flex: 1,
        width: '95%',
      }
    }>
      <input
        type="text"
        value={addressbatStr}
        onChange={e => setAddressbatStr(e.target.value)}
        onKeyDown={onKeyDown}
        style={
          {
            width: '96%',
          }
        }
      />
      <Box
        sx={
          {
            display: 'flex',
            height: '90%',
            width: '100%',
            m: 1,
            p: 1,
            bgcolor: '#ff0201',
            overflow: 'scroll'
          }
        }
      >
        <JqxGrid
          width={'100%'}
          source={convert(entries)}
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
      </Box>
    </div>
  );
}


export default App;
