import MissingConfigTab from './MissingConfigTab';
import NoWorkspacesTab from './NoWorkspacesTab';
import MainCaptureItTab from './MainCaptureItTab';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { setConfig, selectConfig } from './config/configSlice';
import { setActiveWorkspaceIndex, selectWorkspaces } from './workspaces/workspacesSlice';
import { globalHotkeysHandler, getElectronBridge } from './appHelpers';

import type { ConfigFileInterface } from '@mlewand/capture-it-core';

import './App.css';

function App() {
  const dispatch = useDispatch();
  const config = useSelector( selectConfig );
  const workspaces = useSelector( selectWorkspaces );

  useEffect( () => {
    const handleConfigChange = ( newConfig: ConfigFileInterface | null | undefined ) => {
      console.log( 'configChanged', newConfig );
      dispatch( setConfig( newConfig ) );
    }

    const electronBridge = getElectronBridge();

    electronBridge.receive( 'configChanged', handleConfigChange );
    electronBridge.receive( 'activeWorkspaceIndexChanged', ( index: number | undefined ) => {
      dispatch( setActiveWorkspaceIndex( index ) );
    } );
    electronBridge.receive( 'alert', ( message: string ) => {
      alert( message );
    } );

    return () => { };
  } );

  useEffect( globalHotkeysHandler );

  return (
    <>
      {!config && <MissingConfigTab />}
      {config && !workspaces.length && <NoWorkspacesTab />}
      {config && workspaces.length > 0 && <MainCaptureItTab />}
    </>
  );
}

export default App;
