import MissingConfigTab from './MissingConfigTab';
import NoWorkspacesTab from './NoWorkspacesTab';
import MainCaptureItTab from './MainCaptureItTab';
import store from './store';
import { Provider } from 'react-redux';
import { useEffect } from 'react';

import './App.css';

interface ElectronBridge {
  receive: ( channel: string, func: ( ...args: any[] ) => void ) => void;
  invoke: ( channel: string, ...args: any[] ) => Promise<any>;
  send: ( channel: string, ...args: any[] ) => void;
  promisedInvoke: ( channel: string, ...args: any[] ) => Promise<any>;
}

const electronBridge: ElectronBridge = ( window as any ).electron;

function App() {
  useEffect( () => {
    console.log('test log');

    console.log('electron bridge:', electronBridge);

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
