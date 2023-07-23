interface Target {
	name: string;
	tags?: {
		[ key: string ]: string;
	};
}

interface NotionTarget extends Target {
	pageId?: string;
	dataBaseId?: string;
	notionToken: string;
}

export default Target;

export { NotionTarget };
