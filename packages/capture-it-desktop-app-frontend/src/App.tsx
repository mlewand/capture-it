import React from 'react';
import ProTipCarousel from './ProTipCarousel';
import QuickInput from './QuickInput';
import MissingConfigTab from './MissingConfigTab';
import NoWorkspacesTab from './NoWorkspacesTab';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <>
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>

      {/* <div id="workspaces-bar">
        <div id="tabs"></div>
        <a href="#" id="add-workspace" title="Add workspace">➕</a>
      </div> */}

      <QuickInput />

      <ProTipCarousel />

      {/* to extract */}
      <section id="notification-area-container"></section>

      <section id="reports-container">
        Seeing a bug or thinking about new feature? Report an issue <a href="https://github.com/mlewand/capture-it/issues"
          target="_blank" rel="noopener noreferrer">on GitHub</a>.
      </section>

    </div>

    <MissingConfigTab />
    <NoWorkspacesTab />
    </>
  );
}

export default App;
