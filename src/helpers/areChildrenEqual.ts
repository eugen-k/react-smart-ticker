import { isValidElement, ReactNode } from 'react'

const isPlainObject = (obj: unknown): obj is Record<string, unknown> => {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj) && !isValidElement(obj)
}

const areObjectsEqual = (objA: Record<string, unknown>, objB: Record<string, unknown>): boolean => {
  if (objA === objB) return true
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false
  }
  return true
}

/**
 * Deeply compares two React children trees/nodes to determine if their content
 * and structure are functionally identical.
 */
export const areChildrenEqual = (prev: ReactNode, next: ReactNode): boolean => {
  if (prev === next) return true
  if (prev == null || next == null) return prev === next
  if (typeof prev !== typeof next) return false
  if (typeof prev === 'string' || typeof prev === 'number' || typeof prev === 'boolean') {
    return prev === next
  }

  if (Array.isArray(prev) && Array.isArray(next)) {
    if (prev.length !== next.length) return false
    return prev.every((child, index) => areChildrenEqual(child, next[index]))
  }

  if (isValidElement(prev) && isValidElement(next)) {
    if (prev.type !== next.type || prev.key !== next.key) return false
    const prevProps = prev.props as Record<string, unknown>
    const nextProps = next.props as Record<string, unknown>
    const prevKeys = Object.keys(prevProps)
    const nextKeys = Object.keys(nextProps)
    if (prevKeys.length !== nextKeys.length) return false

    for (const key of prevKeys) {
      if (key === 'children') {
        if (!areChildrenEqual(prevProps.children as ReactNode, nextProps.children as ReactNode)) {
          return false
        }
      } else if (isPlainObject(prevProps[key]) && isPlainObject(nextProps[key])) {
        if (
          !areObjectsEqual(
            prevProps[key] as Record<string, unknown>,
            nextProps[key] as Record<string, unknown>
          )
        ) {
          return false
        }
      } else if (prevProps[key] !== nextProps[key]) {
        return false
      }
    }
    return true
  }

  return false
}
