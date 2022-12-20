import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';

import { Box, Button } from '@mui/material';

import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css';
import 'jqwidgets-scripts/jqwidgets/styles/jqx.material-purple.css';
import JqxGrid, { IGridProps, jqx, IGridColumn, IGridSource } from 'jqwidgets-scripts/jqwidgets-react-tsx/jqxgrid';

import { executeShellCommand } from './RustFuncs';

import styles from './App.module.css'


///////////////////////////////////////////////////////////////////////////////////////////////////
type Entry = {
  name: string,
  is_dir: boolean,
  extension: string,
  size: number,
  date: string,
};

type Entries = Array<Entry>;

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface TabInfo {
  pathAry: string[],
  activeTabIndex: number,
}

///////////////////////////////////////////////////////////////////////////////////////////////////
function decoratePath(path: String): string {
  return '"' + path + '"';
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export const PaineTabs = (
  props: {
    pathAry: TabInfo,
    onPathChanged: (path: string) => void,
    onTabsChanged: (newTabs: string[], newTabIdx: number, painIndex: number) => void,
    painIndex: number,
  },
) => {
  const [tabAry, setTabAry] = useState<string[]>(props.pathAry.pathAry);
  const [activeTabIdx, setActiveTabIdx] = useState<number>(props.pathAry.activeTabIndex);
  const addNewTab = (newTabPath: string, addPosIdx: number) => {
    let newTabAry = Array.from(tabAry);
    newTabAry.splice(addPosIdx + 1, 0, newTabPath);
    setTabAry(newTabAry);
  }
  const removeTab = (idx: number) => {
    if (tabAry.length === 1) { return; }
    if (idx >= tabAry.length) { return; }

    let newTabAry = Array.from(tabAry);
    newTabAry.splice(idx, 1);
    setTabAry(newTabAry);

    if (activeTabIdx >= newTabAry.length) {
      setActiveTabIdx(newTabAry.length - 1);
    }
  }

  const onPathChanged = (newPath: string, tabIdx: number) => {
    tabAry[tabIdx] = newPath
    setTabAry(Array.from(tabAry));

    props.onPathChanged(newPath);
  }

  useEffect(() => {
    props.onTabsChanged(tabAry, activeTabIdx, props.painIndex);
  }, [tabAry, activeTabIdx]);

  const pathToTabName = (pathStr: string) => {
    const splited = pathStr.split('\\').reverse();
    if (splited[0].length !== 0) { return splited[0]; }
    return splited[1];
  }

  const tabColor = (path: string) => {
    if (path.startsWith('C')) return '#ffff00'
    return '#00ff00'
  }

  return (
    <>
      <div className={styles.PaineTabs}>
        <div
          className={styles.TabButton}
        >
          {
            tabAry.map((path, idx) => {
              return <Button
                style={
                  {
                    textTransform: 'none',
                    background: tabColor(path),
                    border: (idx === activeTabIdx) ? '5px solid #ff0000' : '',
                  }
                }
                onClick={() => { setActiveTabIdx(idx) }}
                defaultValue={pathToTabName(path)}
              >
                {pathToTabName(path)}
              </Button>
            })
          }
        </div >
        <MainPanel
          initPath={tabAry[activeTabIdx]}
          tabIdx={activeTabIdx}
          onPathChanged={onPathChanged}
          addNewTab={addNewTab}
          removeTab={removeTab}
          key={tabAry[activeTabIdx]}
        />
      </div>
    </>
  )
}

///////////////////////////////////////////////////////////////////////////////////////////////////
const MainPanel = (
  props: {
    initPath: string,
    tabIdx: number,
    onPathChanged: (newPath: string, tabIdx: number) => void
    addNewTab: (newTabPath: string, addPosIdx: number) => void,
    removeTab: (idx: number) => void,
  }
) => {
  const [addressbatStr, setAddressbatStr] = useState<string>("");
  const [dir, setDir] = useState<string>(props.initPath);
  const [entries, setEntries] = useState<Entries>([]);
  const [currentIndex, setCurrentIndex] = useState(0);


  const UpdateList = async () => {
    const newEntries = await invoke<Entries>("get_entries", { path: dir })
      .catch(err => {
        console.error(err);
        return null;
      });

    if (!newEntries) { return; }
    if (JSON.stringify(newEntries) === JSON.stringify(entries)) {
      return;
    }
    setEntries(newEntries);
  }

  useEffect(() => {
    UpdateList();
    setAddressbatStr(dir);
    props.onPathChanged(dir, props.tabIdx);
  }, [dir]);

  useEffect(() => {
    setInterval(
      UpdateList,
      1500
    );
  }, []);

  const convert = (entries: Entries) => {
    const data: IGridProps['source'] = {
      localdata: entries.map(
        (entry: Entry, index: number) => {
          return [
            entry.name,
            entry.is_dir ? 'folder' : entry.extension.length === 0 ? '-' : entry.extension,
            entry.is_dir ? '-' : entry.size,
            entry.date,
            index === currentIndex,
          ];
        }
      ),
      datafields:
        [
          { name: 'name', type: 'string', map: '0' },
          { name: 'extension', type: 'string', map: '1' },
          { name: 'size', type: 'number', map: '2' },
          { name: 'date', type: 'string', map: '3' },
          { name: 'isCurrent', type: 'bool', map: '4' },
        ],
      datatype: 'array'
    };
    return data;
  }

  const cellsrenderer = (
    row?: number,
    columnfield?: string,
    value?: any,
    defaulthtml?: string,
    columnproperties?: any,
    rowdata?: any
  ) => {
    if (rowdata.isCurrent) {
      return '<div style="border-style : double none;">' + value + '</div>';;
    }
    return '<div>' + value + '</div>';
  };

  const columns: IGridProps['columns'] =
    [
      { text: 'FIleName', datafield: 'name', width: 240, cellsrenderer: cellsrenderer, },
      { text: 'type', datafield: 'extension', width: 80, cellsrenderer: cellsrenderer, },
      { text: 'size', datafield: 'size', width: 40, cellsrenderer: cellsrenderer, },
      { text: 'date', datafield: 'date', width: 150, cellsrenderer: cellsrenderer, },
    ];

  const setupCurrentIndex = (newIndex: number, select: boolean) => {
    if (currentIndex === newIndex) { return; }
    if (newIndex < 0) { return; }
    if (newIndex >= entries.length) { return; }

    setCurrentIndex(newIndex)
    setincremantalSearchingStr('')

    if (!select) { return }

    const sttIdx = Math.min(currentIndex, newIndex);
    const endIdx = Math.max(currentIndex, newIndex);
    for (let idx = sttIdx; idx <= endIdx; idx++) {
      myGrid.current?.selectrow(idx);
    }
  }

  const [incremantalSearchingStr, setincremantalSearchingStr] = useState('');
  const incremantalSearch = (key: string) => {
    const nextSearchStr = incremantalSearchingStr + key;
    const idx = entries.findIndex((entry) => {
      return entry.name.toLowerCase().startsWith(nextSearchStr)
    })
    if (idx === -1) { return }

    setCurrentIndex(idx)
    setincremantalSearchingStr(nextSearchStr)
  }

  const onRowclick = (event?: Event) => {
    if (!event) { return; }

    interface Args {
      args: { rowindex: number; }
    }
    const event_ = event as any as Args;
    setCurrentIndex(event_.args.rowindex);
    setincremantalSearchingStr('')
  };

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
    if (entry.is_dir) {
      setDir(dir + '/' + entry.name)
    } else {
      const decoretedPath = '&"' + entry.name + '"';
      executeShellCommand(decoretedPath, dir);
    }
  }
  const accessCurrentItem = () => {
    accessItemByIdx(currentIndex);
  }

  const selectingItemPath = () => {
    if (entries.length === 0) { return [''] }

    let rowIdxAry = myGrid.current?.getselectedrowindexes();
    if (!rowIdxAry) { rowIdxAry = [currentIndex]; }

    return rowIdxAry
      .map(idx => decoratePath(entries[idx].name))
      ;
  }

  const toggleSelection = () => {
    if (myGrid.current?.getselectedrowindexes().includes(currentIndex)) {
      myGrid.current?.unselectrow(currentIndex);
    } else {
      myGrid.current?.selectrow(currentIndex);
    }
  }

  const handlekeyboardnavigation = (event: Event) => {
    const keyboard_event = event as KeyboardEvent;
    if (keyboard_event.type !== 'keydown') { return false; }
    if (keyboard_event.key === 'Enter') {
      accessCurrentItem();
      return true;
    }

    if (keyboard_event.key === 'ArrowUp') {
      const select = keyboard_event.shiftKey;
      setupCurrentIndex(currentIndex - 1, select)
      return true;
    }
    if (keyboard_event.key === 'ArrowDown') {
      const select = keyboard_event.shiftKey;
      setupCurrentIndex(currentIndex + 1, select)
      return true;
    }
    if (keyboard_event.key === 'Home') {
      const select = keyboard_event.shiftKey;
      setupCurrentIndex(0, select)
      return true;
    }
    if (keyboard_event.key === 'End') {
      const select = keyboard_event.shiftKey;
      setupCurrentIndex(entries.length - 1, select)
      return true;
    }
    if (keyboard_event.key === ' ') {
      toggleSelection();
      return true;
    }

    if (keyboard_event.ctrlKey && keyboard_event.key === 't') {
      props.addNewTab(dir, props.tabIdx);
      return true;
    }
    if (keyboard_event.ctrlKey && keyboard_event.key === 'w') {
      props.removeTab(props.tabIdx);
      return true;
    }
    if (keyboard_event.ctrlKey && keyboard_event.key === 'c') {
      const cmd = `
        $target = @(${selectingItemPath().join(',')})
        Add-Type -AssemblyName System.Windows.Forms
        $dataObj = New-Object System.Windows.Forms.DataObject
        $dataObj.SetFileDropList($target)
        $byteStream = [byte[]](([System.Windows.Forms.DragDropEffects]::Copy -as [byte]), 0, 0, 0)
        $memoryStream = [System.IO.MemoryStream]::new($byteStream)
        $dataObj.SetData("Preferred DropEffect", $memoryStream)
        [System.Windows.Forms.Clipboard]::SetDataObject($dataObj, $true)
      `;
      executeShellCommand(cmd, dir);
      return true;
    }
    if (keyboard_event.ctrlKey && keyboard_event.key === 'x') {
      const cmd = `
        $target = @(${selectingItemPath().join(',')})
        Add-Type -AssemblyName System.Windows.Forms
        $dataObj = New-Object System.Windows.Forms.DataObject
        $dataObj.SetFileDropList($target)
        $byteStream = [byte[]](([System.Windows.Forms.DragDropEffects]::Move -as [byte]), 0, 0, 0)
        $memoryStream = [System.IO.MemoryStream]::new($byteStream)
        $dataObj.SetData("Preferred DropEffect", $memoryStream)
        [System.Windows.Forms.Clipboard]::SetDataObject($dataObj, $true)
      `;
      executeShellCommand(cmd, dir);
      return true;
    }
    if (keyboard_event.ctrlKey && keyboard_event.key === 'v') {
      const cmd = `
      Add-Type -AssemblyName System.Windows.Forms

      $dstDir = "${dir}"

      $files = [Windows.Forms.Clipboard]::GetFileDropList() ;
      $data = [Windows.Forms.Clipboard]::GetDataObject()
      $dropEffect = $data.GetData("Preferred DropEffect");
      $flag = $dropEffect.ReadByte();

      if ($flag -band [Windows.Forms.DragDropEffects]::Copy) {
          Copy-Item $files $dstDir
    }
      if ($flag -band [Windows.Forms.DragDropEffects]::Move) {
          Move-Item $files $dstDir
  }
      `;
      executeShellCommand(cmd, dir);
      return true;
    }

    if (keyboard_event.key.length === 1) {
      incremantalSearch(keyboard_event.key)
      return true;
    }

    return false;
  };

  type AdjustedAddressbarStr = {
    dir: string,
  };

  const accessParentDir = async () => {
    const adjusted = await invoke<AdjustedAddressbarStr>("adjust_addressbar_str", { str: addressbatStr + '/..' });
    setDir(adjusted.dir);
  };

  const onEnterDown = async () => {
    const adjusted = await invoke<AdjustedAddressbarStr>("adjust_addressbar_str", { str: addressbatStr });

    setDir(adjusted.dir);
    myGrid.current?.focus();
  }
  const onEscapeDown = () => {
    myGrid.current?.focus();
  }
  const onKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') { onEnterDown(); return; }
    if (event.key === 'Escape') { onEscapeDown(); return; }
  };

  const onDoubleClick = () => {
    accessParentDir();
  }

  const myGrid = React.createRef<JqxGrid>();

  return (
    <>
      <div className={styles.MainPain}>
        <input
          type="text"
          value={addressbatStr}
          onChange={e => setAddressbatStr(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div
          className={styles.FileList}
          onDoubleClick={onDoubleClick}
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
            onRowclick={onRowclick}
            onRowdoubleclick={onRowdoubleclick}
            handlekeyboardnavigation={handlekeyboardnavigation}
            ref={myGrid}
          />
        </div>
      </div>
    </>
  );
}


