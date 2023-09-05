import { WorkspaceInfo } from './WorkspaceInfo';

export interface ConfigFileInterface {
	workspaces: WorkspaceInfo[];
	invocationHotKey: string;
	forceOpenLinksInNotionApp: boolean;
}