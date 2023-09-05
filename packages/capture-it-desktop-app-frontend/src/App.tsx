import MissingConfigTab from './MissingConfigTab';
import NoWorkspacesTab from './NoWorkspacesTab';
import MainCaptureItTab from './MainCaptureItTab';
import './App.css';

function App() {
  return (
    <>
      <MainCaptureItTab />
      <MissingConfigTab />
      <NoWorkspacesTab />
    </>
  );
}

export default App;
