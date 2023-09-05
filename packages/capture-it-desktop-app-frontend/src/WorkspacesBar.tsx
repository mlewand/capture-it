
import './WorkspacesBar.css';
import { increment, decrement } from './workspaces/workspacesSlice';
import { useSelector, useDispatch } from 'react-redux';

export default function WorkspacesBar() {
	const dispatch = useDispatch();
	const workspaces = useSelector( ( state: any ) => state.workspaces.value );

	return (
		<section id="workspaces-bar">
			<div id="tabs">
				<span>Workspaces: {workspaces.length}</span>
				{workspaces.map( ( workspace: any ) => {
					return ( <span>tab {workspace.name}</span> );
				} )}
			</div>
			<a href="#" id="add-workspace" title="Add workspace" onClick={() => dispatch( increment() )}>➕</a>
		</section>
	);
}
