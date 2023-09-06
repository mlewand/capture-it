
import { getElectronBridge } from './appHelpers';
import './MissingConfigTab.css';

export default function MissingConfigTab() {
	function onClickCreateMissingConfigButton( event: React.MouseEvent ) {
		getElectronBridge().invoke( 'executeCommand', 'openConfig' );
		event.preventDefault();
	}

	return (
		<section id="config-missing-tab">
			<h1>Missing config</h1>

			<p>The config should be saved as <code>.capture-it-config.json</code> file in user home directory.</p>

			<p>
				<button className="create-missing-config-button" onClick={onClickCreateMissingConfigButton}>Click here to create the config</button>
			</p>

			<p>Then please, reset the app using ctrl/cmd+q or Quit option in system tray icon.</p>
		</section>
	);
}
