import { useReducer, useCallback } from 'react';
import { NamerResponseSchema, SketchResponseSchema } from '@/types';
import type { NamerResponse, SketchResponse } from '@/types';

/**
 * Dinner Flow State Management
 *
 * Centralized state management for the dinner naming flow.
 * Replaces 11 scattered useState calls with a single reducer.
 */

// =============================================================================
// Types
// =============================================================================

export type Screen = 'input' | 'loading' | 'results' | 'vibecheck';

export interface DinnerState {
  screen: Screen;
  ingredients: string;
  dinnerName: string;
  validation: string;
  tip: string;
  wildcard?: string;
  imageUrl: string | null;
  svgFallback: string | null;
  isLoadingName: boolean;
  isLoadingImage: boolean;
  imageError: boolean;
}

type DinnerAction =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_INGREDIENTS'; ingredients: string }
  | { type: 'SET_NAME_RESULT'; data: NamerResponse }
  | { type: 'SET_IMAGE_RESULT'; data: SketchResponse }
  | { type: 'SET_LOADING_NAME'; isLoading: boolean }
  | { type: 'SET_LOADING_IMAGE'; isLoading: boolean }
  | { type: 'SET_IMAGE_ERROR'; hasError: boolean }
  | { type: 'RESET' };

// =============================================================================
// Initial State
// =============================================================================

const initialState: DinnerState = {
  screen: 'input',
  ingredients: '',
  dinnerName: '',
  validation: '',
  tip: '',
  wildcard: undefined,
  imageUrl: null,
  svgFallback: null,
  isLoadingName: false,
  isLoadingImage: false,
  imageError: false,
};

// =============================================================================
// Reducer
// =============================================================================

function dinnerReducer(state: DinnerState, action: DinnerAction): DinnerState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };

    case 'SET_INGREDIENTS':
      return { ...state, ingredients: action.ingredients };

    case 'SET_NAME_RESULT':
      return {
        ...state,
        dinnerName: action.data.name || 'The Spread',
        validation: action.data.validation || "That's a real dinner. You're doing great.",
        tip: action.data.tip || 'Trust your instincts.',
        wildcard: action.data.wildcard,
      };

    case 'SET_IMAGE_RESULT':
      if (action.data.type === 'image' && action.data.imageUrl) {
        return {
          ...state,
          imageUrl: action.data.imageUrl,
          svgFallback: null,
          imageError: false,
        };
      } else if (action.data.svg) {
        return {
          ...state,
          svgFallback: action.data.svg,
          imageUrl: null,
          imageError: true,
        };
      }
      return state;

    case 'SET_LOADING_NAME':
      return { ...state, isLoadingName: action.isLoading };

    case 'SET_LOADING_IMAGE':
      return { ...state, isLoadingImage: action.isLoading };

    case 'SET_IMAGE_ERROR':
      return { ...state, imageError: action.hasError };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useDinnerFlow() {
  const [state, dispatch] = useReducer(dinnerReducer, initialState);

  // =============================================================================
  // API Calls
  // =============================================================================

  const generateName = useCallback(async (ingredients: string) => {
    dispatch({ type: 'SET_LOADING_NAME', isLoading: true });

    const fallbackData: NamerResponse = {
      name: 'The Spread',
      validation: "That's a real dinner. You're doing great.",
      tip: 'The couch is the correct location for this meal.',
    };

    try {
      const response = await fetch('/api/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();

      // Validate response with Zod
      const result = NamerResponseSchema.safeParse(json);
      if (!result.success) {
        console.error('Invalid API response:', result.error);
        dispatch({ type: 'SET_NAME_RESULT', data: fallbackData });
        return fallbackData;
      }

      dispatch({ type: 'SET_NAME_RESULT', data: result.data });
      return result.data;
    } catch (error) {
      console.error('Error generating name:', error);
      dispatch({ type: 'SET_NAME_RESULT', data: fallbackData });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING_NAME', isLoading: false });
    }
  }, []);

  const generateSketch = useCallback(async (ingredients: string) => {
    dispatch({ type: 'SET_LOADING_IMAGE', isLoading: true });
    dispatch({ type: 'SET_IMAGE_ERROR', hasError: false });

    try {
      const response = await fetch('/api/sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();

      // Validate response with Zod
      const result = SketchResponseSchema.safeParse(json);
      if (!result.success) {
        console.error('Invalid API response:', result.error);
        dispatch({ type: 'SET_IMAGE_ERROR', hasError: true });
        return null;
      }

      dispatch({ type: 'SET_IMAGE_RESULT', data: result.data });
      return result.data;
    } catch (error) {
      console.error('Error generating sketch:', error);
      dispatch({ type: 'SET_IMAGE_ERROR', hasError: true });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING_IMAGE', isLoading: false });
    }
  }, []);

  // =============================================================================
  // Actions
  // =============================================================================

  const submitIngredients = useCallback(
    async (ingredients: string) => {
      dispatch({ type: 'RESET' });
      dispatch({ type: 'SET_INGREDIENTS', ingredients });
      dispatch({ type: 'SET_SCREEN', screen: 'loading' });

      // Minimum loading time for theatrical effect
      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 1500));

      // Fire both API calls in parallel
      const namePromise = generateName(ingredients);
      generateSketch(ingredients);

      // Wait for BOTH name to be ready AND minimum loading time
      await Promise.all([namePromise, minLoadingTime]);
      dispatch({ type: 'SET_SCREEN', screen: 'results' });
    },
    [generateName, generateSketch]
  );

  const retryImage = useCallback(() => {
    if (state.ingredients) {
      generateSketch(state.ingredients);
    }
  }, [state.ingredients, generateSketch]);

  const goToVibeCheck = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', screen: 'vibecheck' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    actions: {
      submitIngredients,
      retryImage,
      goToVibeCheck,
      reset,
    },
  };
}

export default useDinnerFlow;
