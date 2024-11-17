/// <reference

import React, { act, ReactNode, RefObject, useRef } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SmartTicker from '.'
import '@testing-library/jest-dom'
import { SmartTickerProps } from '../../types/smartTickerTypes'
import { jest } from '@jest/globals'
import * as smartCheckHook from '../../hooks/useSmartCheck'

// A helper component to facilitate testing with refs
const SmartTickerWithControl = ({
  play,
  pause,
  reset,
  children,
  ...props
}: SmartTickerProps & {
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

  return <SmartTicker {...{ ...props, forwardedRef: tickerRef }}>{children}</SmartTicker>
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
    .mockReset()
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

afterAll(() => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: window.innerWidth
  })
})

describe('SmartTicker', () => {
  test('renders with 1 element with the smart mode on (by default)', async () => {
    await act(async () => {
      render(<SmartTicker>Test</SmartTicker>)
    })
    const elements = screen.getAllByText(/Test/i)

    expect(elements).toHaveLength(1)
  })

  test('renders with 2 elements when the smart mode is off', async () => {
    await act(async () => {
      render(<SmartTicker smart={false}>Test</SmartTicker>)
    })
    const elements = screen.getAllByText(/Test/i)
    expect(elements).toHaveLength(2)
  })

  test('renders with 1 elements when the smart mode is off and infiniteScrollView option is off', async () => {
    await act(async () => {
      render(
        <SmartTicker smart={false} infiniteScrollView={false}>
          Test
        </SmartTicker>
      )
    })

    const elements = screen.getAllByText(/Test/i)
    expect(elements).toHaveLength(1)
  })

  test('renders with autofill option', async () => {
    await act(async () => {
      render(
        <SmartTicker autoFill>
          <div style={{ width: '50px' }}>Test</div>
        </SmartTicker>
      )
    })

    const element1 = screen.getByTestId('ticker-1')
    const element2 = screen.getByTestId('ticker-2')

    expect(element1.textContent).toBe('TestTestTestTest')
    expect(element2.textContent).toBe('TestTestTestTest')
  })

  test('renders with all the CSS options', async () => {
    await act(async () => {
      render(
        <SmartTicker
          delay={200}
          speed={100}
          iterations={3}
          rtl
          disableSelect
          style={{ lineHeight: 20, width: '200px' }}
          containerStyle={{ width: '200px' }}
        >
          Test
        </SmartTicker>
      )
    })

    const ticker = screen.getByTestId('ticker-1')
    const container = screen.getByTestId('ticker-container')
    expect(ticker).toHaveStyle({ 'animation-delay': '0.2s' })
    expect(ticker).toHaveStyle({ 'animation-iteration-count': 3 })
    expect(ticker).toHaveStyle({ direction: 'rtl' })
    expect(ticker).toHaveStyle({ 'animation-duration': '2s' }) // 200px (width) / 100px (speed)
    expect(ticker).toHaveStyle({ 'line-height': 20 })
    expect(ticker).toHaveStyle({ 'user-select': 'none' })
    expect(container).toHaveStyle({ width: '200px' })
  })

  test('renders in y-axis and fill it with text', async () => {
    await act(async () => {
      render(
        <SmartTicker direction='top' autoFill>
          <div style={{ height: '50px' }}>Test</div>
        </SmartTicker>
      )
    })

    const ticker = screen.getByTestId('ticker-1')
    const container = screen.getByTestId('ticker-container')

    expect(container).toHaveStyle({ 'max-height': '200px' })
    expect(ticker).toHaveStyle({ 'min-height': '200px' })
    expect(ticker.textContent).toBe('TestTestTestTest')
  })

  test('renders in x-axis with long text and and shows ellipses', async () => {
    mockGetBoundingClientRect
      .mockReset()
      // container rect
      .mockReturnValueOnce({
        width: 200,
        height: 200
      })
      // ticker rect
      // make child not fitted
      .mockReturnValueOnce({
        width: 250,
        height: 50
      })

    await act(async () => {
      render(
        <SmartTicker isText playOnHover>
          <div style={{ width: '250px' }}>Test</div>
        </SmartTicker>
      )
    })

    const ticker = screen.getByTestId('ticker-1')

    expect(ticker).toHaveStyle({ 'text-overflow': 'ellipsis' })
  })

  test('renders in y-axis with child not fitted and and shows ellipses', async () => {
    mockGetBoundingClientRect
      .mockReset()
      // container rect
      .mockReturnValueOnce({
        width: 200,
        height: 200
      })
      // ticker rect
      // make child not fitted
      .mockReturnValueOnce({
        width: 50,
        height: 250
      })
      //line height
      .mockReturnValueOnce({
        height: 20
      })

    await act(async () => {
      render(
        <SmartTicker isText multiLine={3} playOnHover>
          <div style={{ width: '250px' }}>Test</div>
        </SmartTicker>
      )
    })

    const ticker = screen.getByTestId('ticker-1')
    const container = screen.getByTestId('ticker-container')

    expect(ticker).toHaveStyle({ 'max-height': '60px' })
    expect(container).toHaveStyle({ 'max-height': '60px' })
  })

  test('renders in y-axis with multilines when child fitted so containers and tickers height are equal', async () => {
    mockGetBoundingClientRect
      .mockReset()
      // container rect
      .mockReturnValueOnce({
        width: 200,
        height: 100
      })
      // ticker rect
      // make child not fitted
      .mockReturnValueOnce({
        width: 50,
        height: 100
      })
      //line height
      .mockReturnValueOnce({
        height: 50
      })

    await act(async () => {
      render(
        <SmartTicker isText multiLine={3} playOnHover>
          <div style={{ width: '250px' }}>Test</div>
        </SmartTicker>
      )
    })

    const ticker = screen.getByTestId('ticker-1')
    const container = screen.getByTestId('ticker-container')

    expect(ticker.style.minHeight).toEqual(container.style.maxHeight)
  })

  test('start playing and then pause on hover', async () => {
    await act(async () => {
      render(
        <SmartTicker smart={false} pauseOnHover>
          Test
        </SmartTicker>
      )
    })
    const element = screen.getByTestId('ticker-1')
    const container = screen.getByTestId('ticker-container')
    expect(element).toHaveStyle({ 'animation-play-state': 'running' })
    fireEvent.mouseOver(container)
    expect(element).toHaveStyle({ 'animation-play-state': 'paused' })
  })

  test('start playing and then pause on click', async () => {
    await act(async () => {
      render(
        <SmartTicker smart={false} pauseOnClick>
          Test
        </SmartTicker>
      )
    })

    const element = screen.getByTestId('ticker-1')
    const container = screen.getByTestId('ticker-container')
    expect(element).toHaveStyle({ 'animation-play-state': 'running' })
    fireEvent.mouseDown(container)
    expect(element).toHaveStyle({ 'animation-play-state': 'paused' })
  })

  test('plays on click', async () => {
    await act(async () => {
      render(
        <SmartTicker smart={false} playOnClick>
          Test
        </SmartTicker>
      )
    })

    const element = screen.getByTestId('ticker-1')
    const container = screen.getByTestId('ticker-container')
    expect(element).toHaveStyle({ 'animation-play-state': 'paused' })
    fireEvent.mouseDown(container)
    expect(element).toHaveStyle({ 'animation-play-state': 'running' })
    fireEvent.mouseUp(container)
    expect(element).toHaveStyle({ 'animation-play-state': 'paused' })
  })

  test('plays on touch', async () => {
    await act(async () => {
      render(
        <SmartTicker smart={false} playOnClick>
          Test
        </SmartTicker>
      )
    })

    const element = screen.getByTestId('ticker-1')
    const container = screen.getByTestId('ticker-container')
    expect(element).toHaveStyle({ 'animation-play-state': 'paused' })
    fireEvent.touchStart(container)
    expect(element).toHaveStyle({ 'animation-play-state': 'running' })
    fireEvent.touchEnd(container)
    expect(element).toHaveStyle({ 'animation-play-state': 'paused' })
  })

  test('plays on hover', async () => {
    await act(async () => {
      render(
        <SmartTicker smart={false} playOnHover>
          Test
        </SmartTicker>
      )
    })

    const element = screen.getByTestId('ticker-1')
    const container = screen.getByTestId('ticker-container')
    expect(element).toHaveStyle({ 'animation-play-state': 'paused' })
    fireEvent.mouseOver(container)
    expect(element).toHaveStyle({ 'animation-play-state': 'running' })
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
          playOnClick
        >
          Test
        </SmartTickerWithControl>
      )
    })

    const element = screen.getByTestId('ticker-1')
    expect(element).toHaveStyle({ 'animation-play-state': 'paused' })
    await act(async () => {
      play()
    })
    expect(element).toHaveStyle({ 'animation-play-state': 'running' })
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
          pauseOnClick
          autoFill
        >
          Test
        </SmartTickerWithControl>
      )
    })

    const element = screen.getByTestId('ticker-1')
    expect(element).toHaveStyle({ 'animation-play-state': 'running' })
    await act(async () => {
      pause()
    })
    expect(element).toHaveStyle({ 'animation-play-state': 'paused' })
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
          pauseOnClick
          autoFill
        >
          Test
        </SmartTickerWithControl>
      )
    })

    const element = screen.getByTestId('ticker-1')
    expect(element).toHaveStyle({ 'animation-play-state': 'running' })
    await act(async () => {
      reset(true)
    })
    expect(element).toHaveStyle({ 'animation-play-state': 'paused' })
  })

  test('resets with playing on reset action', async () => {
    let reset: (isPaused: boolean) => void

    await act(async () => {
      render(
        <SmartTickerWithControl
          reset={(resetFunc) => {
            reset = resetFunc
          }}
          smart={false}
          pauseOnClick
          autoFill
        >
          Test
        </SmartTickerWithControl>
      )
    })

    const element = screen.getByTestId('ticker-1')
    expect(element).toHaveStyle({ 'animation-play-state': 'running' })
    await act(async () => {
      reset(false)
    })
    expect(element).toHaveStyle({ 'animation-play-state': 'running' })
  })

  test('resets position on window resize', async () => {
    jest.resetModules()
    //jest.useFakeTimers()

    const mockRecalc = jest.fn()

    const defaultHookMock = {
      containerRef: {
        current: { getBoundingClientRect: jest.fn(() => ({ width: 500, height: 50 })) }
      } as unknown as RefObject<HTMLDivElement>,
      tickerRef: {
        current: { getBoundingClientRect: jest.fn(() => ({ width: 300, height: 50 })) }
      } as unknown as RefObject<HTMLDivElement>,
      containerRect: { height: 500, width: 500 },
      tickerRect: { height: 200, width: 200 },
      isChildFit: true,
      duration: 50,
      amountToFill: 1,
      isCalculated: true,
      recalc: mockRecalc
    }

    jest.spyOn(smartCheckHook, 'useSmartCheck').mockReturnValue(defaultHookMock)

    await act(async () => {
      render(
        <SmartTicker smart={false} playOnHover>
          Test
        </SmartTicker>
      )
    })

    await act(async () => {
      window.dispatchEvent(new Event('resize'))
    })

    await new Promise((r) => setTimeout(r, 300))

    expect(mockRecalc).toHaveBeenCalled()
  })
})
