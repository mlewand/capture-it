
import './MissingConfigTab.css';

export default function MissingConfigTab() {
	return (
		<section id="config-missing-tab">
			<h1>Missing config</h1>

			<p>The config should be saved as <code>.capture-it-config.json</code> file in user home directory.</p>

			<p>
				<button className="create-missing-config-button">Click here to create the config</button>
			</p>

			<p>Then please, reset the app using ctrl/cmd+q or Quit option in system tray icon.</p>
		</section>
	);
}
