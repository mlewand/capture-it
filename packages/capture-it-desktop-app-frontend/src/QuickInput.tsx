
import './QuickInput.css';

export default function QuickInput() {
	return (
		<section id="quick-input-container">
			<input id="textInput" placeholder="What's on your mind?" type="text" />
			<button id="submitButton">Add todo</button>
		</section>
	);
}