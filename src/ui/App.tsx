import React, { useState, useEffect, useCallback } from 'react';
import { Button, Input, Select } from './components';
import type { UIToPluginMessage, PluginToUIMessage, SelectionInfo } from '../types/messages';
import styles from './App.module.css';

// Helper to send messages to the plugin
function postToPlugin(message: UIToPluginMessage) {
  parent.postMessage({ pluginMessage: message }, '*');
}

// Helper to convert hex to RGB (0-1 range)
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.4, g: 0.4, b: 0.9 };
}

const SHAPE_OPTIONS = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'ellipse', label: 'Ellipse' },
  { value: 'frame', label: 'Frame' },
];

const App: React.FC = () => {
  // Form state
  const [shapeType, setShapeType] = useState<'rectangle' | 'ellipse' | 'frame'>('rectangle');
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [color, setColor] = useState('#6366f1');
  const [count, setCount] = useState(3);
  const [spacing, setSpacing] = useState(20);

  // UI state
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCreated, setLastCreated] = useState<number | null>(null);

  // Listen for messages from plugin
  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ pluginMessage: PluginToUIMessage }>) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      switch (msg.type) {
        case 'SELECTION_CHANGED':
          setSelection(msg.payload);
          break;
        case 'SHAPES_CREATED':
          setIsLoading(false);
          setLastCreated(msg.payload.count);
          setTimeout(() => setLastCreated(null), 3000);
          break;
        case 'ERROR':
          setIsLoading(false);
          console.error(msg.payload.message);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial selection
    postToPlugin({ type: 'GET_SELECTION' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle form submission
  const handleCreate = useCallback(() => {
    setIsLoading(true);
    postToPlugin({
      type: 'CREATE_SHAPES',
      payload: {
        shapeType,
        width,
        height,
        color: hexToRgb(color),
        count,
        spacing,
      },
    });
  }, [shapeType, width, height, color, count, spacing]);

  const handleCancel = () => {
    postToPlugin({ type: 'CANCEL' });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Shape Generator</h1>
        {selection && (
          <p className={styles.selection}>
            {selection.count} item{selection.count !== 1 ? 's' : ''} selected
            {selection.types.length > 0 && ` (${selection.types.join(', ')})`}
          </p>
        )}
      </header>

      <main className={styles.main}>
        <Select
          label="Shape Type"
          id="shapeType"
          options={SHAPE_OPTIONS}
          value={shapeType}
          onChange={(e) => setShapeType(e.target.value as typeof shapeType)}
        />

        <div className={styles.row}>
          <Input
            label="Width"
            id="width"
            type="number"
            min={1}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
          <Input
            label="Height"
            id="height"
            type="number"
            min={1}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Count"
            id="count"
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
          <Input
            label="Spacing"
            id="spacing"
            type="number"
            min={0}
            value={spacing}
            onChange={(e) => setSpacing(Number(e.target.value))}
          />
        </div>

        <div className={styles.colorField}>
          <label htmlFor="color" className={styles.colorLabel}>
            Color
          </label>
          <div className={styles.colorInput}>
            <input
              type="color"
              id="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={styles.colorPicker}
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={styles.colorText}
            />
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        {lastCreated && (
          <p className={styles.success}>✓ Created {lastCreated} shape(s)</p>
        )}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Shapes'}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default App;