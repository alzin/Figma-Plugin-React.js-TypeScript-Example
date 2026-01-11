
export interface InsertIconPayload {
  svg: string;
  name: string;
  size: number;
  color: string | null;  // null = keep original colors
}


// Messages from UI to Plugin
export type UIToPluginMessage =
  | { type: 'INSERT_ICON'; payload: InsertIconPayload }
  | { type: 'INSERT_ICONS_BATCH'; payload: InsertIconPayload[] }
  | { type: 'CREATE_SHAPES'; payload: CreateShapesPayload }
  | { type: 'GET_SELECTION' }
  | { type: 'CANCEL' };

export interface CreateShapesPayload {
  shapeType: 'rectangle' | 'ellipse' | 'frame';
  width: number;
  height: number;
  color: RGB;
  count: number;
  spacing: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// Messages from Plugin to UI
export type PluginToUIMessage =
  | { type: 'ICON_INSERTED'; payload: { name: string } }
  | { type: 'SELECTION_CHANGED'; payload: SelectionInfo }
  | { type: 'SHAPES_CREATED'; payload: { count: number } }
  | { type: 'ERROR'; payload: { message: string } };

export interface SelectionInfo {
  count: number;
  types: string[];
}