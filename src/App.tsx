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

import styles from './App.module.css'

///////////////////////////////////////////////////////////////////////////////////////////////////
const initTabs = await invoke<String>("read_setting_file", { filename: "tabs.json5" });
const defaultDir = await homeDir();
const getInitTab = () => {
  try {
    let result = JSON.parse(initTabs.toString()) as string[][];
    if (result.length === 1) {
      result.push([defaultDir])
    }

    if (result[0].length === 0) {
      result[0].push(defaultDir)
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

  const onTabsChanged = (newTabs: string[], painIndex: number) => {
    tabsPathAry[painIndex] = newTabs;

    const data = JSON.stringify(tabsPathAry, null, 2);
    (async () => {
      await invoke<void>("write_setting_file", { filename: "tabs.json5", content: data })
    })()
  }

  return (
    <div className={styles.AppMain}>
      {
        tabsPathAry.map((pathAry, idx) => {
          return <PaineTabs
            pathAry={tabsPathAry[idx]}
            onPathChanged={onPathChanged}
            onTabsChanged={onTabsChanged}
            painIndex={idx}
          />
        })
      }
      <CommandBar
        path={getPath}
      />
    </div>
  );
}

export default App;
