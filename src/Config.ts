import { join } from 'path';
import { homedir } from 'os';
import { promises as fs } from 'fs';

import { EventEmitter } from 'events';

export interface WorkspaceInfo {
	name?: string;
	pageId: string;
	dataBaseId: string;
	notionToken: string;
	tags?: { [key: string]: string };
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

	// @todo: config file could emit events when changed
	constructor( options: ConfigFileInterface ) {
		super();
		this.workspaces = options.workspaces;
		this.invocationHotKey = options.invocationHotKey;
		this.forceOpenLinksInNotionApp = options.forceOpenLinksInNotionApp;
		this.tags = options.tags;
	}

	public static async loadFromUserDirectory(): Promise<Config> {
		const configPath = this.getUserConfigPath();
		const stat = await fs.stat( configPath );

		if ( !stat.isFile() ) {
			throw new Error( 'Configuration file not found in ' + configPath );
		}

		const parsedData = JSON.parse( await fs.readFile(  configPath, 'utf-8' ) );

		if ( !parsedData.workspaces ) {
			throw new Error( 'Configuration file is missing workspaces' );
		}

		return new Config( parsedData );
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

	private _saveFile(): Promise<boolean> {
		return fs.writeFile( Config.getUserConfigPath(), JSON.stringify( this, null, '\t' ), { encoding: 'utf8' } )
			.then( () => true )
	}
}
