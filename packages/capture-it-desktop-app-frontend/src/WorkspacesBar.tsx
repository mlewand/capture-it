
import './WorkspacesBar.css';
import { selectWorkspaces, addWorkspace, selectActiveWorkspaceIndex, setActiveWorkspaceIndex } from './workspaces/workspacesSlice';
import { useAppDispatch } from './hooks';
import { useSelector } from 'react-redux';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { IconButton } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/AddCircle';
import { getElectronBridge } from './appHelpers';

export default function WorkspacesBar() {
	const dispatch = useAppDispatch();
	const workspaces = useSelector( selectWorkspaces );
	const activeWorkspaceIndex = useSelector( selectActiveWorkspaceIndex );

	function workspaceClickHandler() {
		getElectronBridge().invoke( 'executeCommand', 'addNotionWorkspace' );
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
			<Tooltip title="Add a new workspace">
				<IconButton aria-label="Add a new workspace" color="primary" onClick={workspaceClickHandler}>
					<AddIcon />
				</IconButton>
			</Tooltip>
		</section>
	);
}
