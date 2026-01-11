import type { UIToPluginMessage, PluginToUIMessage, CreateShapesPayload } from '../types/messages';

// Show the UI
figma.showUI(__html__, {
  width: 320,
  height: 480,
  themeColors: true, // Adapts to Figma's light/dark theme
});

// Helper to send messages to UI
function sendToUI(message: PluginToUIMessage) {
  figma.ui.postMessage(message);
}

// Handle selection changes
figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;
  sendToUI({
    type: 'SELECTION_CHANGED',
    payload: {
      count: selection.length,
      types: [...new Set(selection.map((node) => node.type))],
    },
  });
});

// Create shapes based on payload
function createShapes(payload: CreateShapesPayload) {
  const { shapeType, width, height, color, count, spacing } = payload;
  const nodes: SceneNode[] = [];

  const startX = figma.viewport.center.x - ((count - 1) * (width + spacing)) / 2;
  const startY = figma.viewport.center.y;

  for (let i = 0; i < count; i++) {
    let shape: RectangleNode | EllipseNode | FrameNode;

    switch (shapeType) {
      case 'ellipse':
        shape = figma.createEllipse();
        break;
      case 'frame':
        shape = figma.createFrame();
        break;
      default:
        shape = figma.createRectangle();
    }

    shape.x = startX + i * (width + spacing);
    shape.y = startY;
    shape.resize(width, height);

    shape.fills = [
      {
        type: 'SOLID',
        color: { r: color.r, g: color.g, b: color.b },
      },
    ];

    figma.currentPage.appendChild(shape);
    nodes.push(shape);
  }

  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);

  return nodes.length;
}

// Listen for messages from UI
figma.ui.onmessage = (msg: UIToPluginMessage) => {
  try {
    switch (msg.type) {
      case 'CREATE_SHAPES': {
        const count = createShapes(msg.payload);
        sendToUI({ type: 'SHAPES_CREATED', payload: { count } });
        figma.notify(`Created ${count} shape(s)! ✨`);
        break;
      }

      case 'GET_SELECTION': {
        const selection = figma.currentPage.selection;
        sendToUI({
          type: 'SELECTION_CHANGED',
          payload: {
            count: selection.length,
            types: [...new Set(selection.map((node) => node.type))],
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
      payload: { message: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
};