
export * from './capture';

export function unifyNotionPageId( id : string ) {
	// Notion page ID may but doesn't have to include dashes.
	return id.replace( /-/g, '' ).toLowerCase();
}