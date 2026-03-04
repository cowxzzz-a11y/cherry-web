"use strict";
// Mock for @mcp-trace/trace-web
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebTracer = void 0;
exports.startContext = startContext;
exports.getContext = getContext;
exports.endContext = endContext;
exports.cleanContext = cleanContext;
class WebTracer {
    init() {
        // No-op for web
    }
    startSpan(name) {
        return {
            name,
            start: () => { },
            end: () => { },
            setAttribute: () => { }
        };
    }
}
exports.WebTracer = WebTracer;
// Context management - mock implementations
const mockContext = new Map();
function startContext(name) {
    const context = {
        id: `span-${Date.now()}`,
        name,
        startTime: Date.now()
    };
    mockContext.set(context.id, context);
    return context;
}
function getContext(spanId) {
    return mockContext.get(spanId);
}
function endContext(spanId, usage) {
    const context = mockContext.get(spanId);
    if (context) {
        context.endTime = Date.now();
        if (usage) {
            context.attributes = { ...context.attributes, tokenUsage: usage };
        }
    }
}
function cleanContext(spanId) {
    mockContext.delete(spanId);
}
exports.default = {
    WebTracer,
    getContext,
    startContext,
    endContext,
    cleanContext
};
