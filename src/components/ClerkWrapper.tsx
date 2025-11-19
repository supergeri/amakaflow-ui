import { ReactNode, ReactElement } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

interface ClerkWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper that conditionally provides ClerkProvider or just renders children
 * Only renders ClerkProvider when a real key exists to avoid validation errors
 * When no key, hooks in useClerkUser will return mock values
 */
export function ClerkWrapper({ children }: ClerkWrapperProps): ReactElement {
  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const hasRealClerkKey = !!PUBLISHABLE_KEY && !PUBLISHABLE_KEY.includes('placeholder');

  // Only wrap in ClerkProvider if we have a real key
  // Without ClerkProvider, hooks will throw, but useClerkUser handles this
  if (hasRealClerkKey) {
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        {children}
      </ClerkProvider>
    );
  }

  // No Clerk key - render children without ClerkProvider
  // useClerkUser hook will handle the missing provider
  return <>{children}</>;
}

