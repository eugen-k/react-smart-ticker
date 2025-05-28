/// <reference

import React, { act, ReactNode, useRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { SmartTickerDraggable } from '.'
import { fireEvent, waitFor } from '@testing-library/dom'
import { SmartTickerDraggableProps } from '../../types/smartTickerTypes'

// Helper function to get transform position
function getTransformPosition(element: HTMLElement): { x: number; y: number } {
  const transform = window.getComputedStyle(element).transform
  const matrix = new WebKitCSSMatrix(transform)
  return {
    x: matrix.e,
    y: matrix.f
  }
}

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
  // Mock matchMedia
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))

  // Mock WebKitCSSMatrix
  window.WebKitCSSMatrix = class WebKitCSSMatrix {
    constructor(transform: string) {
      // Initialize with identity matrix values
      this.m11 = this.a = 1
      this.m12 = this.b = 0
      this.m21 = this.c = 0
      this.m22 = this.d = 1
      this.m41 = this.e = 0
      this.m42 = this.f = 0

      // Parse transform if provided
      if (transform && transform !== 'none') {
        // Strip translateZ if present and get the base transform
        transform = transform.replace(/translateZ\(\d+px\)/, '').trim()

        // Handle matrix(a, b, c, d, e, f) format
        const matrixMatch = transform.match(/matrix\(([-\d.,\s]+)\)/)
        if (matrixMatch) {
          const values = matrixMatch[1].split(',').map((v) => parseFloat(v.trim()))
          if (values.length >= 6) {
            ;[this.a, this.b, this.c, this.d, this.e, this.f] = values
            ;[this.m11, this.m12, this.m21, this.m22, this.m41, this.m42] = values
          }
        }
        // Handle matrix3d format if needed
        const matrix3dMatch = transform.match(/matrix3d\(([-\d.,\s]+)\)/)
        if (matrix3dMatch) {
          const values = matrix3dMatch[1].split(',').map((v) => parseFloat(v.trim()))
          if (values.length >= 16) {
            this.m11 = values[0]
            this.m12 = values[1]
            this.m21 = values[4]
            this.m22 = values[5]
            this.m41 = values[12]
            this.m42 = values[13]
            this.a = this.m11
            this.b = this.m12
            this.c = this.m21
            this.d = this.m22
            this.e = this.m41
            this.f = this.m42
          }
        }
        // Handle translate3d and translate
        const translate3dMatch = transform.match(/translate3d\(([-\d.px%,\s]+)\)/)
        if (translate3dMatch) {
          const values = translate3dMatch[1].split(',').map((v) => parseFloat(v))
          this.e = this.m41 = values[0] || 0
          this.f = this.m42 = values[1] || 0
        }
      }
    }

    // 2D properties
    a: number
    b: number
    c: number
    d: number
    e: number
    f: number
    // 3D properties
    m11: number
    m12: number
    m21: number
    m22: number
    m41: number
    m42: number

    static fromFloat32Array(): unknown {
      return new (window.WebKitCSSMatrix as typeof window.WebKitCSSMatrix)('') as WebKitCSSMatrix
    }
    static fromFloat64Array(): unknown {
      return new (window.WebKitCSSMatrix as typeof window.WebKitCSSMatrix)('') as WebKitCSSMatrix
    }
    static fromMatrix(): WebKitCSSMatrix {
      return new (window.WebKitCSSMatrix as typeof window.WebKitCSSMatrix)('') as WebKitCSSMatrix
    }
  } as unknown as typeof window.WebKitCSSMatrix

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
  cleanup() // Remove the rendered DOM
  jest.clearAllMocks()
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

    expect(getTransformPosition(wrapper).x).toBeLessThan(0)
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

    const curPos = getTransformPosition(wrapper).x

    fireEvent.mouseOver(container)

    expect(getTransformPosition(wrapper).x).toBe(curPos)
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

    expect(getTransformPosition(wrapper).x).toBeGreaterThan(0)
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

    expect(getTransformPosition(wrapper).x).toBeGreaterThan(0)
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

    expect(getTransformPosition(wrapper).x).toBeGreaterThan(0)
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

    expect(getTransformPosition(wrapper).x).toBeCloseTo(0)

    await act(async () => {
      play()
    })

    await new Promise((r) => setTimeout(r, 500))

    expect(getTransformPosition(wrapper).x).toBeLessThan(0)
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

    const position = getTransformPosition(wrapper).x

    expect(position).toBeLessThan(0)

    await act(async () => {
      pause()
    })

    expect(getTransformPosition(wrapper).x).toBeCloseTo(position)
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

    const position = getTransformPosition(wrapper).x

    expect(position).toBeLessThan(0)

    await act(async () => {
      reset(true)
    })

    await new Promise((r) => setTimeout(r, 100))

    expect(getTransformPosition(wrapper).x).toBeCloseTo(0)
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

    const position = getTransformPosition(wrapper).x

    expect(position).toBeLessThan(0)

    await act(async () => {
      reset(false)
    })

    await new Promise((r) => setTimeout(r, 200))

    expect(getTransformPosition(wrapper).x).toBeLessThan(0)
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

    const position = getTransformPosition(wrapper).x

    // moving
    expect(position).toBeLessThan(0)

    await act(async () => {
      changeVisibility('hidden')
    })

    const pausedPosition = getTransformPosition(wrapper).x

    await new Promise((r) => setTimeout(r, 100))

    // paused
    expect(getTransformPosition(wrapper).x).toBe(pausedPosition)

    await act(async () => {
      changeVisibility('visible')
    })

    await new Promise((r) => setTimeout(r, 100))

    // moving
    expect(getTransformPosition(wrapper).x).toBeLessThan(pausedPosition)
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

    const curPos = getTransformPosition(wrapper).x

    fireEvent.touchStart(wrapper, { touches: [{ clientX: 0, clientY: 0 }] })
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 20, clientY: 0 }] })

    await new Promise((r) => setTimeout(r, 100))

    fireEvent.touchEnd(wrapper)
    expect(getTransformPosition(wrapper).x).toBe(curPos + 20)
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

    const curPos = getTransformPosition(wrapper).x

    fireEvent.mouseDown(wrapper, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(wrapper, { clientX: 20, clientY: 0 })

    await new Promise((r) => setTimeout(r, 100))

    fireEvent.mouseUp(wrapper)
    expect(getTransformPosition(wrapper).x).toBe(curPos + 20)
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

    expect(getTransformPosition(wrapper).x).toBeGreaterThan(0)

    fireEvent.mouseUp(wrapper)

    await new Promise((r) => setTimeout(r, 200))

    expect(getTransformPosition(wrapper).x).toBe(0)
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

    const curPos = getTransformPosition(wrapper).x

    fireEvent.mouseDown(wrapper, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(wrapper, { clientX: -20, clientY: 0 })

    await new Promise((r) => setTimeout(r, 100))

    fireEvent.mouseUp(wrapper)
    expect(getTransformPosition(wrapper).x).toBe(curPos - 20)
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

    const curPos = getTransformPosition(wrapper).y

    fireEvent.mouseDown(wrapper, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(wrapper, { clientX: 0, clientY: 20 })

    await new Promise((r) => setTimeout(r, 100))

    fireEvent.mouseUp(wrapper)
    expect(getTransformPosition(wrapper).y).toBe(curPos + 20)
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

    const curPos = getTransformPosition(wrapper).y

    fireEvent.mouseDown(wrapper, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(wrapper, { clientX: 0, clientY: -20 })

    await new Promise((r) => setTimeout(r, 100))

    fireEvent.mouseUp(wrapper)
    expect(getTransformPosition(wrapper).y).toBe(curPos - 20)
  })

  test("doesn't reset its position on window resize", async () => {
    mockGetBoundingClientRect
      .mockReturnValueOnce({ width: 200, height: 200 })
      .mockReturnValueOnce({ width: 150, height: 50 })
      .mockReturnValueOnce({ width: 150, height: 50 })
      // Add extra mock returns for resize measurements
      .mockReturnValueOnce({ width: 200, height: 200 })
      .mockReturnValueOnce({ width: 150, height: 50 })

    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} direction='left' speed={100}>
          Test
        </SmartTickerDraggable>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    // Ensure animation has started
    await new Promise((r) => setTimeout(r, 500))
    const initialPos = Math.abs(getTransformPosition(wrapper).x)

    // Trigger resize
    await act(async () => {
      window.dispatchEvent(new Event('resize'))
    })

    // Wait for measurements and animation frame
    await new Promise((r) => setTimeout(r, 100))

    const currentPos = Math.abs(getTransformPosition(wrapper).x)
    expect(currentPos).toBeGreaterThan(initialPos)
  })

  test('stops animation after 2 iterations', async () => {
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
        <SmartTickerDraggable
          smart={false}
          iterations={2}
          infiniteScrollView={false}
          speed={1000}
          speedBack={1000}
          delayBack={200}
          direction='left'
        >
          Test
        </SmartTickerDraggable>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    // Wait for the first iteration
    await new Promise((r) => setTimeout(r, 100))

    const positionAfterFirstIteration = getTransformPosition(wrapper).x

    // Wait for the second iteration
    await new Promise((r) => setTimeout(r, 700))

    const positionAfterSecondIteration = getTransformPosition(wrapper).x

    expect(positionAfterFirstIteration).toBeLessThan(0) // Ensure it moved
    expect(positionAfterSecondIteration).toBe(0) // Ensure it stops after 2 iterations
  })

  test('does not start animation when iterations is set to 0', async () => {
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
        <SmartTickerDraggable
          smart={false}
          iterations={0}
          infiniteScrollView={false}
          direction='left'
        >
          Test
        </SmartTickerDraggable>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    await new Promise((r) => setTimeout(r, 500))

    expect(getTransformPosition(wrapper).x).toBe(0) // Ensure no movement
  })

  test('disables dragging when disableDragging is true', async () => {
    await act(async () => {
      render(
        <SmartTickerDraggable smart={false} disableDragging direction='left'>
          Test
        </SmartTickerDraggable>
      )
    })

    const wrapper = screen.getByTestId('ticker-wrapper')

    fireEvent.mouseDown(wrapper, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(wrapper, { clientX: 20, clientY: 0 })
    fireEvent.mouseUp(wrapper)

    expect(getTransformPosition(wrapper).x).toBe(0) // Ensure no dragging occurred
  })
})
