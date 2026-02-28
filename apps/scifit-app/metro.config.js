const { getDefaultConfig } = require('expo/metro-config');

if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, 'toReversed', {
    value: function toReversed() {
      return this.slice().reverse();
    },
    writable: true,
    configurable: true,
  });
}

if (!Array.prototype.toSorted) {
  Object.defineProperty(Array.prototype, 'toSorted', {
    value: function toSorted(compareFn) {
      return this.slice().sort(compareFn);
    },
    writable: true,
    configurable: true,
  });
}

if (!Array.prototype.toSpliced) {
  Object.defineProperty(Array.prototype, 'toSpliced', {
    value: function toSpliced(start, deleteCount, ...items) {
      const copy = this.slice();
      copy.splice(start, deleteCount, ...items);
      return copy;
    },
    writable: true,
    configurable: true,
  });
}

const config = getDefaultConfig(__dirname);

module.exports = config;
