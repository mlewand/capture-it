
import { WorkspaceInfo } from './WorkspaceInfo';

export { WorkspaceInfo };
export interface ConfigFileInterface {
	workspaces: WorkspaceInfo[];
	invocationHotKey: string;
	forceOpenLinksInNotionApp: boolean;
  }
