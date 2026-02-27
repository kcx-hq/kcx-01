import React from "react";
import { AlertTriangle } from "lucide-react";

interface ModuleErrorBoundaryProps {
  moduleName?: string;
  children?: React.ReactNode;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
}

export class ModuleErrorBoundary extends React.Component<ModuleErrorBoundaryProps, ModuleErrorBoundaryState> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ModuleErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[Dashboard Module Error] ${this.props.moduleName || "Module"}`, error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center">
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
        </div>
        <h3 className="text-sm font-bold text-rose-700">
          {this.props.moduleName || "Section"} failed to render
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Try refreshing the page or switching sections.
        </p>
      </div>
    );
  }
}

export default ModuleErrorBoundary;
