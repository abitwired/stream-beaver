/**
 * Get the deep keys of an object
 * @param {*} t The object to get the deep keys from
 * @param {*} pre The prefix
 * @returns {Array}
 */
const deepKeys = (t, pre = []) =>
  Array.isArray(t)
    ? []
    : Object(t) === t
    ? Object.entries(t).flatMap(([k, v]) => deepKeys(v, [...pre, k]))
    : pre.join(".");

module.exports = {
  deepKeys,
};
