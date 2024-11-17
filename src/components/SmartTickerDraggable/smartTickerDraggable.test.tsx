/// <reference

import React, { act, ReactNode, useRef } from 'react'
import { render, screen } from '@testing-library/react'
import { SmartTickerDraggable } from '.'
import { fireEvent, waitFor } from '@testing-library/dom'
import { SmartTickerDraggableProps } from '../../types/smartTickerTypes'

// A helper component to facilitate testing with refs
const SmartTickerWithControl = ({
  play,
  pause,
  reset,
  children,
  ...props
}: SmartTickerDraggableProps & {
  play?: (cb: () => void) => void
  pause?: (cb: () => void) => void
  reset?: (cb: (isPaused: boolean) => void) => void
  children: ReactNode
}) => {
  const tickerRef = useRef<{
    play: () => void
    pause: () => void
    reset: () => void
  }>(null)

  // Expose the methods to the test through a ref
  React.useEffect(() => {
    if (tickerRef.current) {
      if (typeof play === 'function') play(tickerRef.current.play)
      if (typeof pause === 'function') pause(tickerRef.current.pause)
      if (typeof reset === 'function') reset(tickerRef.current.reset)
    }
  }, [tickerRef.current])

  return (
    <SmartTickerDraggable {...{ ...props, forwardedRef: tickerRef }}>
      {children}
    </SmartTickerDraggable>
  )
}

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

  Object.defineProperty(document, 'fonts', {
    value: { ready: Promise.resolve({}) }
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

const changeVisibility = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state // Mock the visibility state
  })
  fireEvent(document, new Event('visibilitychange')) // Trigger the event
}

