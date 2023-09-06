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

    getElectronBridge().receive( 'configChanged', handleConfigChange );

    return () => { };
  } );

  useEffect( () => {
    getElectronBridge().receive( 'activeWorkspaceIndexChanged', ( index: number | undefined ) => {
      dispatch( setActiveWorkspaceIndex( index ) );
    } );

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
