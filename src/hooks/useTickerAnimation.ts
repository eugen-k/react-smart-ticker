import { MouseEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Animation } from '../helpers/animation'
import { Directions, ElRect, Iterations } from '../types/smartTickerTypes'

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
  canBeAnimated: boolean
  iterations: Iterations
  infiniteScrollView: boolean
  playOnHover: boolean
  pauseOnHover: boolean
  onMouseDown?: () => void
  onMouseUp?: () => void
}

type UseTickerAnimationHookReturn = {
  onMouseDownHandler: (e: React.MouseEvent) => void
  onMoveHandler: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void
  onTouchStartHandler: (e: React.TouchEvent) => void
  onContainerHoverHandler: (hoverState: boolean) => void
  isPaused: boolean
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
  direction,
  rtl,
  infiniteScrollView,
  iterations,
  playOnHover,
  pauseOnHover,
  canBeAnimated,
  onMouseDown,
  onMouseUp
}: UseTickerAnimationHookParams): UseTickerAnimationHookReturn => {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
  const sideX = rtl ? 'right' : 'left'

  const animationRef = useRef(new Animation())
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [isPaused, setIsPaused] = useState(true)

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
      animationRef.current.pause()
      animationRef.current.backToStartPosition()
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
        delay,
        delayBack,
        direction,
        rtl,
        iterations,
        onAnimationEnd: () => {
          setIsPaused(true)
          if (playOnHover) {
            animationRef.current.setCounter(0)
          }
        }
      })

      if (canBeAnimated && (!playOnHover || pauseOnHover)) {
        setIsPaused(false)
      }
    }

    return () => {
      !!timeoutId && clearTimeout(timeoutId)
      animationRef.current.pause()
      animationRef.current.setCounter(0)
      animationRef.current.backToStartPosition()
      setIsPaused(true)
    }
  }, [isCalculated])

  useLayoutEffect(() => {
    if (isPaused) {
      animationRef.current.pause()
      // reset iterationCounter if the playOnClick or playOnHover options are true, to play the animation again once clicked/hovered
      if (
        iterations !== 'infinite' &&
        animationRef.current.getCounter() >= iterations &&
        playOnHover
      ) {
        animationRef.current.setCounter(0)
      }
      // move back to the start position if the playOnHover options are true
      if (playOnHover) {
        animationRef.current.backToStartPosition()
      }
    } else if (canBeAnimated) {
      animationRef.current.play()
    }
  }, [isPaused])

  const onContainerHoverHandler = (hovered: boolean) => {
    if (playOnHover) {
      if (hovered) {
        setIsPaused(false)
        //animationRef.current.play()
      } else {
        setIsPaused(true)
        //animationRef.current.pause()
      }
    }

    if (pauseOnHover) {
      if (hovered) {
        setIsPaused(true)
        //animationRef.current.pause()
      } else {
        setIsPaused(false)
        //animationRef.current.play()
      }
    }
  }

  const onMoveHandler = (e: React.MouseEvent<Element> | React.TouchEvent<Element>) => {
    let oldX = (e as React.MouseEvent).clientX ?? (e as React.TouchEvent).touches[0]?.clientX
    let oldY = (e as React.MouseEvent).clientY ?? (e as React.TouchEvent).touches[0]?.clientY
    let deltaX = 0
    let deltaY = 0

    const minPos: { [Property in typeof axis]: { [Property in Directions]?: number } } = {
      y: { top: -(tickerRect.height - containerRect.height) },
      x: {
        left: -(tickerRect.width - containerRect.width),
        right: -(tickerRect.width - containerRect.width)
      }
    }
    const maxPos: { [Property in typeof axis]: { [Property in Directions]?: number } } = {
      y: { top: 0 },
      x: {
        left: 0,
        right: 0
      }
    }

    return (e: MouseEvent | TouchEvent) => {
      deltaX = oldX - Number((e as MouseEvent).clientX ?? (e as TouchEvent).touches[0]?.clientX)
      deltaY = oldY - Number((e as MouseEvent).clientY ?? (e as TouchEvent).touches[0]?.clientY)

      oldX = (e as MouseEvent).clientX ?? (e as TouchEvent).touches[0]?.clientX
      oldY = (e as MouseEvent).clientY ?? (e as TouchEvent).touches[0]?.clientY

      requestAnimationFrame(() => {
        const sign = sideX === 'left' || axis === 'y' ? 1 : -1

        if (infiniteScrollView) {
          wrapperRef.current!.style[axis === 'x' ? sideX : 'top'] =
            Number(wrapperRef.current!.style[axis === 'x' ? sideX : 'top'].replace('px', '')) -
            (axis === 'x' ? deltaX : deltaY) * sign +
            'px' // update position
          animationRef.current.alignPosition()
        } else {
          const curPos = Number(
            wrapperRef.current!.style[axis === 'x' ? sideX : 'top'].replace('px', '')
          )
          const newPos = curPos - (axis === 'x' ? deltaX : deltaY) * sign

          if (
            newPos < minPos[axis][axis === 'x' ? sideX : 'top']! ||
            newPos > maxPos[axis][axis === 'x' ? sideX : 'top']!
          ) {
            deltaX = deltaX / 50
            deltaY = deltaY / 50
          }

          wrapperRef.current!.style[axis === 'x' ? sideX : 'top'] =
            curPos - (axis === 'x' ? deltaX : deltaY) * sign + 'px'
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

    addEventListener('mousemove', (dragListener = onMoveHandler(e) as EventListener))

    addEventListener(
      'mouseup',
      (mouseUpHandler = () => {
        if (typeof onMouseUp === 'function') {
          onMouseUp()
        }

        animationRef.current.setIsDragging(false)

        if (
          canBeAnimated &&
          !playOnHover &&
          (iterations === 'infinite' || animationRef.current.getCounter() < iterations)
        ) {
          animationRef.current.play()
        } else {
          animationRef.current.backToStartPosition()
        }
        removeEventListener('mousemove', dragListener)
        removeEventListener('mouseup', mouseUpHandler)
      })
    )
  }

  const onTouchStartHandler = (e: React.TouchEvent) => {
    animationRef.current.setIsDragging(true)

    addEventListener('touchmove', (touchListener = onMoveHandler(e) as EventListener))

    addEventListener(
      'touchend',
      (touchEndHandler = () => {
        animationRef.current.setIsDragging(false)

        if (
          canBeAnimated &&
          !playOnHover &&
          (iterations === 'infinite' || animationRef.current.getCounter() < iterations)
        ) {
          animationRef.current.play()
        } else {
          animationRef.current.backToStartPosition()
        }
        removeEventListener('touchmove', touchListener)
        removeEventListener('touchend', touchEndHandler)
      })
    )
  }

  return {
    onMouseDownHandler,
    onMoveHandler,
    onTouchStartHandler,
    onContainerHoverHandler,
    isPaused,
    wrapperRef,
    animation: animationRef.current
  }
}
