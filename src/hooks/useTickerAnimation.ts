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
  let touchEndHandler: () => void
  let mouseUpHandler: () => void

  useEffect(() => {
    return () => {
      removeEventListener('mousemove', dragListener)
      removeEventListener('mouseup', mouseUpHandler)
      removeEventListener('touchmove', touchListener)
      removeEventListener('touchend', touchEndHandler)
      setIsPaused(false)
      setIsAnimating(true)
      animationRef.current.backToStartPosition(true, () => {
        setIsPaused(true)
        setIsAnimating(false)
      })
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
        play: isPaused,
        onAnimationEnd: () => {
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
        // move back to the start position if the playOnHover option is true
        animationRef.current.backToStartPosition(true, () => {
          setIsAnimating(false)
        })
      }
    } else if (canBeAnimated) {
      if (wrapperRef.current) {
        wrapperRef.current.style.willChange = axis === 'x' ? 'left' : 'top'
      }

      animationRef.current.play()
      setIsAnimating(true)
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
      } else {
        setIsPaused(true)
      }
    }

    if (pauseOnHover) {
      if (isHovered) {
        setIsPaused(true)
      } else {
        setIsPaused(false)
      }
    }
  }, [isHovered])

  const onMoveHandler = (e: React.MouseEvent<Element> | React.TouchEvent<Element>) => {
    let oldX = (e as React.MouseEvent).clientX ?? (e as React.TouchEvent).touches[0]?.clientX
    let oldY = (e as React.MouseEvent).clientY ?? (e as React.TouchEvent).touches[0]?.clientY
    let deltaX = 0
    let deltaY = 0

    // min "top" or "left" position depending on the direction
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
    // max "top" or "left" position depending on the direction
    const maxPos: { [Property in typeof axis]: { [Property in Directions]?: number } } = {
      y: { top: 0, bottom: tickerRect.height - containerRect.height },
      x: {
        left: 0,
        right: tickerRect.width - containerRect.width
      }
    }

    return (e: MouseEvent | TouchEvent) => {
      deltaX = oldX - Number((e as MouseEvent).clientX ?? (e as TouchEvent).touches[0]?.clientX)
      deltaY = oldY - Number((e as MouseEvent).clientY ?? (e as TouchEvent).touches[0]?.clientY)

      oldX = (e as MouseEvent).clientX ?? (e as TouchEvent).touches[0]?.clientX
      oldY = (e as MouseEvent).clientY ?? (e as TouchEvent).touches[0]?.clientY

      requestAnimationFrame(() => {
        if (infiniteScrollView) {
          wrapperRef.current!.style[axis === 'x' ? 'left' : 'top'] =
            Number(wrapperRef.current!.style[axis === 'x' ? 'left' : 'top'].replace('px', '')) -
            (axis === 'x' ? deltaX : deltaY) +
            'px' // update position
          animationRef.current.alignPosition(AnimationKey.Dragging)
        } else {
          const curPos = Number(
            wrapperRef.current!.style[axis === 'x' ? 'left' : 'top'].replace('px', '')
          )
          const newPos = curPos - (axis === 'x' ? deltaX : deltaY)

          if (newPos < minPos[axis][direction]! || newPos > maxPos[axis][direction]!) {
            deltaX = deltaX / 50
            deltaY = deltaY / 50
          }

          wrapperRef.current!.style[axis === 'x' ? 'left' : 'top'] =
            curPos - (axis === 'x' ? deltaX : deltaY) + 'px'
        }
      })
    }
  }

  const onMouseDownHandler = (e: React.MouseEvent) => {
    if (typeof onMouseDown === 'function') {
      onMouseDown()
    }

    e.preventDefault()

    animationRef.current.setIsDragging(true)

    if (wrapperRef.current) {
      wrapperRef.current.style.willChange = axis === 'x' ? 'left' : 'top'
    }

    addEventListener('mousemove', (dragListener = onMoveHandler(e) as EventListener))

    addEventListener(
      'mouseup',
      (mouseUpHandler = () => {
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
          animationRef.current.play(() => {
            setIsPaused(true)
          })
        } else {
          setIsPaused(false)
          animationRef.current.backToStartPosition(true, () => {
            setIsPaused(true)
          })
        }
        removeEventListener('mousemove', dragListener)
        removeEventListener('mouseup', mouseUpHandler)
      })
    )
  }

  const onTouchStartHandler = (e: React.TouchEvent) => {
    animationRef.current.setIsDragging(true)

    if (typeof onMouseDown === 'function') {
      onMouseDown()
    }

    if (wrapperRef.current) {
      wrapperRef.current.style.willChange = axis === 'x' ? 'left' : 'top'
    }

    addEventListener('touchmove', (touchListener = onMoveHandler(e) as EventListener))

    addEventListener(
      'touchend',
      (touchEndHandler = () => {
        animationRef.current.setIsDragging(false)

        if (typeof onMouseUp === 'function') {
          onMouseUp()
        }

        if (wrapperRef.current) {
          wrapperRef.current.style.willChange = 'auto'
        }

        if (
          canBeAnimated &&
          !playOnHover &&
          (iterations === 'infinite' || animationRef.current.getCounter() < iterations)
        ) {
          setIsPaused(false)
          animationRef.current.play(() => {
            setIsPaused(true)
          })
        } else {
          setIsPaused(false)
          animationRef.current.backToStartPosition(true, () => {
            setIsPaused(true)
          })
        }
        removeEventListener('touchmove', touchListener)
        removeEventListener('touchend', touchEndHandler)
      })
    )
  }

  const onVisibilityChangeHandler = useCallback(() => {
    animationRef.current.toggleByVisibility()
  }, [])

  return {
    onMouseDownHandler,
    onMoveHandler,
    onTouchStartHandler,
    onContainerHoverHandler,
    onVisibilityChangeHandler,
    isPaused,
    isAnimating,
    wrapperRef,
    animation: animationRef.current
  }
}
