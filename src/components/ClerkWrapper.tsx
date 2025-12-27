import { ReactNode, ReactElement, useEffect } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { setGlobalTokenGetter } from '../lib/authenticated-fetch';

interface ClerkWrapperProps {
  children: ReactNode;
}

/**
 * Initializes the global token getter for authenticated API calls.
 * Must be rendered inside ClerkProvider.
 */
function AuthInitializer({ children }: { children: ReactNode }): ReactElement {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set the global token getter that authenticated-fetch will use
    setGlobalTokenGetter(async () => {
      try {
        return await getToken();
      } catch (error) {
        console.warn('Failed to get auth token:', error);
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
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
        <AuthInitializer>
          {children}
        </AuthInitializer>
      </ClerkProvider>
    );
  }

  // No Clerk key - render children without ClerkProvider
  // useClerkUser hook will handle the missing provider
  return <>{children}</>;
}

