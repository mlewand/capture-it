
import './WorkspacesBar.css';
import { selectWorkspaces, addWorkspace, selectActiveWorkspaceIndex, setActiveWorkspaceIndex } from './workspaces/workspacesSlice';
import { useAppDispatch } from './hooks';
import { useSelector } from 'react-redux';
import { WorkspaceInfo } from '@mlewand/capture-it-core';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

export default function WorkspacesBar() {
	const dispatch = useAppDispatch();
	const workspaces = useSelector( selectWorkspaces );
	const activeWorkspaceIndex = useSelector( selectActiveWorkspaceIndex );

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

	const handleIndexTabChange = ( event: React.SyntheticEvent, newValue: number ) => {
		dispatch( setActiveWorkspaceIndex( newValue ) );
	};

	return (
		<section id="workspaces-bar">
			{activeWorkspaceIndex !== undefined && workspaces.length > 1 &&
				<Tabs value={activeWorkspaceIndex} onChange={handleIndexTabChange} aria-label="simple tabs example">
					{workspaces.map( ( workspace: any, index: number ) => {
						return ( <Tab key={index} label={workspace.name} /> );
					} )}
				</Tabs>
			}
			<a href="#" id="add-workspace" title="Add workspace" onClick={workspaceClickHandler}>➕</a>
		</section>
	);
}