describe('SmartTickerDraggable', () => {
  test('renders with 1 element while smart mode is on', async () => {
    await act(async () => {
      render(<SmartTickerDraggable>Test</SmartTickerDraggable>)
    })

    const elements = screen.getAllByText(/Test/i)
    expect(elements).toHaveLength(1)
  })

  test('renders with 3 element while smart mode is off', async () => {
    await act(async () => {
      render(<SmartTickerDraggable smart={false}>Test</SmartTickerDraggable>)
    })

    const elements = screen.getAllByText(/Test/i)
    expect(elements).toHaveLength(3)
  })

  test('renders with 1 element while infiniteScrollView param is off', async () => {
    await act(async () => {
      render(<SmartTickerDraggable infiniteScrollView={false}>Test</SmartTickerDraggable>)
    })

    const elements = screen.getAllByText(/Test/i)
    expect(elements).toHaveLength(1)
  })

  test('renders with 3 element while infiniteScrollView param is on and smart mode is off', async () => {
    await act(async () => {
      render(<SmartTickerDraggable smart={false}>Test</SmartTickerDraggable>)
    })

    const elements = screen.getAllByText(/Test/i)
    expect(elements).toHaveLength(3)
  })

  test('renders with 3 element while infiniteScrollView param is on and smart mode is off', async () => {
    await act(async () => {
      render(<SmartTickerDraggable smart={false}>Test</SmartTickerDraggable>)
    })

    const elements = screen.getAllByText(/Test/i)
    expect(elements).toHaveLength(3)
  })

  test('starts the animation to the left', async () => {
    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} direction='left'>
          Test
        </SmartTickerDraggable>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    expect(Number(wrapper.style.left.replace('px', ''))).toBeLessThan(0)
  })

  test('starts the animation and pause on hover', async () => {
    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} pauseOnHover direction='left'>
          Test
        </SmartTickerDraggable>
      )
    })

    const container = screen.getByTestId('ticker-container')
    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 200))

    const curPos = Number(wrapper.style.left.replace('px', ''))

    fireEvent.mouseOver(container)

    expect(Number(wrapper.style.left.replace('px', ''))).toBe(curPos)
  })

  test('starts the animation to the right', async () => {
    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} direction='right'>
          Test
        </SmartTickerDraggable>
      )
    })

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

    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} direction='right' infiniteScrollView={true}>
          Test
        </SmartTickerDraggable>
      )
    })

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

    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} direction='right' infiniteScrollView={false}>
          Test
        </SmartTickerDraggable>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 500))

    expect(Number(wrapper.style.left.replace('px', ''))).toBeGreaterThan(0)
  })

  test('plays on play action', async () => {
    let play: () => void

    await act(async () => {
      render(
        <SmartTickerWithControl
          play={(playFunc) => {
            play = playFunc
          }}
          smart={false}
          playOnHover
        >
          Test
        </SmartTickerWithControl>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    expect(Number(wrapper.style.left.replace('px', ''))).toBeCloseTo(0)

    await act(async () => {
      play()
    })

    await new Promise((r) => setTimeout(r, 500))

    expect(Number(wrapper.style.left.replace('px', ''))).toBeLessThan(0)
  })

  test('pauses on pause action', async () => {
    let pause: () => void

    await act(async () => {
      render(
        <SmartTickerWithControl
          pause={(pauseFunc) => {
            pause = pauseFunc
          }}
          smart={false}
          autoFill
        >
          Test
        </SmartTickerWithControl>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    const position = Number(wrapper.style.left.replace('px', ''))

    expect(position).toBeLessThan(0)

    await act(async () => {
      pause()
    })

    expect(Number(wrapper.style.left.replace('px', ''))).toBeCloseTo(position)
  })

  test('resets with pause on reset action', async () => {
    let reset: (isPaused: boolean) => void

    await act(async () => {
      render(
        <SmartTickerWithControl
          reset={(resetFunc) => {
            reset = resetFunc
          }}
          smart={false}
          autoFill
          delayBack={100}
        >
          Test
        </SmartTickerWithControl>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    const position = Number(wrapper.style.left.replace('px', ''))

    expect(position).toBeLessThan(0)

    await act(async () => {
      reset(true)
    })

    await new Promise((r) => setTimeout(r, 100))

    expect(Number(wrapper.style.left.replace('px', ''))).toBeCloseTo(0)
  })

  test('resets with play on reset action', async () => {
    let reset: (isPaused: boolean) => void

    await act(async () => {
      render(
        <SmartTickerWithControl
          reset={(resetFunc) => {
            reset = resetFunc
          }}
          smart={false}
          autoFill
          delayBack={100}
        >
          Test
        </SmartTickerWithControl>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    const position = Number(wrapper.style.left.replace('px', ''))

    expect(position).toBeLessThan(0)

    await act(async () => {
      reset(false)
    })

    await new Promise((r) => setTimeout(r, 100))

    expect(Number(wrapper.style.left.replace('px', ''))).toBeLessThan(0)
  })

  test('paused while onVisibilityChange(hidden) and playing back on onVisibilityChange(visible)', async () => {
    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} autoFill delayBack={100}>
          Test
        </SmartTickerDraggable>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    const position = Number(wrapper.style.left.replace('px', ''))

    // moving
    expect(position).toBeLessThan(0)

    await act(async () => {
      changeVisibility('hidden')
    })

    const pausedPosition = Number(wrapper.style.left.replace('px', ''))

    await new Promise((r) => setTimeout(r, 100))

    // paused
    expect(Number(wrapper.style.left.replace('px', ''))).toBe(pausedPosition)

    await act(async () => {
      changeVisibility('visible')
    })

    await new Promise((r) => setTimeout(r, 100))

    // moving
    expect(Number(wrapper.style.left.replace('px', ''))).toBeLessThan(pausedPosition)
  })

  test('changes position on touchMove to the right', async () => {
    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} direction='right'>
          Test
        </SmartTickerDraggable>
      )
    })

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
    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} direction='right'>
          Test
        </SmartTickerDraggable>
      )
    })

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
    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} direction='right' infiniteScrollView={false}>
          Test
        </SmartTickerDraggable>
      )
    })

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
    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} direction='left'>
          Test
        </SmartTickerDraggable>
      )
    })

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
    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} direction='top'>
          Test
        </SmartTickerDraggable>
      )
    })

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
    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} direction='bottom'>
          Test
        </SmartTickerDraggable>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 100))

    const curPos = Number(wrapper.style.top.replace('px', ''))

    fireEvent.mouseDown(wrapper, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(wrapper, { clientX: 0, clientY: -20 })

    await new Promise((r) => setTimeout(r, 100))

    fireEvent.mouseUp(wrapper)
    expect(Number(wrapper.style.top.replace('px', ''))).toBe(curPos - 20)
  })

  test("doesn't reset its position on window resize", async () => {
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

    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} direction='left'>
          Test
        </SmartTickerDraggable>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 500))

    await waitFor(async () => {
      window.dispatchEvent(new Event('resize'))
    })

    const curPos = Math.abs(Number(wrapper.style.left.replace('px', '')))

    await waitFor(async () => new Promise((r) => setTimeout(r, 250)))

    expect(Math.abs(Number(wrapper.style.left.replace('px', '')))).toBeGreaterThan(curPos)
  })
})
