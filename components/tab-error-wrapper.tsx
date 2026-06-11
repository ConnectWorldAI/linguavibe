/**
 * Tab Error Wrapper — wraps individual tab screens with ScreenErrorBoundary.
 *
 * Since Expo Router file-based routing doesn't allow wrapping individual tab
 * screens from the layout, each tab screen should import and use this wrapper
 * around its main content.
 */
import React, { type ReactNode } from "react";
import { ScreenErrorBoundary } from "@/components/error-boundary";

interface TabErrorWrapperProps {
  children: ReactNode;
}

export function TabErrorWrapper({ children }: TabErrorWrapperProps) {
  return <ScreenErrorBoundary>{children}</ScreenErrorBoundary>;
}
