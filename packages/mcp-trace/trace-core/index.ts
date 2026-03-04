// Mock for @mcp-trace/trace-core

// Types
export interface SpanEntity {
  id: string
  name: string
  startTime: number
  endTime?: number
  attributes?: Record<string, unknown>
  status?: { code: number; message?: string }
  events?: Array<{ name: string; time: number }>
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface SpanContext {
  spanId: string
  traceId: string
}

// Functions
export function convertSpanToSpanEntity(span: unknown): SpanEntity {
  return {
    id: 'mock-span-id',
    name: 'mock-span',
    startTime: Date.now(),
    attributes: {}
  }
}

export class FunctionSpanExporter {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _exportFunc: (spans: any[]) => Promise<void>
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async export(spans: any[]): Promise<void> {
    return this._exportFunc(spans)
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}

export class FunctionSpanProcessor {
  constructor(private _exporter: FunctionSpanExporter) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async onEnd(span: any): Promise<void> {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async onStart(span: any): Promise<void> {}

  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}

// Decorator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TraceMethod(options: { spanName?: string; tag?: string }): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
    return descriptor
  }
}
