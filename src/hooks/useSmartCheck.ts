import { ReactNode, useRef, useState, useLayoutEffect, RefObject, useEffect } from 'react'
import { Directions, ElRect } from '../types/smartTickerTypes'

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
  containerRef: RefObject<HTMLDivElement>
  tickerRef: RefObject<HTMLDivElement>
  containerRect: ElRect
  tickerRect: ElRect
  isChildFit: boolean
  duration: number
  amountToFill: number
  isCalculated: boolean
  reset: () => void
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

  const [containerRect, setContainerRect] = useState<ElRect>({ width: 0, height: 0 })
  const [tickerRect, setTickerRect] = useState<ElRect>({ width: 0, height: 0 })
  const [duration, setDuration] = useState(0)
  const [amountToFill, setAmountToFill] = useState(1)
  const [isChildFit, setIsChildFit] = useState(true)
  const [isCalculated, setIsCalculated] = useState(false)
  const [recalc, setRecalc] = useState(new Date().getTime())

  useLayoutEffect(() => {
    if (waitForFonts) {
      // will be resolved immediately if mounted inside a ready document
      document.fonts.ready.then(() => {
        smartCheck()
      })
    } else {
      smartCheck()
    }
  }, [recalc])

  useEffect(() => {
    // prevent reset while the initial component loading
    if (isCalculated) {
      reset()
    }
  }, [children, smart, autoFill, multiLine, speed, direction, infiniteScrollView, ...recalcDeps])

  const reset = () => {
    setAmountToFill(1)
    setIsChildFit(true)
    setDuration(0)
    setIsCalculated(false)
    setRecalc(new Date().getTime())
  }

  const smartCheck = () => {
    if (tickerRef.current && containerRef.current) {
      // save the original styles
      const {
        display: mDisplay,
        minWidth: mMinWidth,
        minHeight: mMinHeight,
        maxWidth: mMaxWidth,
        maxHeight: mMaxHeight,
        whiteSpace: mWhiteSpace,
        overflow: mOverflow
      } = tickerRef.current.style

      const {
        width: cWidth,
        height: cHeight,
        maxWidth: cMaxWidth,
        maxHeight: cMaxHeight,
        overflow: cOverflow,
        display: cDisplay
      } = containerRef.current.style

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

      let _isChildFit: boolean = autoFill ? false : true

      switch (axis) {
        case 'x': {
          const amountToFill =
            autoFill && Math.round(tickerWidth) !== Math.round(containerWidth)
              ? Math.ceil(containerWidth / tickerWidth)
              : 1

          setAmountToFill(amountToFill)

          if (Math.round(tickerWidth) > Math.round(containerWidth) || autoFill) {
            _isChildFit = false
          }

          if (amountToFill > 1) {
            tickerWidth = tickerWidth * amountToFill
          }

          if (_isChildFit) {
            tickerWidth = containerWidth
          }

          setDuration(Math.max(tickerWidth, containerWidth) / speed)
          break
        }
        case 'y': {
          const amountToFill =
            autoFill && Math.round(tickerHeight) !== Math.round(containerHeight)
              ? Math.ceil(containerHeight / tickerHeight)
              : 1

          setAmountToFill(amountToFill)

          if (Math.round(tickerHeight) > Math.round(containerHeight) || autoFill) {
            _isChildFit = false
          }

          /* if (_isChildFit && amountToFill === 1) {
            containerHeight = Math.min(tickerHeight, containerHeight)
            } */

          if (amountToFill > 1) {
            tickerHeight = tickerHeight * amountToFill
          }

          if (_isChildFit) {
            tickerHeight = containerHeight
          }

          setDuration(Math.max(tickerHeight, containerHeight) / speed)
          break
        }
      }

      setContainerRect({ height: containerHeight, width: containerWidth })
      setTickerRect({ height: tickerHeight, width: tickerWidth })

      setIsChildFit(_isChildFit)
      setIsCalculated(true)
    }
  }

  return {
    containerRef,
    tickerRef,
    containerRect,
    tickerRect,
    isChildFit,
    duration,
    amountToFill,
    isCalculated,
    reset
  }
}
