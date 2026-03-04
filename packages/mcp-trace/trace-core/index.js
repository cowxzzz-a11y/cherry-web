"use strict";
// Mock for @mcp-trace/trace-core
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionSpanProcessor = exports.FunctionSpanExporter = void 0;
exports.convertSpanToSpanEntity = convertSpanToSpanEntity;
exports.TraceMethod = TraceMethod;
// Functions
function convertSpanToSpanEntity(span) {
    return {
        id: 'mock-span-id',
        name: 'mock-span',
        startTime: Date.now(),
        attributes: {}
    };
}
class FunctionSpanExporter {
    constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _exportFunc) {
        this._exportFunc = _exportFunc;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async export(spans) {
        return this._exportFunc(spans);
    }
    shutdown() {
        return Promise.resolve();
    }
}
exports.FunctionSpanExporter = FunctionSpanExporter;
class FunctionSpanProcessor {
    constructor(_exporter) {
        this._exporter = _exporter;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async onEnd(span) { }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async onStart(span) { }
    shutdown() {
        return Promise.resolve();
    }
}
exports.FunctionSpanProcessor = FunctionSpanProcessor;
// Decorator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TraceMethod(options) {
    return function (target, propertyKey, descriptor) {
        return descriptor;
    };
}
