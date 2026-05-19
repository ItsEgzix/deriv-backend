"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collapseWhitespace = collapseWhitespace;
exports.buildTextForModel = buildTextForModel;
exports.wordCount = wordCount;
exports.truncateToMaxWords = truncateToMaxWords;
function collapseWhitespace(value) {
    return value.replace(/\s+/g, ' ');
}
function buildTextForModel(subject, message) {
    const s = collapseWhitespace(subject.trim());
    const m = collapseWhitespace(message.trim());
    return `Subject: ${s}\n\nMessage: ${m}`;
}
function wordCount(text) {
    const trimmed = text.trim();
    if (!trimmed)
        return 0;
    return trimmed.split(/\s+/).length;
}
function truncateToMaxWords(text, maxWords) {
    const trimmed = text.trim();
    if (!trimmed)
        return trimmed;
    const words = trimmed.split(/\s+/);
    if (words.length <= maxWords)
        return trimmed;
    return `${words.slice(0, maxWords).join(' ')}...`;
}
//# sourceMappingURL=text.util.js.map