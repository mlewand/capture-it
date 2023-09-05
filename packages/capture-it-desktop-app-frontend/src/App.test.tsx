import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders add a todo button', () => {
  render(<App />);
  const linkElement = screen.getByText(/Add todo/i);
  expect(linkElement).toBeInTheDocument();
});
