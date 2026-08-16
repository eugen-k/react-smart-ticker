import { ReactNode, useRef, useState, useLayoutEffect, RefObject, useEffect } from 'react'
import { Directions, ElRect } from '../types/smartTickerTypes'
import { areChildrenEqual } from '../helpers/areChildrenEqual'

type Props = {
  children: ReactNode
  smart: boolean
  direction: Directions
  multiLine: number
  infiniteScrollView: boolean
  autoFill: boolean
  speed: number
  waitForFonts: boolean
  recalcDeps?: unknown[]
}

type UseSmartCheckHook = (args: Props) => {
  containerRef: RefObject<HTMLDivElement | null>
  tickerRef: RefObject<HTMLDivElement | null>
  containerRect: ElRect
  tickerRect: ElRect
  isChildFit: boolean
  duration: number
  amountToFill: number
  isCalculated: boolean
  recalc: () => void
}

export const useSmartCheck: UseSmartCheckHook = ({
  direction,
  multiLine,
  autoFill,
  speed,
  children,
  infiniteScrollView,
  smart,
  waitForFonts,
  recalcDeps = []
}) => {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'

  const containerRef = useRef<HTMLDivElement>(null)
  const tickerRef = useRef<HTMLDivElement>(null)
  const prevChildrenRef = useRef<ReactNode>(children)
  const prevDepsRef = useRef<unknown[]>(recalcDeps)
  const isCheckingRef = useRef(false)
  const prevPropsRef = useRef({
    smart,
    autoFill,
    multiLine,
    speed,
    direction,
    infiniteScrollView
  })

  const [containerRect, setContainerRect] = useState<ElRect>({ width: 0, height: 0 })
  const [tickerRect, setTickerRect] = useState<ElRect>({ width: 0, height: 0 })
  const [duration, setDuration] = useState(0)
  const [amountToFill, setAmountToFill] = useState(1)
  const [isChildFit, setIsChildFit] = useState(true)
  const [isCalculated, setIsCalculated] = useState(false)
  const [recalcToken, setRecalcToken] = useState(0)

  const recalc = () => {
    setRecalcToken((prev) => prev + 1)
  }

  const smartCheck = () => {
    if (isCheckingRef.current) return
    if (tickerRef.current && containerRef.current) {
      isCheckingRef.current = true
      try {
        // save the original styles
        const {
          display: mDisplay,
          minWidth: mMinWidth,
          minHeight: mMinHeight,
          maxWidth: mMaxWidth,
          maxHeight: mMaxHeight,
          whiteSpace: mWhiteSpace,
          overflow: mOverflow,
          transform: mTransform,
          willChange: mWillChange
        } = tickerRef.current.style

        const {
          width: cWidth,
          height: cHeight,
          maxWidth: cMaxWidth,
          maxHeight: cMaxHeight,
          overflow: cOverflow,
          display: cDisplay,
          transform: cTransform
        } = containerRef.current.style

        // Set measurement styles
        tickerRef.current.style.transform = 'none'
        tickerRef.current.style.willChange = 'transform'
        tickerRef.current.style.display = 'inline-flex'
        tickerRef.current.style.minWidth = 'auto'
        tickerRef.current.style.minHeight = 'auto'
        tickerRef.current.style.maxWidth = 'unset'
        tickerRef.current.style.maxHeight = 'unset'
        containerRef.current.style.display = 'inline-flex'
        containerRef.current.style.maxWidth = '100%'
        containerRef.current.style.maxHeight = '100%'

        if (autoFill) {
          containerRef.current.style.height = '100%'
          containerRef.current.style.width = '100%'
        }

        containerRef.current.style.overflow = 'hidden'
        tickerRef.current.style.overflow = 'visible'

        // Get measurements
        let { width: containerWidth, height: containerHeight } =
          containerRef.current.getBoundingClientRect()
        let { width: tickerWidth, height: tickerHeight } = tickerRef.current.getBoundingClientRect()

        // get a line height if the content is text
        let lineHeight = 0
        if (multiLine) {
          tickerRef.current.style.whiteSpace = 'nowrap'
          const { height } = tickerRef.current.getBoundingClientRect()
          lineHeight = height
          tickerRef.current.style.whiteSpace = mWhiteSpace
        }

        containerWidth = Math.min(containerWidth, document.documentElement.clientWidth)
        containerHeight = Math.min(containerHeight, document.documentElement.clientHeight)

        if (multiLine) {
          containerHeight = Math.min(lineHeight * multiLine, containerHeight)
        }

        // reset styles back
        tickerRef.current.style.display = mDisplay
        tickerRef.current.style.minWidth = mMinWidth
        tickerRef.current.style.minHeight = mMinHeight
        tickerRef.current.style.maxWidth = mMaxWidth
        tickerRef.current.style.maxHeight = mMaxHeight
        containerRef.current.style.maxWidth = cMaxWidth
        containerRef.current.style.maxHeight = cMaxHeight
        containerRef.current.style.height = cHeight
        containerRef.current.style.width = cWidth
        containerRef.current.style.overflow = cOverflow
        containerRef.current.style.display = cDisplay
        tickerRef.current.style.overflow = mOverflow
        tickerRef.current.style.whiteSpace = mWhiteSpace
        tickerRef.current.style.transform = mTransform
        tickerRef.current.style.willChange = mWillChange
        containerRef.current.style.transform = cTransform

        // Continue with calculations
        let _isChildFit: boolean = autoFill ? false : true
        let _amountToFill = 1
        let _duration = 0

        switch (axis) {
          case 'x': {
            _amountToFill =
              autoFill && Math.round(tickerWidth) !== Math.round(containerWidth)
                ? Math.ceil(containerWidth / tickerWidth)
                : 1

            if (Math.round(tickerWidth) > Math.round(containerWidth) || autoFill) {
              _isChildFit = false
            }

            if (_amountToFill > 1) {
              tickerWidth = tickerWidth * _amountToFill
            }

            if (_isChildFit) {
              tickerWidth = containerWidth
            }

            _duration = Math.max(tickerWidth, containerWidth) / speed
            break
          }
          case 'y': {
            _amountToFill =
              autoFill && Math.round(tickerHeight) !== Math.round(containerHeight)
                ? Math.ceil(containerHeight / tickerHeight)
                : 1

            if (Math.round(tickerHeight) > Math.round(containerHeight) || autoFill) {
              _isChildFit = false
            }

            if (_amountToFill > 1) {
              tickerHeight = tickerHeight * _amountToFill
            }

            if (_isChildFit) {
              tickerHeight = containerHeight
            }

            _duration = Math.max(tickerHeight, containerHeight) / speed
            break
          }
        }

        setAmountToFill((prev) => (prev === _amountToFill ? prev : _amountToFill))
        setContainerRect((prev) =>
          prev.width === containerWidth && prev.height === containerHeight
            ? prev
            : { height: containerHeight, width: containerWidth }
        )
        setTickerRect((prev) =>
          prev.width === tickerWidth && prev.height === tickerHeight
            ? prev
            : { height: tickerHeight, width: tickerWidth }
        )
        setIsChildFit((prev) => (prev === _isChildFit ? prev : _isChildFit))
        setDuration((prev) => (prev === _duration ? prev : _duration))
        setIsCalculated(true)
      } finally {
        isCheckingRef.current = false
      }
    }
  }

  useLayoutEffect(() => {
    if (waitForFonts) {
      // will be resolved immediately if mounted inside a ready document
      document.fonts.ready.then(() => {
        smartCheck()
      })
    } else {
      smartCheck()
    }
  }, [recalcToken])

  useEffect(() => {
    // Only check for updates after initial calculation has succeeded
    if (!isCalculated) return

    const childrenChanged = !areChildrenEqual(prevChildrenRef.current, children)
    if (childrenChanged) {
      prevChildrenRef.current = children
    }

    const depsChanged =
      recalcDeps.length !== prevDepsRef.current.length ||
      recalcDeps.some((dep, i) => dep !== prevDepsRef.current[i])
    if (depsChanged) {
      prevDepsRef.current = recalcDeps
    }

    const prevProps = prevPropsRef.current
    const propsChanged =
      prevProps.smart !== smart ||
      prevProps.autoFill !== autoFill ||
      prevProps.multiLine !== multiLine ||
      prevProps.speed !== speed ||
      prevProps.direction !== direction ||
      prevProps.infiniteScrollView !== infiniteScrollView

    if (propsChanged) {
      prevPropsRef.current = {
        smart,
        autoFill,
        multiLine,
        speed,
        direction,
        infiniteScrollView
      }
    }

    if (childrenChanged || depsChanged || propsChanged) {
      recalc()
    }
  }, [children, smart, autoFill, multiLine, speed, direction, infiniteScrollView, recalcDeps])

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const containerEl = containerRef.current
    const tickerEl = tickerRef.current
    if (!containerEl || !tickerEl) return

    let animationFrameId: number | null = null
    const observer = new ResizeObserver(() => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(() => {
        smartCheck()
      })
    })

    observer.observe(containerEl)
    observer.observe(tickerEl)

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      observer.disconnect()
    }
  }, [isCalculated])

  return {
    containerRef,
    tickerRef,
    containerRect,
    tickerRect,
    isChildFit,
    duration,
    amountToFill,
    isCalculated,
    recalc
  }
}
