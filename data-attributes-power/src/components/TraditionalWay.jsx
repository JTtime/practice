import React, { useState, useCallback, memo } from 'react';

const Item = memo(({ name, onClick }) => {
  console.log(`Rendering ${name}`);
  return <button onClick={onClick}>{name}</button>;
});

function TraditionalWay() {
  const [count, setCount] = useState(0);
  const items = [
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Banana' },
    { id: 3, name: 'Cherry' },
  ];

  const handleClick = useCallback((id) => {
    console.log('Clicked', id);
  }, []);

  return (
    <div>
      <h2>Inline arrow functions</h2>
      {items.map(item => (
        <Item
          key={item.id}
          name={item.name}
          onClick={() => handleClick(item.id)}  // New function each render
        />
      ))}
      <button onClick={() => setCount(c => c + 1)}>Re-render: {count}</button>
    </div>
  );
}
//though handleClick is wrapped by useCallback, and whole functional component is wrapped by React.memo, still on click of setCount, handleClick will be called

export default TraditionalWay;
