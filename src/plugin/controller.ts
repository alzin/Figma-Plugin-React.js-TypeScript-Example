import type { UIToPluginMessage, PluginToUIMessage, InsertIconPayload } from '../types/messages';

figma.showUI(__html__, {
  width: 400,
  height: 520,
  themeColors: true,
});

function sendToUI(message: PluginToUIMessage) {
  figma.ui.postMessage(message);
}

/**
 * Insert an SVG icon into the canvas
 */
function insertIcon(payload: InsertIconPayload): FrameNode | null {
  const { svg, name, size, color } = payload;

  try {
    // Create node from SVG string
    const node = figma.createNodeFromSvg(svg);

    // Rename the frame to the icon name
    node.name = name;

    // Position at viewport center
    node.x = figma.viewport.center.x - size / 2;
    node.y = figma.viewport.center.y - size / 2;

    // Resize to desired size
    node.resize(size, size);

    // If a specific color is requested, apply it to all vector children
    if (color) {
      const rgbColor = hexToFigmaRgb(color);
      applyColorToVectors(node, rgbColor);
    }

    // Add to page
    figma.currentPage.appendChild(node);

    return node;
  } catch (error) {
    console.error('Failed to create icon:', error);
    return null;
  }
}

/**
 * Convert hex color to Figma RGB (0-1 range)
 */
function hexToFigmaRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

/**
 * Recursively apply a color to all vector nodes
 */
function applyColorToVectors(node: SceneNode, color: RGB) {
  if ('fills' in node && node.fills !== figma.mixed) {
    const newFills = (node.fills as Paint[]).map((fill) => {
      if (fill.type === 'SOLID') {
        return { ...fill, color };
      }
      return fill;
    });
    node.fills = newFills;
  }

  if ('strokes' in node && node.strokes) {
    const newStrokes = (node.strokes as Paint[]).map((stroke) => {
      if (stroke.type === 'SOLID') {
        return { ...stroke, color };
      }
      return stroke;
    });
    node.strokes = newStrokes;
  }

  if ('children' in node) {
    for (const child of node.children) {
      applyColorToVectors(child, color);
    }
  }
}

// Selection change handler
figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;
  sendToUI({
    type: 'SELECTION_CHANGED',
    payload: {
      count: selection.length,
      types: [...new Set(selection.map((n) => n.type))],
    },
  });
});

// Message handler
figma.ui.onmessage = async (msg: UIToPluginMessage) => {
  try {
    switch (msg.type) {
      case 'INSERT_ICON': {
        const node = insertIcon(msg.payload);
        if (node) {
          figma.currentPage.selection = [node];
          figma.viewport.scrollAndZoomIntoView([node]);
          sendToUI({ type: 'ICON_INSERTED', payload: { name: msg.payload.name } });
          figma.notify(`Inserted ${msg.payload.name} ✨`);
        } else {
          throw new Error('Failed to insert icon');
        }
        break;
      }

      case 'INSERT_ICONS_BATCH': {
        const nodes: FrameNode[] = [];
        let xOffset = 0;

        for (const iconPayload of msg.payload) {
          const node = insertIcon({
            ...iconPayload,
          });

          if (node) {
            node.x = figma.viewport.center.x + xOffset;
            xOffset += iconPayload.size + 16;
            nodes.push(node);
          }
        }

        if (nodes.length > 0) {
          figma.currentPage.selection = nodes;
          figma.viewport.scrollAndZoomIntoView(nodes);
          figma.notify(`Inserted ${nodes.length} icons ✨`);
        }
        break;
      }

      case 'GET_SELECTION': {
        const selection = figma.currentPage.selection;
        sendToUI({
          type: 'SELECTION_CHANGED',
          payload: {
            count: selection.length,
            types: [...new Set(selection.map((n) => n.type))],
          },
        });
        break;
      }

      case 'CANCEL': {
        figma.closePlugin();
        break;
      }
    }
  } catch (error) {
    sendToUI({
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};