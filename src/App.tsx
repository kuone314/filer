import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
import React from 'react';

import { Box } from '@mui/material';

import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css';
import 'jqwidgets-scripts/jqwidgets/styles/jqx.material-purple.css';
import JqxGrid, { IGridProps, jqx, IGridColumn, IGridSource } from 'jqwidgets-scripts/jqwidgets-react-tsx/jqxgrid';

import CommandBar from './CommandBar';
import { PaineTabs, TabInfo } from './MainPain';

import styles from './App.module.css'

import JSON5 from 'json5'


///////////////////////////////////////////////////////////////////////////////////////////////////
const initTabs = await invoke<String>("read_setting_file", { filename: "tabs.json5" });
const defaultDir = await homeDir();
const getInitTab = () => {
  const defaultTabInfo = { pathAry: [defaultDir], activeTabIndex: 0 }

  try {
    let result = JSON5.parse(initTabs.toString()) as TabInfo[];
    if (result.length === 1) {
      result.push(defaultTabInfo)
    }

    const fixError = (tabInfo: TabInfo) => {
      tabInfo.pathAry = tabInfo.pathAry.filter(s => s);
      if (tabInfo.pathAry.length === 0) {
        tabInfo.pathAry.push(defaultDir)
      }

      if (tabInfo.activeTabIndex < 0 || tabInfo.pathAry.length <= tabInfo.activeTabIndex) {
        tabInfo.activeTabIndex = 0
      }

      return tabInfo;
    }

    return result.map(fixError);
  } catch {
    return [{ ...defaultTabInfo }, { ...defaultTabInfo }];
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
function GetActive(tab_info: TabInfo) {
  return tab_info.pathAry[tab_info.activeTabIndex];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
const App = () => {
  const getPath = () => {
    return GetActive(tabsPathAry.current[currentPainIndex]);
  }

  const [currentPainIndex, setCurrentPainIndex] = useState(0);
  const tabsPathAry = useRef<TabInfo[]>(getInitTab());

  const onTabsChanged = (newTabs: string[], newTabIdx: number, painIndex: number) => {
    setCurrentPainIndex(painIndex);

    tabsPathAry.current[painIndex].pathAry = newTabs;
    tabsPathAry.current[painIndex].activeTabIndex = newTabIdx;

    const data = JSON5.stringify(tabsPathAry.current, null, 2);
    (async () => {
      await invoke<void>("write_setting_file", { filename: "tabs.json5", content: data })
    })()
  }

  return (
    <div className={styles.AppMain}>
      {
        tabsPathAry.current.map((pathAry, idx) => {
          return <PaineTabs
            pathAry={pathAry}
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
