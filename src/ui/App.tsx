import React, { useState, useEffect } from 'react';
import { IconPicker } from './components/IconPicker';
import { Button } from './components/Button';
import { Input } from './components/Input';
import type { UIToPluginMessage, PluginToUIMessage } from '../types/messages';
import styles from './App.module.css';

function postToPlugin(message: UIToPluginMessage) {
  parent.postMessage({ pluginMessage: message }, '*');
}

const App: React.FC = () => {
  const [size, setSize] = useState(24);
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lastInserted, setLastInserted] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ pluginMessage: PluginToUIMessage }>) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      if (msg.type === 'ICON_INSERTED') {
        setLastInserted(msg.payload.name);
        setTimeout(() => setLastInserted(null), 2000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleInsertIcon = (svg: string, name: string) => {
    postToPlugin({
      type: 'INSERT_ICON',
      payload: {
        svg,
        name,
        size,
        color: useCustomColor ? color : null,
      },
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Icon Picker</h1>
        <p className={styles.subtitle}>
          Search and insert icons into your design
        </p>
      </header>

      <div className={styles.settings}>
        <div className={styles.sizeControl}>
          <label htmlFor="size">Size</label>
          <input
            type="range"
            id="size"
            min="16"
            max="128"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
          <span className={styles.sizeValue}>{size}px</span>
        </div>

        <div className={styles.colorControl}>
          <label>
            <input
              type="checkbox"
              checked={useCustomColor}
              onChange={(e) => setUseCustomColor(e.target.checked)}
            />
            Custom color
          </label>
          {useCustomColor && (
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={styles.colorPicker}
            />
          )}
        </div>
      </div>

      {lastInserted && (
        <div className={styles.toast}>✓ Inserted {lastInserted}</div>
      )}

      <div className={styles.pickerWrapper}>
        <IconPicker
          onInsertIcon={handleInsertIcon}
          size={size}
          color={useCustomColor ? color : null}
        />
      </div>

      <footer className={styles.footer}>
        <Button variant="secondary" onClick={() => postToPlugin({ type: 'CANCEL' })}>
          Close
        </Button>
      </footer>
    </div>
  );
};

export default App;