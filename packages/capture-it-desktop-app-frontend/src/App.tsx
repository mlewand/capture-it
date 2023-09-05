import MissingConfigTab from './MissingConfigTab';
import NoWorkspacesTab from './NoWorkspacesTab';
import MainCaptureItTab from './MainCaptureItTab';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { setConfig } from './config/configSlice';
import addDevelopmentStub from './electronBridgeDevStub';

import type { ConfigFileInterface } from '@mlewand/capture-it-core';

import './App.css';

interface ElectronBridge {
  receive: ( channel: string, func: ( ...args: any[] ) => void ) => void;
  invoke: ( channel: string, ...args: any[] ) => Promise<any>;
  send: ( channel: string, ...args: any[] ) => void;
  promisedInvoke: ( channel: string, ...args: any[] ) => Promise<any>;
}

function App() {
  const dispatch = useDispatch();

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
        dispatch( setConfig( newConfig ) );
      }

      electronBridge.receive( 'configChanged', handleConfigChange );
    }

    return () => { };
  } );

  return (
    <>
      <MainCaptureItTab />
      <MissingConfigTab />
      <NoWorkspacesTab />
    </>
  );
}

export default App;
