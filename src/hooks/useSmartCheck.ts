import { ReactNode, useRef, useState, useLayoutEffect, RefObject, useEffect } from 'react'
import { ElRect } from '../types/smartTickerTypes'

type Props = {
  children: ReactNode
  smart: boolean
  axis: 'x' | 'y'
  multiLine: number
  infiniteScrollView: boolean
  autoFill: boolean
  speed: number
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
  axis,
  multiLine,
  autoFill,
  speed,
  children,
  smart,
  recalcDeps = []
}) => {
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
    smartCheck()
  }, [recalc])

  useEffect(() => {
    // prevent reset while the initial component loading
    if (isCalculated) {
      reset()
    }
  }, [children, smart, autoFill, ...recalcDeps])

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
        minWidth: mMinWidth,
        minHeight: mMinHeight,
        whiteSpace: mWhiteSpace,
        overflow: mOverflow
      } = tickerRef.current.style

      const {
        width: cWidth,
        height: cHeight,
        maxWidth: cMaxWidth,
        maxHeight: cMaxHeight,
        overflow: cOverflow
      } = containerRef.current.style

      tickerRef.current.style.minWidth = 'auto'
      tickerRef.current.style.minHeight = 'auto'
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
      tickerRef.current.style.minWidth = mMinWidth
      tickerRef.current.style.minHeight = mMinHeight
      containerRef.current.style.maxWidth = cMaxWidth
      containerRef.current.style.maxHeight = cMaxHeight
      containerRef.current.style.height = cHeight
      containerRef.current.style.width = cWidth
      containerRef.current.style.overflow = cOverflow
      tickerRef.current.style.overflow = mOverflow
      tickerRef.current.style.whiteSpace = mWhiteSpace

      let _isChildFit: boolean = true

      switch (axis) {
        case 'x': {
          if (Math.round(tickerWidth) > Math.round(containerWidth)) {
            _isChildFit = false
          }

          const amountToFill =
            autoFill && Math.round(tickerWidth) !== Math.round(containerWidth)
              ? Math.ceil(containerWidth / tickerWidth)
              : 1

          setAmountToFill(amountToFill)

          if (amountToFill > 1) {
            tickerWidth = tickerWidth * amountToFill
          } else if (_isChildFit) {
            tickerWidth = containerWidth
          }

          setDuration(Math.max(tickerWidth, containerWidth) / speed)
          break
        }
        case 'y': {
          if (Math.round(tickerHeight) > Math.round(containerHeight)) {
            _isChildFit = false
          }

          const amountToFill =
            autoFill && Math.round(tickerHeight) !== Math.round(containerHeight)
              ? Math.ceil(containerHeight / tickerHeight)
              : 1
          setAmountToFill(amountToFill)

          if (_isChildFit && amountToFill === 1) {
            containerHeight = Math.min(tickerHeight, containerHeight)
          }

          if (amountToFill > 1) {
            tickerHeight = tickerHeight * amountToFill
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
