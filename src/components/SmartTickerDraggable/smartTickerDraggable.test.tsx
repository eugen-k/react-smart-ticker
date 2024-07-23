/// <reference

import React from 'react'
import { render, screen } from '@testing-library/react'
import { SmartTickerDraggable } from '.'
import { fireEvent, waitFor } from '@testing-library/dom'

const mockGetBoundingClientRect = jest.fn()

beforeAll(() => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: 1200
  })

  Object.defineProperty(document.documentElement, 'clientHeight', {
    configurable: true,
    value: 800
  })

  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: mockGetBoundingClientRect
  })
})

beforeEach(() => {
  mockGetBoundingClientRect
    // container rect
    .mockReturnValueOnce({
      width: 200,
      height: 200
    })
    // ticker rect
    .mockReturnValueOnce({
      width: 50,
      height: 50
    })
    // line height
    .mockReturnValueOnce({
      width: 50,
      height: 50
    })
})

afterEach(() => {
  mockGetBoundingClientRect.mockRestore()
})

describe('SmartTickerDraggable', () => {
  test('renders with 1 element while smart mode is on', () => {
    render(<SmartTickerDraggable>Test</SmartTickerDraggable>)
    const elements = screen.getAllByText(/Test/i)
    expect(elements).toHaveLength(1)
  })

  test('renders with 3 element while smart mode is off', () => {
    render(<SmartTickerDraggable smart={false}>Test</SmartTickerDraggable>)
    const elements = screen.getAllByText(/Test/i)
    expect(elements).toHaveLength(3)
  })

  test('renders with 1 element while infiniteScrollView param is off', () => {
    render(<SmartTickerDraggable infiniteScrollView={false}>Test</SmartTickerDraggable>)
    const elements = screen.getAllByText(/Test/i)
    expect(elements).toHaveLength(1)
  })

  test('renders with 3 element while infiniteScrollView param is on and smart mode is off', () => {
    render(<SmartTickerDraggable smart={false}>Test</SmartTickerDraggable>)
    const elements = screen.getAllByText(/Test/i)
    expect(elements).toHaveLength(3)
  })

  test('renders with 3 element while infiniteScrollView param is on and smart mode is off', () => {
    render(<SmartTickerDraggable smart={false}>Test</SmartTickerDraggable>)
    const elements = screen.getAllByText(/Test/i)
    expect(elements).toHaveLength(3)
  })

  test('starts the animation to the left', async () => {
    render(
      <SmartTickerDraggable smart={false} direction='left'>
        Test
      </SmartTickerDraggable>
    )
    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    expect(Number(wrapper.style.left.replace('px', ''))).toBeLessThan(0)
  })

  test('starts the animation and pause on hover', async () => {
    render(
      <SmartTickerDraggable smart={false} pauseOnHover direction='left'>
        Test
      </SmartTickerDraggable>
    )
    const container = screen.getByTestId('ticker-container')
    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 200))

    const curPos = Number(wrapper.style.left.replace('px', ''))

    fireEvent.mouseOver(container)

    expect(Number(wrapper.style.left.replace('px', ''))).toBe(curPos)
  })

  test('starts the animation to the right', async () => {
    render(
      <SmartTickerDraggable smart={false} direction='right'>
        Test
      </SmartTickerDraggable>
    )
    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    expect(Number(wrapper.style.left.replace('px', ''))).toBeGreaterThan(0)
  })

  test('starts the animation to the right when child fits and infiniteScrollView is on', async () => {
    jest.resetAllMocks()

    mockGetBoundingClientRect
      // container rect
      .mockReturnValueOnce({
        width: 200,
        height: 200
      })
      // ticker rect
      .mockReturnValueOnce({
        width: 199,
        height: 199
      })

    render(
      <SmartTickerDraggable smart={false} direction='right' infiniteScrollView={true}>
        Test
      </SmartTickerDraggable>
    )
    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 500))

    expect(Number(wrapper.style.left.replace('px', ''))).toBeGreaterThan(0)
  })

  test('starts the animation to the right when child doesnt fit and infiniteScrollView is off', async () => {
    jest.resetAllMocks()

    mockGetBoundingClientRect
      // container rect
      .mockReturnValueOnce({
        width: 200,
        height: 200
      })
      // ticker rect
      .mockReturnValueOnce({
        width: 250,
        height: 250
      })

    render(
      <SmartTickerDraggable smart={false} direction='right' infiniteScrollView={false}>
        Test
      </SmartTickerDraggable>
    )
    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 500))

    expect(Number(wrapper.style.left.replace('px', ''))).toBeGreaterThan(0)
  })

  test('changes position on touchMove to the right', async () => {
    render(
      <SmartTickerDraggable smart={false} direction='right'>
        Test
      </SmartTickerDraggable>
    )
    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    const curPos = Number(wrapper.style.left.replace('px', ''))

    fireEvent.touchStart(wrapper, { touches: [{ clientX: 0, clientY: 0 }] })
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 20, clientY: 0 }] })

    await new Promise((r) => setTimeout(r, 100))

    fireEvent.touchEnd(wrapper)
    expect(Number(wrapper.style.left.replace('px', ''))).toBe(curPos + 20)
  })

  test('changes position on mouseMove to the right', async () => {
    render(
      <SmartTickerDraggable smart={false} direction='right'>
        Test
      </SmartTickerDraggable>
    )
    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    const curPos = Number(wrapper.style.left.replace('px', ''))

    fireEvent.mouseDown(wrapper, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(wrapper, { clientX: 20, clientY: 0 })

    await new Promise((r) => setTimeout(r, 100))

    fireEvent.mouseUp(wrapper)
    expect(Number(wrapper.style.left.replace('px', ''))).toBe(curPos + 20)
  })

  test('changes position on mouseMove to the right when infiniteScrollView param is off', async () => {
    render(
      <SmartTickerDraggable smart={false} direction='right' infiniteScrollView={false}>
        Test
      </SmartTickerDraggable>
    )
    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 200))

    await waitFor(async () => {
      fireEvent.mouseDown(wrapper, { clientX: 0, clientY: 0 })
      fireEvent.mouseMove(wrapper, { clientX: 20, clientY: 0 })
    })

    await new Promise((r) => setTimeout(r, 200))

    expect(Number(wrapper.style.left.replace('px', ''))).toBeGreaterThan(0)

    fireEvent.mouseUp(wrapper)

    await new Promise((r) => setTimeout(r, 200))

    expect(Number(wrapper.style.left.replace('px', ''))).toBe(0)
  })

  test('changes position on mouseMove to the left', async () => {
    render(
      <SmartTickerDraggable smart={false} direction='left'>
        Test
      </SmartTickerDraggable>
    )
    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    const curPos = Number(wrapper.style.left.replace('px', ''))

    fireEvent.mouseDown(wrapper, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(wrapper, { clientX: -20, clientY: 0 })

    await new Promise((r) => setTimeout(r, 100))

    fireEvent.mouseUp(wrapper)
    expect(Number(wrapper.style.left.replace('px', ''))).toBe(curPos - 20)
  })

  test('changes position on mouseMove to the top', async () => {
    render(
      <SmartTickerDraggable smart={false} direction='top'>
        Test
      </SmartTickerDraggable>
    )
    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    const curPos = Number(wrapper.style.top.replace('px', ''))

    fireEvent.mouseDown(wrapper, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(wrapper, { clientX: 0, clientY: 20 })

    await new Promise((r) => setTimeout(r, 100))

    fireEvent.mouseUp(wrapper)
    expect(Number(wrapper.style.top.replace('px', ''))).toBe(curPos + 20)
  })

  test('changes position on mouseMove to the bottom', async () => {
    render(
      <SmartTickerDraggable smart={false} direction='bottom'>
        Test
      </SmartTickerDraggable>
    )
    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    const curPos = Number(wrapper.style.top.replace('px', ''))

    fireEvent.mouseDown(wrapper, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(wrapper, { clientX: 0, clientY: -20 })

    await new Promise((r) => setTimeout(r, 100))

    fireEvent.mouseUp(wrapper)
    expect(Number(wrapper.style.top.replace('px', ''))).toBe(curPos - 20)
  })

  test('resets its position on window resize', async () => {
    mockGetBoundingClientRect
      // container rect
      .mockReturnValueOnce({
        width: 200,
        height: 200
      })
      // ticker rect
      .mockReturnValueOnce({
        width: 50,
        height: 50
      })
      // line height
      .mockReturnValueOnce({
        width: 50,
        height: 50
      })

    render(
      <SmartTickerDraggable smart={false} direction='left'>
        Test
      </SmartTickerDraggable>
    )

    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 500))

    await waitFor(async () => {
      window.dispatchEvent(new Event('resize'))
    })

    await waitFor(async () => new Promise((r) => setTimeout(r, 250)))

    expect(Math.abs(Number(wrapper.style.left.replace('px', '')))).toBeLessThan(2)
  })
})
