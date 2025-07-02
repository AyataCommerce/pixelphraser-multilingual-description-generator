"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = assert;
exports.assertError = assertError;
exports.assertString = assertString;
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
function assertError(value, message) {
    assert(value instanceof Error, message !== null && message !== void 0 ? message : 'Invalid error value');
}
function assertString(value, message) {
    assert(typeof value === 'string', message !== null && message !== void 0 ? message : 'Invalid string value');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LnV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXNzZXJ0LnV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsd0JBSUM7QUFFRCxrQ0FLQztBQUVELG9DQUtDO0FBbEJELFNBQWdCLE1BQU0sQ0FBQyxTQUFrQixFQUFFLE9BQWU7SUFDeEQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUNsRCxDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQWdCLFdBQVcsQ0FDekIsS0FBYyxFQUNkLE9BQWdCO0lBRWhCLE1BQU0sQ0FBQyxLQUFLLFlBQVksS0FBSyxFQUFFLE9BQU8sYUFBUCxPQUFPLGNBQVAsT0FBTyxHQUFJLHFCQUFxQixDQUFDLENBQUM7QUFDbkUsQ0FBQztBQUVELFNBQWdCLFlBQVksQ0FDMUIsS0FBYyxFQUNkLE9BQWdCO0lBRWhCLE1BQU0sQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsT0FBTyxhQUFQLE9BQU8sY0FBUCxPQUFPLEdBQUksc0JBQXNCLENBQUMsQ0FBQztBQUN2RSxDQUFDIn0=