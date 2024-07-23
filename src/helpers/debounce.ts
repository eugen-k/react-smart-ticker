export function debounce(fn: () => void, interval: number) {
  const timeout = { isRunning: false }

  function _timeout(fn: () => void, interval: number) {
    timeout.isRunning = true

    setTimeout(() => {
      fn()
      timeout.isRunning = false
    }, interval)
  }

  function debounced() {
    if (!timeout.isRunning) {
      _timeout(fn, interval)
    }
  }

  return debounced
}
