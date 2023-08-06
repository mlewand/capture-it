import { join } from 'path';
import { homedir } from 'os';
import { promises as fs, watch as watchFs } from 'fs';
import { debounce } from 'lodash';
import { parse as JSONParse } from 'comment-json';

import { EventEmitter } from 'events';

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

export interface ConfigFileInterface {
	workspaces: WorkspaceInfo[];
	invocationHotKey: string;
	forceOpenLinksInNotionApp: boolean;
	tags?: { [key: string]: string };
}


export default class Config extends EventEmitter implements ConfigFileInterface {
	workspaces: WorkspaceInfo[];
	invocationHotKey: string;
	forceOpenLinksInNotionApp: boolean;
	tags?: { [key: string]: string };

		constructor( options: ConfigFileInterface ) {
			super();

			// Can't use  this._fillFromObject(), TS isn't smart enough.
			// this._fillFromObject( options );
			this.workspaces = options.workspaces;
			this.invocationHotKey = options.invocationHotKey;
			this.forceOpenLinksInNotionApp = options.forceOpenLinksInNotionApp;
			this.tags = options.tags;
		}

	public static async loadFromUserDirectory(): Promise<Config> {
		const filePath = Config.getUserConfigPath();
		const ret = new Config( await Config._readFromFile( filePath ) );

		const debouncedListener = debounce( async () => {
			console.log('DETECTED CONFIG CHANGE');
			ret._fillFromObject( await Config._readFromFile( filePath ) );
			ret.emit( 'changed' );
		}, 700 );

		watchFs( filePath, { encoding: 'utf8' }, debouncedListener );

		return ret;
	}

	public static getUserConfigPath(): string {
		return join( homedir(), '.capture-it-config.json' );
	}

	public addWorkspace( workspace: WorkspaceInfo ): void {
		this.workspaces.push( workspace );

		this.emit( 'changed' );

		// Update the file.
		this._saveFile();
	}

	private static async _readFromFile( configPath : string ) {
		const stat = await fs.stat( configPath );

		if ( !stat.isFile() ) {
			throw new Error( 'Configuration file not found in ' + configPath );
		}

		const parsedData = JSONParse( await fs.readFile(  configPath, 'utf-8' ) ) as any;

		if ( !parsedData.workspaces ) {
			throw new Error( 'Configuration file is missing workspaces' );
		}

		return parsedData;
	}

	private async _fillFromObject( parsedData: ConfigFileInterface ) {
		this.workspaces = parsedData.workspaces;
		this.invocationHotKey = parsedData.invocationHotKey;
		this.forceOpenLinksInNotionApp = parsedData.forceOpenLinksInNotionApp;
		this.tags = parsedData.tags;
	}

	private _saveFile(): Promise<boolean> {
		return fs.writeFile( Config.getUserConfigPath(), JSON.stringify( this, null, '\t' ), { encoding: 'utf8' } )
			.then( () => true )
	}
}
