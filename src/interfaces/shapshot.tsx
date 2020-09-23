import { Viewer } from './../services/dxfService';
import { Object3D, OrthographicCamera, Scene, WebGLRenderer } from 'three';

export interface IObjectModel {
  createdAt: number;
  createdBy: string;
  title: string;
  _id: string;
  _key: string;
  _rev: string;
}

export interface ISnapshot extends IObjectModel {
  layers: string;
  objects: Array<IObject>;
  projects: Array<IProject>;
}

export interface IObject extends IObjectModel {
  parameters: string;
  projectKey: string;
  snapshotKey: string;
}

export interface IProject {
  createdAt: number;
  file: string;
  fileName: string;
  status: string;
  title: string;
  _key: string;
}

export interface IEditor {
  cadCanvas: Viewer;
  camera: OrthographicCamera;
  scene: Scene;
  renderer: WebGLRenderer;
  isEdit: boolean;
  activeEntities?: Array<Object3D>;
  copyEntities?: Array<Object3D>;
  options?: {
    threshold?: number;
    selectMode?: string;
    singleLayerSelect?: boolean;
  };
}
