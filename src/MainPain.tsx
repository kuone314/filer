import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';

import { Button } from '@mui/material';

import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css';
import 'jqwidgets-scripts/jqwidgets/styles/jqx.material-purple.css';
import JqxGrid, { IGridProps } from 'jqwidgets-scripts/jqwidgets-react-tsx/jqxgrid';

import { executeShellCommand } from './RustFuncs';
import { separator, ApplySeparator } from './FilePathSeparator';
import { CommandInfo, COMMAND_TYPE, matchingKeyEvent, commandExecuter } from './CommandInfo';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { MenuItem, ControlledMenu } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';

import useInterval from 'use-interval';


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
export const PaineTabs = (
  props: {
    pathAry: TabInfo,
    onTabsChanged: (newTabs: string[], newTabIdx: number,) => void,
    getOppositePath: () => string,
    separator: separator,
    focusOppositePain: () => void,
    gridRef?: React.RefObject<HTMLDivElement>,
  },
) => {
  const [tabAry, setTabAry] = useState<string[]>(props.pathAry.pathAry);
  const [activeTabIdx, setActiveTabIdx] = useState<number>(props.pathAry.activeTabIndex);
  const addNewTab = (newTabPath: string) => {
    let newTabAry = Array.from(tabAry);
    newTabAry.splice(activeTabIdx + 1, 0, newTabPath);
    setTabAry(newTabAry);
  }
  const removeTab = () => {
    if (tabAry.length === 1) { return; }
    if (activeTabIdx >= tabAry.length) { return; }

    let newTabAry = Array.from(tabAry);
    newTabAry.splice(activeTabIdx, 1);
    setTabAry(newTabAry);

    if (activeTabIdx >= newTabAry.length) {
      setActiveTabIdx(newTabAry.length - 1);
    }
  }
  const changeTab = (offset: number) => {
    const new_val = (activeTabIdx + offset + tabAry.length) % tabAry.length;
    setActiveTabIdx(new_val);
  }

  const onPathChanged = (newPath: string) => {
    tabAry[activeTabIdx] = newPath
    setTabAry(Array.from(tabAry));
  }

  useEffect(() => {
    props.onTabsChanged(tabAry, activeTabIdx);
  }, [tabAry, activeTabIdx]);

  const pathToTabName = (pathStr: string) => {
    const splited = ApplySeparator(pathStr, '/').split('/').reverse();
    if (splited[0].length !== 0) { return splited[0]; }
    return splited[1];
  }

  const tabColor = (path: string) => {
    if (path.startsWith('C')) return '#ffff00'
    return '#00ff00'
  }

  return (
    <>
      <div
        css={css({
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          overflow: 'auto',
          width: '100%',
          height: '100%',
        })}
      >
        <div css={css({ textTransform: 'none' })}>
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
          onPathChanged={onPathChanged}
          addNewTab={addNewTab}
          removeTab={removeTab}
          changeTab={changeTab}
          getOppositePath={props.getOppositePath}
          separator={props.separator}
          focusOppositePain={props.focusOppositePain}
          gridRef={props.gridRef}
          key={activeTabIdx}
        />
      </div>
    </>
  )
}

