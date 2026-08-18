// Test preload: register a DOM so @testing-library/react can render into it, then
// pull in jest-dom's matchers (toBeInTheDocument, toHaveTextContent, ...) on top of
// bun:test's expect. Referenced from bunfig.toml [test].preload.
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

// Must come after the DOM is registered.
import '@testing-library/jest-dom';
