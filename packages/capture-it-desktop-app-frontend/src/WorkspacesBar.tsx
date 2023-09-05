
import './WorkspacesBar.css';
import { increment, decrement } from './workspaces/workspacesSlice';
import { useAppDispatch, useAppSelector, type RootState } from './hooks';

export default function WorkspacesBar() {
	const dispatch = useAppDispatch();
	const workspaces = useAppSelector( ( state: RootState ) => state.workspaces.value );

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
