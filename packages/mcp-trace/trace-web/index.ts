// Mock for @mcp-trace/trace-web

import type { SpanEntity, TokenUsage } from '../trace-core/index.js'

export class WebTracer {
  init() {
    // No-op for web
  }

  startSpan(name: string) {
    return {
      name,
      start: () => {},
      end: () => {},
      setAttribute: () => {}
    }
  }
}

// Context management - mock implementations
const mockContext: Map<string, SpanEntity> = new Map()

export function startContext(name: string): SpanEntity {
  const context: SpanEntity = {
    id: `span-${Date.now()}`,
    name,
    startTime: Date.now()
  }
  mockContext.set(context.id, context)
  return context
}

export function getContext(spanId: string): SpanEntity | undefined {
  return mockContext.get(spanId)
}

export function endContext(spanId: string, usage?: TokenUsage): void {
  const context = mockContext.get(spanId)
  if (context) {
    context.endTime = Date.now()
    if (usage) {
      context.attributes = { ...context.attributes, tokenUsage: usage }
    }
  }
}

export function cleanContext(spanId: string): void {
  mockContext.delete(spanId)
}

export default {
  WebTracer,
  getContext,
  startContext,
  endContext,
  cleanContext
}
