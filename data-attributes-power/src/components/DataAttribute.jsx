import React, { useState, useCallback, memo } from 'react';

const Item = memo(({ name, onClick }) => {
  console.log(`Rendering ${name}`);
  return <button data-id={name} onClick={onClick}>{name}</button>;
});

function DataAttribute() {
  const [count, setCount] = useState(0);
  const items = [
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Banana' },
    { id: 3, name: 'Cherry' },
  ];

  const handleClick = useCallback((e) => {
    const id = e.currentTarget.dataset.id;
    console.log('Clicked', id);
  }, []);

  return (
    <div>
      <h2>Shared handler + data-id</h2>
      {items.map(item => (
        <Item
          key={item.id}
          name={item.name}
          onClick={handleClick}  // Same function passed to all
        />
      ))}
      <button onClick={() => setCount(c => c + 1)}>Re-render: {count}</button>
    </div>
  );
}

export default DataAttribute;
