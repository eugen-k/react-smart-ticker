import {
  ForwardedRef,
  MouseEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { Animation, AnimationKey } from '../helpers/animation'
import { Directions, ElRect, Iterations, SmartTickerHandle } from '../types/smartTickerTypes'

type UseTickerAnimationHookParams = {
  isCalculated: boolean
  tickerRef: React.RefObject<HTMLDivElement> | null
  tickerRect: ElRect
  containerRect: ElRect
  direction: Directions
  rtl: boolean
  delay: number
  delayBack: number
  speed: number
  speedBack: number
  canBeAnimated: boolean
  iterations: Iterations
  infiniteScrollView: boolean
  playOnHover: boolean
  pauseOnHover: boolean
  onMouseDown?: () => void
  onMouseUp?: () => void
  forwardedRef?: ForwardedRef<SmartTickerHandle>
}

type UseTickerAnimationHookReturn = {
  onMouseDownHandler: (e: React.MouseEvent) => void
  onMoveHandler: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void
  onVisibilityChangeHandler: () => void
  onTouchStartHandler: (e: React.TouchEvent) => void
  onContainerHoverHandler: (hoverState: boolean) => void
  isPaused: boolean
  isAnimating: boolean
  wrapperRef: React.RefObject<HTMLDivElement> | null
  animation: Animation | null
}

export const useTickerAnimation = ({
  isCalculated,
  tickerRef,
  tickerRect,
  containerRect,
  delay,
  delayBack,
  speed,
  speedBack,
  direction,
  rtl,
  infiniteScrollView,
  iterations,
  playOnHover,
  pauseOnHover,
  canBeAnimated,
  onMouseDown,
  onMouseUp,
  forwardedRef
}: UseTickerAnimationHookParams): UseTickerAnimationHookReturn => {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
  //const sideX = rtl ? 'right' : 'left'

  const animationRef = useRef(new Animation())
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [isPaused, setIsPaused] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useImperativeHandle(forwardedRef, () => ({
    play: () => {
      setIsPaused(false)
      setIsAnimating(true)
      animationRef.current.play(() => {
        setIsPaused(true)
        setIsAnimating(false)
      })
    },
    pause: () => {
      setIsPaused(true)
      animationRef.current.pause()
    },
    reset: (isPaused = true) => {
      setIsPaused(false)
      setIsAnimating(true)
      animationRef.current.backToStartPosition(isPaused, () => {
        setIsPaused(isPaused)
        if (isPaused) {
          setIsAnimating(false)
        }
      })
    }
  }))

  let dragListener: EventListener
  let touchListener: EventListener
  let touchEndHandler: EventListener
  let mouseUpHandler: EventListener

  useEffect(() => {
    return () => {
      // Remove event listeners
      removeEventListener('mousemove', dragListener)
      removeEventListener('mouseup', mouseUpHandler as EventListener)
      removeEventListener('touchmove', touchListener)
      removeEventListener('touchend', touchEndHandler as EventListener)

      // Reset animation
      if (animationRef.current) {
        animationRef.current.backToStartPosition(
          true,
          () => {
            setIsPaused(true)
            setIsAnimating(false)
          },
          true
        )
      }
    }
  }, [])

  useLayoutEffect(() => {
    const timeoutId: NodeJS.Timeout | null = null

    if (isCalculated) {
      animationRef.current.init({
        tickerEl: tickerRef!,
        wrapperEl: wrapperRef!,
        tickerRect: tickerRect,
        containerRect: containerRect,
        infiniteScrollView,
        startPosition: 0,
        speed,
        speedBack,
        delay,
        delayBack,
        direction,
        rtl,
        iterations,
        onIterationsEnd: () => {
          if (isHovered && playOnHover) {
            animationRef.current.pause()
            // isPaused state will be updated while onMouseOut
          } else {
            setIsPaused(true)
            setIsAnimating(false)
          }
        }
      })

      if (canBeAnimated && (!playOnHover || pauseOnHover)) {
        setIsPaused(false)
        setIsAnimating(true)
        animationRef.current.play(() => {
          setIsPaused(true)
          setIsAnimating(false)
        })
      }
    }

    return () => {
      !!timeoutId && clearTimeout(timeoutId)
      setIsPaused(true)
      setIsAnimating(false)
    }
  }, [
    isCalculated,
    delay,
    delayBack,
    speed,
    speedBack,
    iterations,
    infiniteScrollView,
    direction,
    rtl,
    pauseOnHover,
    playOnHover
  ])

  useLayoutEffect(() => {
    if (isPaused) {
      if (wrapperRef.current) {
        wrapperRef.current.style.willChange = 'auto'
      }

      animationRef.current.pause()
      // reset iterationCounter if playOnHover option is true, to play the animation again once hovered
      if (playOnHover) {
        animationRef.current.setCounter(0)
      }
    } else if (canBeAnimated) {
      if (wrapperRef.current) {
        wrapperRef.current.style.willChange = 'transform'
      }
    }
  }, [isPaused, canBeAnimated])

  const onContainerHoverHandler = useCallback(
    (hovered: boolean) => {
      setIsHovered(hovered)
    },
    [playOnHover, pauseOnHover]
  )

  useEffect(() => {
    if (animationRef.current.getIsDragging()) {
      return
    }

    if (playOnHover) {
      if (isHovered) {
        setIsPaused(false)
        setIsAnimating(true)
        animationRef.current.play(() => {
          setIsPaused(true)
          setIsAnimating(false)
        }, true)
      } else {
        setIsPaused(false)
        setIsAnimating(true)
        animationRef.current.backToStartPosition(true, () => {
          setIsPaused(true)
          setIsAnimating(false)
        })
      }
    }

    if (pauseOnHover) {
      if (isHovered) {
        setIsPaused(true)
        setIsAnimating(false)
        animationRef.current.pause()
      } else {
        setIsPaused(false)
        setIsAnimating(true)
        animationRef.current.play(() => {
          setIsPaused(true)
          setIsAnimating(false)
        }, true)
      }
    }
  }, [isHovered])

  const onMoveHandler = (e: React.MouseEvent<Element> | React.TouchEvent<Element>) => {
    let oldX = (e as React.MouseEvent).clientX ?? (e as React.TouchEvent).touches[0]?.clientX
    let oldY = (e as React.MouseEvent).clientY ?? (e as React.TouchEvent).touches[0]?.clientY
    let deltaX = 0
    let deltaY = 0

    // Calculate min/max positions for bounds checking
    const minPos: { [Property in typeof axis]: { [Property in Directions]?: number } } = {
      y: {
        top: -(tickerRect.height - containerRect.height),
        bottom: 0
      },
      x: {
        left: -(tickerRect.width - containerRect.width),
        right: 0
      }
    }

    const maxPos: { [Property in typeof axis]: { [Property in Directions]?: number } } = {
      y: {
        top: 0,
        bottom: tickerRect.height - containerRect.height
      },
      x: {
        left: 0,
        right: tickerRect.width - containerRect.width
      }
    }

    const handleMove = (e: Event) => {
      if (!wrapperRef.current) return

      const event = e as MouseEvent | TouchEvent

      // Get current coordinates
      const newX = (event as MouseEvent).clientX ?? (event as TouchEvent).touches?.[0]?.clientX ?? 0
      const newY = (event as MouseEvent).clientY ?? (event as TouchEvent).touches?.[0]?.clientY ?? 0

      // Calculate movement deltas
      deltaX = oldX - newX
      deltaY = oldY - newY

      // Update reference positions for next move
      oldX = newX
      oldY = newY

      requestAnimationFrame(() => {
        if (!wrapperRef.current) return

        // Get current transform matrix
        const transform = window.getComputedStyle(wrapperRef.current).transform
        const matrix = new WebKitCSSMatrix(
          transform === 'none' ? 'matrix(1, 0, 0, 1, 0, 0)' : transform
        )
        const currentX = matrix.e || 0
        const currentY = matrix.f || 0

        // Calculate new position
        let newX = axis === 'x' ? currentX - deltaX : currentX
        let newY = axis === 'y' ? currentY - deltaY : currentY

        if (infiniteScrollView) {
          // Let alignPosition handle wrapping for infinite scroll
          wrapperRef.current.style.transform = `matrix(1, 0, 0, 1, ${newX}, ${newY}) translateZ(0)`
          animationRef.current.alignPosition(AnimationKey.Dragging)
        } else {
          // Apply bounds for non-infinite scroll
          const minBound = minPos[axis][direction]!
          const maxBound = maxPos[axis][direction]!

          // Apply resistance when dragging beyond bounds
          if (
            (axis === 'x' && (newX < minBound || newX > maxBound)) ||
            (axis === 'y' && (newY < minBound || newY > maxBound))
          ) {
            deltaX = deltaX / 70 // Increased resistance for smoother edge behavior
            deltaY = deltaY / 70
            newX = axis === 'x' ? currentX - deltaX : currentX
            newY = axis === 'y' ? currentY - deltaY : currentY
          }

          // Apply transform with GPU acceleration
          wrapperRef.current.style.transform = `matrix(1, 0, 0, 1, ${newX}, ${newY}) translateZ(0)`
        }
      })
    }

    return handleMove
  }

  const onMouseDownHandler = (e: React.MouseEvent) => {
    if (typeof onMouseDown === 'function') {
      onMouseDown()
    }

    e.preventDefault()

    animationRef.current.setIsDragging(true)

    if (wrapperRef.current) {
      wrapperRef.current.style.willChange = 'transform'
    }

    dragListener = onMoveHandler(e)
    addEventListener('mousemove', dragListener)

    addEventListener(
      'mouseup',
      (mouseUpHandler = (e: Event) => {
        e.preventDefault()

        if (typeof onMouseUp === 'function') {
          onMouseUp()
        }

        if (wrapperRef.current) {
          wrapperRef.current.style.willChange = 'auto'
        }

        animationRef.current.setIsDragging(false)

        if (
          canBeAnimated &&
          !playOnHover &&
          (iterations === 'infinite' || animationRef.current.getCounter() < iterations)
        ) {
          setIsPaused(false)
          setIsAnimating(true)
          animationRef.current.play(() => {
            setIsPaused(true)
            setIsAnimating(false)
          })
        } else {
          setIsPaused(false)
          setIsAnimating(true)
          animationRef.current.backToStartPosition(true, () => {
            setIsPaused(true)
            setIsAnimating(false)
          })
        }

        removeEventListener('mousemove', dragListener)
        removeEventListener('mouseup', mouseUpHandler)
      })
    )
  }

  const onTouchStartHandler = (e: React.TouchEvent) => {
    if (typeof onMouseDown === 'function') {
      onMouseDown()
    }

    animationRef.current.setIsDragging(true)

    if (wrapperRef.current) {
      wrapperRef.current.style.willChange = axis === 'x' ? 'left' : 'top'
    }

    touchListener = onMoveHandler(e)
    addEventListener('touchmove', touchListener)

    addEventListener(
      'touchend',
      (touchEndHandler = (e: Event) => {
        e.preventDefault()

        if (typeof onMouseUp === 'function') {
          onMouseUp()
        }

        if (wrapperRef.current) {
          wrapperRef.current.style.willChange = 'auto'
        }

        animationRef.current.setIsDragging(false)

        if (
          canBeAnimated &&
          !playOnHover &&
          (iterations === 'infinite' || animationRef.current.getCounter() < iterations)
        ) {
          setIsPaused(false)
          setIsAnimating(true)
          animationRef.current.play(() => {
            setIsPaused(true)
            setIsAnimating(false)
          })
        } else {
          setIsPaused(false)
          setIsAnimating(true)
          animationRef.current.backToStartPosition(true, () => {
            setIsPaused(true)
            setIsAnimating(false)
          })
        }

        removeEventListener('touchmove', touchListener)
        removeEventListener('touchend', touchEndHandler)
      })
    )
  }

  const onVisibilityChangeHandler = () => {
    if (document.visibilityState === 'hidden') {
      animationRef.current.toggleByVisibility()
    } else if (document.visibilityState === 'visible') {
      animationRef.current.toggleByVisibility()
    }
  }

  return {
    onMouseDownHandler,
    onMoveHandler,
    onVisibilityChangeHandler,
    onTouchStartHandler,
    onContainerHoverHandler,
    isPaused,
    isAnimating,
    wrapperRef,
    animation: animationRef.current
  }
}
