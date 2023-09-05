import './NoWorkspacesTab.css';

export default function NoWorkspacesTab() {
	return (
		<section id="no-workspaces-tab">
			<h1>Let's add the first workspace 👶</h1>

			<p>Congratulations, you have your config! What you need to start working is a Notion database or page to add entries to.</p>

			<section className="add-workspace-container">
				Use a button below to grant Capture It permission to database(s) of your choice: <a href="#" className="add-workspace" title="Add new Notion workspace">➕ Add a new workspace</a>
			</section>

			<p>Alternatively if you're a super pro you can always add them manually to <a href="#" className="create-missing-config-button">config file</a>.</p>
		</section>
	);
}