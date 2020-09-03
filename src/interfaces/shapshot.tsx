export interface IObjectModel {
  createdAt: number;
  createdBy: string;
  title: string;
  _key: string;
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
