import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
import React from 'react';

import { Box } from '@mui/material';

import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css';
import 'jqwidgets-scripts/jqwidgets/styles/jqx.material-purple.css';
import JqxGrid, { IGridProps, jqx, IGridColumn, IGridSource } from 'jqwidgets-scripts/jqwidgets-react-tsx/jqxgrid';

import CommandBar from './CommandBar';
import { PaineTabs } from './MainPain';


///////////////////////////////////////////////////////////////////////////////////////////////////
const initTabs = await invoke<String>("read_setting_file", { filename: "tabs.json5" });
const defaultDir = await homeDir();
const getInitTab = () => {
  try {
    let result = JSON.parse(initTabs.toString()) as string[][];
    if (result[0].length === 0) {
      result[0].push(defaultDir)
    }
    if (result.length === 1) {
      result.push([defaultDir])
    }
    if (result[1].length === 0) {
      result[1].push(defaultDir)
    }
    return result;
  } catch {
    return [[defaultDir], [defaultDir]]
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
const App = () => {
  let path = 'C:';
  const onPathChanged = (inPath: string) => {
    path = inPath;
  }
  const getPath = () => { return path; }

  const [tabsPathAry, setTabsPathAry] = useState<string[][]>(getInitTab());

  const onTabsChanged = (inTabs: string[], painIndex: number) => {
    tabsPathAry[painIndex] = inTabs;

    const data = JSON.stringify(tabsPathAry, null, 2);
    (async () => {
      await invoke<void>("write_setting_file", { filename: "tabs.json5", content: data })
    })()
  }

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
      {
        tabsPathAry.map((pathAry, idx) => {
          return <Box
            sx={
              {
                display: 'flex',
                height: '47%',
                width: '100%',
                m: 1,
                p: 1,
                bgcolor: '#fff201',
              }
            }
          >
            {<PaineTabs
              pathAry={pathAry}
              onPathChanged={onPathChanged}
              onTabsChanged={onTabsChanged}
              painIndex={idx}
            />}
          </Box>
        })
      }
      <CommandBar
        path={getPath}
      />
    </div>
  );
}

export default App;
