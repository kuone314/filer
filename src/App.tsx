import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
import React from 'react';

import JqxGrid, { IGridProps } from 'jqwidgets-scripts/jqwidgets-react-tsx/jqxgrid';


class GridTrial extends React.PureComponent<{}, IGridProps> {
  private myGrid = React.createRef<JqxGrid>();

  constructor(props: {}) {
    super(props);

    const source = {
      localdata: [
        ['Maria Anders', 'Sales Representative', 'Berlin', 'Germany'],
        ['Ana Trujillo', 'Owner', 'Mxico D.F.', 'Mexico'],
        ['Antonio Moreno', 'Owner', 'Mxico D.F.', 'Mexico']
      ],
      datafields: [
        { name: 'ContactName', type: 'string', map: '0' },
        { name: 'Title', type: 'string', map: '1' },
        { name: 'City', type: 'string', map: '2' },
        { name: 'Country', type: 'string', map: '3' }
      ],
      datatype: 'array'
    };

    this.state = {
      source: new jqx.dataAdapter(source),
      columns: [
        { text: 'Contact Name', datafield: 'ContactName' },
        { text: 'Contact Title', datafield: 'Title' },
        { text: 'City', datafield: 'City' },
        { text: 'Country', datafield: 'Country' }
      ]
    }
  }

  public render() {
    return (
      <JqxGrid ref={this.myGrid}
        width={850} source={this.state.source} columns={this.state.columns} autoheight={true}
      />
    );
  }
}


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

  const source = {
    localdata: [
      ['Maria Anders', 'Sales Representative', 'Berlin', 'Germany'],
      ['Ana Trujillo', 'Owner', 'Mxico D.F.', 'Mexico'],
      ['Antonio Moreno', 'Owner', 'Mxico D.F.', 'Mexico']
    ],
    datafields: [
      { name: 'ContactName', type: 'string', map: '0' },
      { name: 'Title', type: 'string', map: '1' },
      { name: 'City', type: 'string', map: '2' },
      { name: 'Country', type: 'string', map: '3' }
    ],
    datatype: 'array'
  };

  return (
    <>
      <br />
      <input type="text" value={dir} onChange={e => setDir(e.target.value)} />
      <br />
      <JqxGrid
        width={'100%'}
        height={'100%'}
        columnsresize={true}
        source={[
          ['Maria Anders', 'Sales Representative', 'Berlin', 'Germany'],
          ['Ana Trujillo', 'Owner', 'Mxico D.F.', 'Mexico'],
          ['Antonio Moreno', 'Owner', 'Mxico D.F.', 'Mexico']
        ]}
        columns={[
          { text: 'Company Name', datafield: 'CompanyName', width: '20%' },
          { text: 'Contact Name', datafield: 'ContactName', width: '20%' },
          { text: 'Contact Title', datafield: 'ContactTitle', width: '20%' },
          { text: 'City', datafield: 'City', width: '20%' },
          { text: 'Country', datafield: 'Country' }
        ]}
      />
    </>
  );
}


export default App;
