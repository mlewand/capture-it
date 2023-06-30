import { join } from 'path';
import { homedir } from 'os';
import { promises as fs } from 'fs';
import { ipcMain } from 'electron';

export interface ConfigFileInterface {
	pageId: string;
	dataBaseId: string;
	notionToken: string;
	invocationHotKey: string;
	forceOpenLinksInNotionApp: boolean;
}


export default class Config {
	// @todo: config file could emit events when changed
	pageId: string;
	dataBaseId: string;
	notionToken: string;
	invocationHotKey: string;
	forceOpenLinksInNotionApp: boolean;

	constructor( options: ConfigFileInterface ) {
		this.pageId = options.pageId;
		this.dataBaseId = options.dataBaseId;
		this.notionToken = options.notionToken;
		this.invocationHotKey = options.invocationHotKey;
		this.forceOpenLinksInNotionApp = options.forceOpenLinksInNotionApp;
	}

	public emitConfigChanged() {
		ipcMain.emit( 'configChanged', this );
	}

	public static async loadFromUserDirectory(): Promise<Config> {
		const configPath = this.getUserConfigPath();
		const stat = await fs.stat( configPath );

		if ( !stat.isFile() ) {
			throw new Error( 'Configuration file not found in ' + configPath );
		}

		const parsedData = JSON.parse( await fs.readFile(  configPath, 'utf-8' ) );
		return new Config( parsedData );
	}

	public static getUserConfigPath(): string {
		return join( homedir(), '.note-quick-add-config.json' );
	}
}
