/// <reference types="vite/client" />

// Cursor/TS diagnostics sometimes run without node_modules type resolution.
// This shim prevents false-positive "Cannot find module 'lucide-react'" errors.
declare module "lucide-react";
