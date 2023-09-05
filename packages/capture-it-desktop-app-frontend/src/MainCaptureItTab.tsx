import ProTipCarousel from './ProTipCarousel';
import QuickInput from './QuickInput';
import WorkspacesBar from './WorkspacesBar';

import './MainCaptureItTab.css';

export default function MainCaptureItTab() {
	return (
		<section id="app-tab">
			<WorkspacesBar />
			<QuickInput />
			<ProTipCarousel />

			{/* to extract */}
			<section id="notification-area-container"></section>

			<section id="reports-container">
				Seeing a bug or thinking about new feature? Report an issue <a href="https://github.com/mlewand/capture-it/issues"
					target="_blank" rel="noopener noreferrer">on GitHub</a>.
			</section>
		</section>
	);
}
