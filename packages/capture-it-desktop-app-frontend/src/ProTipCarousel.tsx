
import React, { useState, useEffect } from 'react';
import './ProTipCarousel.css';

const tips = [
	<p>💡 You can use an <kbd>enter</kbd> hotkey to add the todo item.</p>,
	<p>💡 Use a <kbd>alt</kbd> + <kbd>enter</kbd> hotkey to add the todo item & open page in Notion.</p>,
	<p>💡 You can customize invocation key (<code data-pro-tip-placeholder="invocation-key"></code>) in <code>.capture-it-config.json</code> using the <code>invocationHotKey</code> property.</p>,
	<p>💡 You can opt in for opening your notion pages directly in Notion app in <code>.capture-it-config.json</code>.</p>,
	<p>💡 Use a <kbd>alt</kbd> + <kbd>shift</kbd> + <kbd>enter</kbd> hotkey to put created todo item link to a clipboard.</p>
];

function ProTipCarousel() {
	const [ currentTipIndex, setCurrentTipIndex ] = useState( 0 );

	useEffect( () => {
		const intervalId = setInterval( () => {
			setCurrentTipIndex( ( previousIndex ) => ( previousIndex + 1 ) % tips.length );
		}, 30 * 1000 );

		return () => clearInterval( intervalId );
	}, [] );

	return (
		<section id="pro-tip-container">
			{tips[ currentTipIndex ] || ''}
		</section>
	);
}

export default ProTipCarousel;