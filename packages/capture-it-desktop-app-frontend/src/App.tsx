import MissingConfigTab from './MissingConfigTab';
import NoWorkspacesTab from './NoWorkspacesTab';
import MainCaptureItTab from './MainCaptureItTab';
import store from './store';
import { Provider } from 'react-redux';
import { useEffect } from 'react';

import addDevelopmentStub from './electronBridgeDevStub';

import './App.css';

import type { WorkspaceInfo, ConfigFileInterface } from '@mlewand/capture-it-core';

interface ElectronBridge {
  receive: ( channel: string, func: ( ...args: any[] ) => void ) => void;
  invoke: ( channel: string, ...args: any[] ) => Promise<any>;
  send: ( channel: string, ...args: any[] ) => void;
  promisedInvoke: ( channel: string, ...args: any[] ) => Promise<any>;
}

function App() {
  useEffect( () => {
    if ( !( window as any ).electron ) {
      console.log( 'missing electron bridge - adding a dev stub' );
      addDevelopmentStub();
      console.log( ( window as any ).electron );
    }
  }, [] );

  useEffect( () => {
    const electronBridge: ElectronBridge = ( window as any ).electron;

    console.log( 'test log, electron bridge:', electronBridge );

    if ( electronBridge ) {
      const handleConfigChange = ( newConfig: ConfigFileInterface | null | undefined ) => {
        console.log( 'configChanged', newConfig );
        // config = newConfig;
      }

      electronBridge.receive( 'configChanged', handleConfigChange );
    }

    return () => { };
  }, [] );

  return (
    <Provider store={store}>
      <MainCaptureItTab />
      <MissingConfigTab />
      <NoWorkspacesTab />
    </Provider>
  );
}

export default App;
