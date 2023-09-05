import MissingConfigTab from './MissingConfigTab';
import NoWorkspacesTab from './NoWorkspacesTab';
import MainCaptureItTab from './MainCaptureItTab';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { setConfig } from './config/configSlice';
import { setActiveWorkspaceIndex } from './workspaces/workspacesSlice';
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

  useEffect( () => {
    const handleKeyUp = ( e: KeyboardEvent ) => {
      const isOsX = navigator.userAgent.includes( 'OS X' );
      const electronBridge: ElectronBridge = ( window as any ).electron;
      const noModifierKeysPressed = !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey;
      let commandToCall = null;
      let extraArgs: any[] = [];

      if ( e.key === 'Escape' && noModifierKeysPressed ) {
        // Esc key should hide the window.
        commandToCall = 'hide';
      } else if ( e.key === 'q' && e.ctrlKey && !isOsX ) {
        // Ctrl + Q should quit the app.
        // For macOS there's a separate handling, see https://github.com/mlewand/capture-it/issues/31.
        commandToCall = 'quit';
      } else if ( e.key === 'Tab' && e.ctrlKey ) {
        commandToCall = 'setWorkspace';

        extraArgs.push( e.shiftKey ? 'previous' : 'next' );
      } else if ( ( e.code.startsWith( 'Digit' ) && e.code !== 'Digit0' ) && e.shiftKey && e.altKey ) {
        // alt + shift + 1 - 9 handing to change the workspace.
        commandToCall = 'setWorkspace';
        extraArgs = [ parseInt( e.code.substr( 5 ) ) - 1 ];
      }

      if ( commandToCall ) {
        electronBridge.invoke( 'executeCommand', commandToCall, ...extraArgs );
        e.preventDefault();
      }
    }

    document.addEventListener( 'keyup', handleKeyUp );

    // Cleanup listener on component unmount.
    return () => {
      document.removeEventListener( 'keyup', handleKeyUp );
    }
  }, [] );

  return (
    <>
      <MainCaptureItTab />
      <MissingConfigTab />
      <NoWorkspacesTab />
    </>
  );
}

export default App;
