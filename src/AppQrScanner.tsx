import React from 'react';
import './App.css';
import QrScanner from './components/QrScanner'
//import TanStackTableFilter from './components/TanStackTableFilter'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <QrScanner />
      </header>
    </div>
  );
}

export default App;
