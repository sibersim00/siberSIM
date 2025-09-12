import { useMemo } from "react";
import { configureStore } from '@reduxjs/toolkit';
import { rootPersistConfig, rootReducer } from './rootReducer';
import { persistReducer } from 'redux-persist';

let store;

function initStore(initialState) {
	return configureStore({
		reducer: persistReducer(rootPersistConfig, rootReducer),
		initialState,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
			serializableCheck: false,
			immutableCheck: false,
		}),
	  });
}

export const initializeStore = (preloadedState) => {
	let initialStore = store ?? initStore(preloadedState);

	// After navigating to a page with an initial Redux state, merge that state
	// with the current state in the store, and create a new store
	if (preloadedState && store) {
		initialStore = initStore({
			...store.getState(),
			...preloadedState,
		});
		// Reset the current store
		store = undefined;
	}

	// For SSG and SSR always create a new store
	if (typeof window === "undefined") {
		return initialStore;
	}
	// Create the store once in the client
	if (!store) store = initialStore;

	return initialStore;
};

export function useStore(initialState) {
	return useMemo(() => initializeStore(initialState), [initialState]);
}