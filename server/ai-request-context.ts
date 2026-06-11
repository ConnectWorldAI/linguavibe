/**
 * AI Request Context — AsyncLocalStorage-based context propagation
 * 
 * This allows the security middleware to know WHO is making a request
 * without modifying every single invokeLLM call site.
 * 
 * Usage:
 * - Wrap request handlers with `runWithAIContext(userId, fn)`
 * - Inside invokeLLM, call `getAIRequestContext()` to get the current user
 */

import { AsyncLocalStorage } from "node:async_hooks";

export interface AIRequestContext {
  /** The authenticated user ID making this request */
  userId?: string;
  /** Whether this is a user-facing interaction (stricter security) */
  isUserFacing: boolean;
  /** Whether to skip security (for internal pipelines) */
  skipSecurity: boolean;
}

const aiContextStorage = new AsyncLocalStorage<AIRequestContext>();

/**
 * Run a function within an AI request context.
 * This propagates the user identity to all nested invokeLLM calls.
 */
export function runWithAIContext<T>(context: AIRequestContext, fn: () => T): T {
  return aiContextStorage.run(context, fn);
}

/**
 * Get the current AI request context (if any).
 * Returns undefined if not running within a context (e.g., startup scripts).
 */
export function getAIRequestContext(): AIRequestContext | undefined {
  return aiContextStorage.getStore();
}
