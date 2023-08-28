export interface WorkspaceInfo {
	name?: string;
	pageId: string;
	dataBaseId: string;
	notionToken: string;
	tagFieldName?: string;
	tags?: { [key: string]: string };
	default?: {
		tags?: string[];
	};
}
