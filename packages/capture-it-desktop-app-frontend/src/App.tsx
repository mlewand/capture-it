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
    electronBridge.receive( 'globalHotkeyFocus', () => {
      ensureReasonableFocus();
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

/* @todo: change it into something more react way */
function ensureReasonableFocus(): void {
	if ( document.activeElement === document.body ) {
		// This has to be set only if there's no good focus.
		const selectors = [ '#textInput', '#config-missing-tab .create-missing-config-button', '#no-workspaces-tab .add-workspace' ];
		const focusCandidates = document.querySelectorAll( selectors.join( ', ' ) ) as NodeListOf<HTMLElement>;

		for (const focusCandidate of focusCandidates) {
			if ( focusCandidate.offsetParent ) {
				focusCandidate.focus();
				break;
			}
		}
	}
}

export default App;