///////////////////////////////////////////////////////////////////////////////////////////////////
const MainPanel = (
  props: {
    initPath: string,
    onPathChanged: (newPath: string) => void
    addNewTab: (newTabPath: string) => void,
    removeTab: () => void,
    changeTab: (offset: number) => void,
    getOppositePath: () => string,
    separator: separator,
    focusOppositePain: () => void,
    gridRef?: React.RefObject<HTMLDivElement>,
  }
) => {
  const [addressbatStr, setAddressbatStr] = useState<string>("");
  const [dir, setDir] = useState<string>(props.initPath);
  const [entries, setEntries] = useState<Entries>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const accessDirectry = async (path: string) => {
    const adjusted = await invoke<AdjustedAddressbarStr>("adjust_addressbar_str", { str: path });
    setDir(adjusted.dir);
  }


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
    setAddressbatStr(ApplySeparator(addressbatStr, props.separator));
  }, [props.separator]);

  useEffect(() => {
    UpdateList();
    setAddressbatStr(ApplySeparator(dir, props.separator));
    props.onPathChanged(dir);
  }, [dir]);

  useEffect(() => {
    myGrid.current?.focus();
  }, []);

  useInterval(
    UpdateList,
    1500
  );

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
    myGrid.current?.focus()
  };

  const onRowdoubleclick = (event?: Event) => {
    if (!event) { return; }

    interface Args {
      args: { rowindex: number; }
    }
    const event_ = event as any as Args;
    accessItemByIdx(event_.args.rowindex);
  };

  const accessItemByIdx = async (rowIdx: number) => {
    const entry = entries[rowIdx];
    if (entry.is_dir) {
      accessDirectry(dir + props.separator + entry.name);
    } else {
      const decoretedPath = '&"' + entry.name + '"';
      executeShellCommand(decoretedPath, dir);
    }
  }
  const accessCurrentItem = () => {
    accessItemByIdx(currentIndex);
  }

  const selectingItemName = () => {
    if (entries.length === 0) { return [''] }

    let rowIdxAry = myGrid.current?.getselectedrowindexes();
    if (!rowIdxAry || rowIdxAry.length === 0) { rowIdxAry = [currentIndex]; }

    return rowIdxAry.map(idx => entries[idx].name);
  }

  const selectingItemPath = () => {
    return selectingItemName().map(name => dir + '\\' + name);
  }

  const moveUp = () => { setupCurrentIndex(currentIndex - 1, false) }
  const moveUpSelect = () => { setupCurrentIndex(currentIndex - 1, true) }
  const moveDown = () => { setupCurrentIndex(currentIndex + 1, false) }
  const moveDownSelect = () => { setupCurrentIndex(currentIndex + 1, true) }
  const moveTop = () => { setupCurrentIndex(0, false) }
  const moveTopSelect = () => { setupCurrentIndex(0, true) }
  const moveBottom = () => { setupCurrentIndex(entries.length - 1, false) }
  const moveBottomSelect = () => { setupCurrentIndex(entries.length - 1, true) }
  const toggleSelection = () => {
    if (myGrid.current?.getselectedrowindexes().includes(currentIndex)) {
      myGrid.current?.unselectrow(currentIndex);
    } else {
      myGrid.current?.selectrow(currentIndex);
    }
  }
  const addNewTab = () => { props.addNewTab(dir); }
  const removeTab = () => { props.removeTab(); }
  const toPrevTab = () => { props.changeTab(-1); }
  const toNextTab = () => { props.changeTab(+1); }
  const focusAddoressBar = () => { addressBar.current?.focus(); }

  const execBuildInCommand = (commandName: string) => {
    switch (commandName) {
      case 'accessCurrentItem': accessCurrentItem(); return;
      case 'moveUp': moveUp(); return;
      case 'moveUpSelect': moveUpSelect(); return;
      case 'moveDown': moveDown(); return;
      case 'moveDownSelect': moveDownSelect(); return;
      case 'moveTop': moveTop(); return;
      case 'moveTopSelect': moveTopSelect(); return;
      case 'moveBottom': moveBottom(); return;
      case 'moveBottomSelect': moveBottomSelect(); return;
      case 'toggleSelection': toggleSelection(); return;
      case 'addNewTab': addNewTab(); return;
      case 'removeTab': removeTab(); return;
      case 'toPrevTab': toPrevTab(); return;
      case 'toNextTab': toNextTab(); return;
      case 'focusAddoressBar': focusAddoressBar(); return;
      case 'focusOppositePain': props.focusOppositePain(); return;
    }
  }

  const execCommand = (command: CommandInfo) => {
    if (command.action.type === COMMAND_TYPE.build_in) {
      execBuildInCommand(command.action.command);
      return
    }

    if (command.action.type === COMMAND_TYPE.power_shell) {
      execShellCommand(command, dir, selectingItemName(), props.getOppositePath(), props.separator);
      return
    }
  }
  const handlekeyboardnavigation = (event: Event) => {
    const keyboard_event = event as KeyboardEvent;
    if (keyboard_event.type !== 'keydown') { return false; }

    (async () => {
      const command_ary = await matchingKeyEvent(keyboard_event);
      if (command_ary.length === 1) {
        execCommand(command_ary[0])
        return;
      }

      if (command_ary.length >= 2) {
        menuItemAry.current = command_ary;
        setMenuOpen(true);
        return;
      }

      if (keyboard_event.key.length === 1) {
        incremantalSearch(keyboard_event.key)
        return;
      }
    })();

    return false;
  };

  const addressBar = React.createRef<HTMLInputElement>();

  type AdjustedAddressbarStr = {
    dir: string,
  };

  const accessParentDir = async () => {
    accessDirectry(addressbatStr + props.separator + '..')
  };

  const onEnterDown = async () => {
    accessDirectry(addressbatStr)
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

  const myGrid = props.gridRef ?? React.createRef<HTMLDivElement>();

  const [dialog, execShellCommand] = commandExecuter(
    () => { myGrid.current?.focus() },
  );

  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuItemAry = useRef<CommandInfo[]>([]);
  const commandSelectMenu = () => {
    return <ControlledMenu
      state={isMenuOpen ? 'open' : 'closed'}
      onClose={() => setMenuOpen(false)}
      anchorPoint={{ x: 400, y: 1000 }} // 適当…。
    >
      {
        menuItemAry.current.map(command => {
          return <MenuItem
            onClick={e => execCommand(command)}
          >
            {command.command_name}
          </MenuItem>
        })
      }
    </ControlledMenu>
  }

  const table_selection_attribute = (row_idx: number) => css({
    border: (row_idx === currentIndex) ? '3pt solid #880000' : '1pt solid #000000',
  });
  const table_border = css({
    border: '1pt solid #000000',
  });

  const table_resizable = css({
    resize: 'horizontal',
    overflow: 'hidden',
  });
  const fix_table_header = css({
    position: 'sticky',
    top: '0',
    left: '0',
  });
  const table_header_color = css({
    background: '#f2f2f2',
    border: '1pt solid #000000',
  });

  return (
    <>
      <div
        css={css({
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          overflow: 'auto',
          width: '100%',
          height: '100%',
        })}
      >
        <input
          type="text"
          value={addressbatStr}
          onChange={e => setAddressbatStr(e.target.value)}
          onKeyDown={onKeyDown}
          ref={addressBar}
        />
        <div
          css={css([{ display: 'grid', overflow: 'auto' }])}
          ref={myGrid}
        >
          <table
            css={
              {
                borderCollapse: 'collapse',
                resize: 'horizontal',
                height: 10, // table全体の最小サイズを指定。これが無いと、行数が少ない時に縦長になってしまう…。
                userSelect: 'none',
              }
            }
          >
            <thead css={[table_resizable, fix_table_header]}>
              <tr>
                <th css={[table_resizable, table_header_color]}>FIleName</th>
                <th css={[table_resizable, table_header_color]}>type</th>
                <th css={[table_resizable, table_header_color]}>size</th>
                <th css={[table_resizable, table_header_color]}>date</th>
              </tr>
            </thead>
            {
              entries.map((entry, idx) => {
                return <>
                  <tr
                    css={table_selection_attribute(idx)}
                  >
                    <td css={table_border}>{entry.name}</td>
                    <td css={table_border}>{entry.is_dir ? 'folder' : entry.extension.length === 0 ? '-' : entry.extension}</td>
                    <td css={table_border}>{entry.is_dir ? '-' : entry.size}</td>
                    <td css={table_border}>{entry.date}</td>
                  </tr>
                </>
              })
            }
          </table>
        </div>
      </div>
      {dialog}
      {commandSelectMenu()}
    </>
  );
}
