// Thrown for messages the person using the form should see; any other error is logged and replaced with a generic message.
// Kept dependency-free so plain-Node unit tests can import modules that throw it.
export class ActionError extends Error {
  name = 'ActionError'
}
