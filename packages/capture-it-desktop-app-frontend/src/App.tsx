import MissingConfigTab from './MissingConfigTab';
import NoWorkspacesTab from './NoWorkspacesTab';
import MainCaptureItTab from './MainCaptureItTab';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { setConfig, selectConfig } from './config/configSlice';
import { setActiveWorkspaceIndex, selectWorkspaces } from './workspaces/workspacesSlice';
import { globalHotkeysHandler, addElectronBridgeStub, ElectronBridge } from './appHelpers';

import type { ConfigFileInterface } from '@mlewand/capture-it-core';

import './App.css';

function App() {
  const dispatch = useDispatch();
  const config = useSelector( selectConfig );
  const workspaces = useSelector( selectWorkspaces );

  useEffect( addElectronBridgeStub );

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

  useEffect( () => {
    const electronBridge: ElectronBridge = ( window as any ).electron;

    if ( electronBridge ) {
      electronBridge.receive( 'activeWorkspaceIndexChanged', ( index: number | undefined ) => {
        console.log( 'activeWorkspaceIndexChanged', index );
        dispatch( setActiveWorkspaceIndex( index ) );
      } );
    }

    return () => { };
  } );

  useEffect( globalHotkeysHandler );

  return (
    <>
      {!config && <MissingConfigTab />}
      {config && !workspaces.length && <NoWorkspacesTab />}
      {config && workspaces.length && <MainCaptureItTab />}
    </>
  );
}

export default App;
