import React from 'react'
import { areChildrenEqual } from './areChildrenEqual'

describe('areChildrenEqual', () => {
  test('returns true for identical primitives', () => {
    expect(areChildrenEqual('hello', 'hello')).toBe(true)
    expect(areChildrenEqual(123, 123)).toBe(true)
    expect(areChildrenEqual(true, true)).toBe(true)
    expect(areChildrenEqual(null, null)).toBe(true)
    expect(areChildrenEqual(undefined, undefined)).toBe(true)
  })

  test('returns false for different primitives', () => {
    expect(areChildrenEqual('hello', 'world')).toBe(false)
    expect(areChildrenEqual(123, 456)).toBe(false)
    expect(areChildrenEqual(true, false)).toBe(false)
    expect(areChildrenEqual('123', 123 as unknown as string)).toBe(false)
    expect(areChildrenEqual(null, undefined)).toBe(false)
    expect(areChildrenEqual('text', null)).toBe(false)
  })

  test('returns true for equal React elements with same props and children', () => {
    const el1 = <span>Hello</span>
    const el2 = <span>Hello</span>
    expect(areChildrenEqual(el1, el2)).toBe(true)

    const complex1 = (
      <div className="test" style={{ color: 'red' }}>
        <span>Nested 1</span>
        <span>Nested 2</span>
      </div>
    )
    const complex2 = (
      <div className="test" style={{ color: 'red' }}>
        <span>Nested 1</span>
        <span>Nested 2</span>
      </div>
    )
    expect(areChildrenEqual(complex1, complex2)).toBe(true)
  })

  test('returns false for React elements with different types, keys, or props', () => {
    expect(areChildrenEqual(<span>Hello</span>, <div>Hello</div>)).toBe(false)
    expect(areChildrenEqual(<span key="1">Hello</span>, <span key="2">Hello</span>)).toBe(false)
    expect(areChildrenEqual(<span className="a">Hello</span>, <span className="b">Hello</span>)).toBe(
      false
    )
    expect(areChildrenEqual(<span>Hello</span>, <span>World</span>)).toBe(false)
    expect(areChildrenEqual(<span>Hello</span>, <span>Hello<span>World</span></span>)).toBe(false)
  })

  test('returns true for equal arrays of elements', () => {
    const arr1 = [<span key="1">A</span>, <span key="2">B</span>]
    const arr2 = [<span key="1">A</span>, <span key="2">B</span>]
    expect(areChildrenEqual(arr1, arr2)).toBe(true)
  })

  test('returns false for arrays with different lengths or items', () => {
    const arr1 = [<span key="1">A</span>]
    const arr2 = [<span key="1">A</span>, <span key="2">B</span>]
    expect(areChildrenEqual(arr1, arr2)).toBe(false)

    const arr3 = [<span key="1">A</span>, <span key="2">B</span>]
    const arr4 = [<span key="1">A</span>, <span key="2">C</span>]
    expect(areChildrenEqual(arr3, arr4)).toBe(false)
  })
})
