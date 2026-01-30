'use client';

import { InputScreen } from '@/components/InputScreen';
import { ResultsScreen } from '@/components/ResultsScreen';
import { VibeCheckScreen } from '@/components/VibeCheckScreen';
import { useDinnerFlow } from '@/hooks';

// =============================================================================
// Main App Flow - Progressive Loading (no separate loading screen)
// =============================================================================

export default function CharcuterMeApp() {
  const { state, actions } = useDinnerFlow();

  switch (state.screen) {
    case 'input':
      return (
        <InputScreen
          onSubmit={actions.submitIngredients}
          isLoading={state.isLoadingName}
        />
      );

    case 'results':
      return (
        <ResultsScreen
          dinnerName={state.dinnerName}
          validation={state.validation}
          tip={state.tip}
          wildcard={state.wildcard}
          imageUrl={state.imageUrl}
          svgFallback={state.svgFallback}
          onCheckVibe={actions.goToVibeCheck}
          onJustEat={actions.reset}
          onRetryImage={actions.retryImage}
          isLoadingName={state.isLoadingName}
          isLoadingImage={state.isLoadingImage}
          imageError={state.imageError}
        />
      );

    case 'vibecheck':
      return (
        <VibeCheckScreen
          dinnerData={{
            name: state.dinnerName || 'Your Creation',
            validation: state.validation || '',
            tip: state.tip || '',
            wildcard: state.wildcard,
          }}
          inspirationImage={state.imageUrl}
          onStartOver={actions.reset}
        />
      );

    default:
      return <InputScreen onSubmit={actions.submitIngredients} />;
  }
}
