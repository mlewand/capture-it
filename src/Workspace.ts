export default class Workspace {
	public name: string;
	public pageId: string;
	public dataBaseId: string;
	public notionToken: string;
	public tagFieldName?: string;

	public constructor( options: { name: string, pageId: string, dataBaseId: string, notionToken: string, tagFieldName?: string } ) {
		this.name = options.name;
		this.pageId = options.pageId;
		this.dataBaseId = options.dataBaseId;
		this.notionToken = options.notionToken;
		this.tagFieldName = options.tagFieldName;
	}
}