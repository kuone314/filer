import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
import React from 'react';

import JqxGrid, { IGridProps, jqx } from 'jqwidgets-scripts/jqwidgets-react-tsx/jqxgrid';



class App extends React.PureComponent<{}, IGridProps> {
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

export default App;
