import React, { useState } from 'react';
import TraditionalWay from './components/TraditionalWay';
import DataAttribute from './components/DataAttribute';
// import './styles.css';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <h2>React Event Handler Optimization</h2>

      <div className="examples-container">
        <TraditionalWay />
        <DataAttribute />
      </div>

      <button onClick={() => setCount(c => c + 1)}>
        🔄 Re-render App ({count})
      </button>
    </div>
  );
}
