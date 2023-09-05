
import './WorkspacesBar.css';
import { selectWorkspaces, addWorkspace, selectActiveWorkspace } from './workspaces/workspacesSlice';
import { useAppDispatch } from './hooks';
import { useSelector } from 'react-redux';

import { WorkspaceInfo } from '@mlewand/capture-it-core';

export default function WorkspacesBar() {
	const dispatch = useAppDispatch();
	const workspaces = useSelector( selectWorkspaces );
	const activeWorkspace = useSelector( selectActiveWorkspace );

	function workspaceClickHandler() {
		const newWorkspace: WorkspaceInfo = {
			name: 'Name ' + Math.random() * 1000,
			pageId: 'page id',
			dataBaseId: 'db id',
			notionToken: 'notion token',
			tags: {
				'@test': 'testtt'
			}
		};

		dispatch( addWorkspace( newWorkspace ) );
	}

	return (
		<section id="workspaces-bar">
			<div id="tabs">
				<span>Workspaces: {workspaces.length}</span>
				{workspaces.map( ( workspace: any ) => {
					return ( <span>
						{workspace === activeWorkspace &&
							<span className="active">➤</span>
						}
						tab {workspace.name}
					</span> );
				} )}
			</div>
			<a href="#" id="add-workspace" title="Add workspace" onClick={workspaceClickHandler}>➕</a>
		</section>
	);
}
