import { Directions, ElRect, Iterations } from '../types/smartTickerTypes'

export enum AnimationKey {
  Forward = 'FORWARD',
  Back = 'BACK',
  Restart = 'RESTART',
  Dragging = 'DRAGGING'
}

type InitParams = {
  tickerEl: React.RefObject<HTMLDivElement>
  wrapperEl: React.RefObject<HTMLDivElement>
  tickerRect: ElRect
  containerRect: ElRect
  startPosition: number
  speed: number
  speedBack: number
  delay: number
  delayBack: number
  direction: Directions
  infiniteScrollView: boolean
  rtl: boolean
  iterations: Iterations
  onIterationsEnd?: () => void
}

export class Animation {
  private tickerEl: React.RefObject<HTMLDivElement>
  private tickerRect: ElRect
  private wrapperEl: React.RefObject<HTMLDivElement>
  private containerRect: ElRect
  private axis: 'x' | 'y'
  private direction: Directions
  private prevTime: number = 0
  private isDragging: boolean = false
  private iterationCounter: number = 0
  private infiniteScrollView: boolean
  private speed = 50
  private speedBack = 200
  private isPausedByVisibility = false
  private delay: number
  private delayBack: number
  private iterations: Iterations
  private isInited: boolean = false
  private onAnimationEnd: (() => void) | null = null
  private onIterationsEnd: (() => void) | null
  private animationStartPos: number

  private reqAnimFrameKey: number | null = null
  private animationState: AnimationKey | null = null
  private timeoutIds: number[] = []

  private cachedWrapper: HTMLDivElement | null = null
  private cachedStyle: CSSStyleDeclaration | null = null
  private isGPUAccelerated: boolean = true

  private readonly isMobile: boolean = false

  // Add internal position tracking
  private currentX: number = 0
  private currentY: number = 0

  constructor() {
    try {
      // Only keep GPU detection if needed
      this.isGPUAccelerated = 'transform' in document.body.style
    } catch (e) {
      this.isGPUAccelerated = false
    }
  }

  // MARK: draw
  private draw(fraction: number) {
    if (!this.cachedWrapper || !this.cachedStyle) return

    const step =
      ([AnimationKey.Back, AnimationKey.Restart].includes(this.animationState!)
        ? this.speedBack
        : this.speed) *
      fraction *
      this.getSign()

    const { x, y } = this.getTransformPosition()
    const newX = this.axis === 'x' ? x + step : x
    const newY = this.axis === 'y' ? y + step : y

    this.setTransformPosition(newX, newY)
  }

  // MARK: animate
  private animate(key: AnimationKey, onEnd?: () => void) {
    this.stopAnimation()

    if (this.cachedStyle) {
      this.cachedStyle.willChange = 'transform'
    }

    if (key !== this.animationState) {
      this.animationState = key
    }

    this.prevTime = 0
    const { x, y } = this.getTransformPosition()
    this.animationStartPos = this.axis === 'x' ? x : y

    const _animate = (time: number) => {
      if (!this.prevTime) this.prevTime = time

      const fraction = Math.min((time - this.prevTime) / 1000, 0.1)
      this.prevTime = time
      this.draw(fraction)

      if (this.alignPosition(key, onEnd)) {
        this.reqAnimFrameKey = requestAnimationFrame(_animate.bind(this))
      }
    }
    requestAnimationFrame(_animate.bind(this))
  }

  // MARK: stopAnimation
  private stopAnimation() {
    if (this.reqAnimFrameKey) {
      cancelAnimationFrame(this.reqAnimFrameKey)
      this.reqAnimFrameKey = null

      // Remove will-change hint
      if (this.wrapperEl?.current) {
        this.wrapperEl.current.style.willChange = 'auto'
      }
    }
  }

  // MARK: clearTimeouts
  private clearTimeouts() {
    // Clear all timeouts
    this.timeoutIds.forEach((id) => clearTimeout(id))
    this.timeoutIds = []
  }

  // MARK: restartLoop
  private restartLoop = () => {
    const restart = () => {
      if (this.wrapperEl.current) {
        this.animate(AnimationKey.Restart)
      }
    }

    requestAnimationFrame(restart)
  }

  private getSign = (): -1 | 1 => {
    switch (this.animationState) {
      case AnimationKey.Forward:
        return this.direction === 'left' || this.direction === 'top' ? -1 : 1
      case AnimationKey.Back:
      case AnimationKey.Restart:
        return this.animationStartPos < 0 ? -1 : 1
      default:
        return 1
    }
  }

  // MARK: cacheValues
  private cacheValues() {
    if (this.wrapperEl?.current) {
      this.cachedWrapper = this.wrapperEl.current
      this.cachedStyle = this.cachedWrapper.style

      // Initialize transform if not set
      const currentTransform = window.getComputedStyle(this.cachedWrapper).transform
      if (currentTransform === 'none') {
        this.cachedStyle.transform = 'matrix(1, 0, 0, 1, 0, 0)'
      }

      if (this.isGPUAccelerated && !this.cachedStyle.transform.includes('translateZ')) {
        this.cachedStyle.transform += ' translateZ(0)'
      }
    }
  }

  // MARK: getTransformPosition
  getTransformPosition(): { x: number; y: number } {
    if (!this.cachedWrapper) {
      // Only cache if not initialized at all
      this.cacheValues()
      if (!this.cachedWrapper) return { x: 0, y: 0 }
    }

    // Use cached wrapper directly
    return {
      x: this.currentX,
      y: this.currentY
    }
  }

  // MARK: setTransformPosition
  setTransformPosition(x: number, y: number) {
    if (!this.cachedWrapper || !this.cachedStyle) return

    // Update internal position state
    this.currentX = x
    this.currentY = y

    // Use translate3d for better compositing
    this.cachedStyle.transform = `translate3d(${x}px, ${y}px, 0)`
  }

  alignPosition(key: AnimationKey, onEnd?: () => void): boolean {
    if (!this.isInited || !this.cachedWrapper) return false

    const { x: wrapperX, y: wrapperY } = this.getTransformPosition()

    if (
      this.infiniteScrollView &&
      (key === AnimationKey.Forward || key === AnimationKey.Dragging)
    ) {
      switch (this.axis) {
        case 'x': {
          const tickerWidth = Number(this.tickerEl?.current?.style.minWidth.replace('px', '')) || 0

          if (wrapperX >= tickerWidth) {
            if (!this.isDragging) this.iterationCounter++
            requestAnimationFrame(() => {
              this.setTransformPosition(wrapperX - tickerWidth, 0)
            })
            break
          }

          if (wrapperX <= -tickerWidth) {
            if (!this.isDragging) this.iterationCounter++
            requestAnimationFrame(() => {
              this.setTransformPosition(wrapperX + tickerWidth, 0)
            })
            break
          }
          break
        }
        case 'y': {
          const tickerHeight =
            Number(this.tickerEl?.current?.style.minHeight.replace('px', '')) || 0

          if (wrapperY >= tickerHeight) {
            if (!this.isDragging) this.iterationCounter++
            requestAnimationFrame(() => {
              this.setTransformPosition(0, wrapperY - tickerHeight)
            })
            break
          }

          if (wrapperY <= -tickerHeight) {
            if (!this.isDragging) this.iterationCounter++
            requestAnimationFrame(() => {
              this.setTransformPosition(0, wrapperY + tickerHeight)
            })
            break
          }
          break
        }
      }

      if (this.iterations !== 'infinite' && this.iterationCounter >= this.iterations) {
        this.stopAnimation()

        if (typeof onEnd === 'function') {
          onEnd()
        }

        if (typeof this.onIterationsEnd === 'function') {
          this.onIterationsEnd()
        }

        return false
      }
      //MARK: ----forward
    } else if (key === AnimationKey.Forward) {
      // max "top" or "left" position depending on the direction
      const maxPos: { [Property in typeof this.axis]: { [Property in Directions]?: number } } = {
        y: {
          top: this.tickerRect.height - this.containerRect.height,
          bottom: this.tickerRect.height - this.containerRect.height
        },
        x: {
          left: this.tickerRect.width - this.containerRect.width,
          right: this.tickerRect.width - this.containerRect.width
        }
      }

      const newPos = Math.abs(this.axis === 'x' ? wrapperX : wrapperY)

      if (newPos > maxPos[this.axis][this.direction]!) {
        this.iterationCounter++
        this.stopAnimation()

        this.timeoutIds.push(
          setTimeout(() => {
            this.restartLoop()
          }, this.delayBack) as unknown as number
        )

        return false
      }
      //MARK: ----restart
    } else if (key === AnimationKey.Restart) {
      const newPos = this.axis === 'x' ? wrapperX : wrapperY

      if (newPos * -this.getSign() >= 0) {
        this.stopAnimation()

        this.setTransformPosition(0, 0)

        if (this.iterations === 'infinite' || this.iterationCounter < this.iterations) {
          this.timeoutIds.push(
            setTimeout(() => {
              this.animate(AnimationKey.Forward)
            }, this.delay) as unknown as number
          )
        } else {
          this.animationState = null

          if (typeof onEnd === 'function') {
            onEnd()
          }

          if (typeof this.onIterationsEnd === 'function') {
            this.onIterationsEnd()
          }
        }

        return false
      }
      //MARK: ----back
    } else if (key === AnimationKey.Back) {
      const newPos = this.axis === 'x' ? wrapperX : wrapperY

      if (newPos * -this.getSign() >= 0) {
        this.stopAnimation()
        this.animationState = null

        this.setTransformPosition(0, 0)

        if (typeof onEnd === 'function') {
          onEnd()
        }

        return false
      }
    }
    return true
  }

  // MARK: pause
  pause() {
    if (!this.isInited) return

    this.isPausedByVisibility = false

    this.stopAnimation()
  }

  setIsDragging(drag: boolean) {
    // the animation should be stopped while dragging
    if (drag) {
      this.stopAnimation()
    }
    this.isDragging = drag
  }

  getIsDragging(): boolean {
    return this.isDragging
  }

  // MARK: play
  play(onEnd?: () => void, continueAfter: boolean = false) {
    if (!this.isInited) return

    if (onEnd && typeof onEnd === 'function') {
      this.onAnimationEnd = onEnd
    }

    this.isPausedByVisibility = false
    this.clearTimeouts()

    // If the animation is back already, we need to restart it
    if (continueAfter && this.animationState === AnimationKey.Back) {
      this.animationState = AnimationKey.Restart
    }

    if (!this.isDragging) {
      this.timeoutIds.push(
        setTimeout(
          () => {
            this.animate(this.animationState || AnimationKey.Forward, () => {
              if (typeof this.onAnimationEnd === 'function') {
                this.onAnimationEnd()
              }
            })
          },
          this.animationState ? 0 : this.delay
        ) as unknown as number
      ) // Cast to number
    }
  }

  // MARK: toggleByVisibility
  toggleByVisibility() {
    if (!this.isInited) return false

    if (document?.visibilityState === 'hidden') {
      // Pausing the animation due to visibility change
      if (this.animationState) {
        this.isPausedByVisibility = true
        this.stopAnimation()
      }
    } else if (this.isPausedByVisibility && document?.visibilityState === 'visible') {
      // Resuming animation previously paused by visibility change
      this.prevTime = performance.now() // Reset the timer to avoid animation jumps
      this.play()
      this.isPausedByVisibility = false
    }
  }
  // MARK: init
  init({
    tickerEl,
    wrapperEl,
    tickerRect,
    delay,
    delayBack,
    containerRect,
    startPosition,
    speed,
    speedBack,
    infiniteScrollView,
    direction,
    iterations,
    onIterationsEnd
  }: InitParams) {
    this.tickerEl = tickerEl
    this.wrapperEl = wrapperEl
    this.axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
    this.speed = speed
    this.speedBack = speedBack * -1
    this.iterations = iterations
    this.onIterationsEnd = onIterationsEnd || null
    this.iterationCounter = 0
    this.infiniteScrollView = infiniteScrollView
    this.tickerRect = tickerRect
    this.containerRect = containerRect
    this.delay = delay
    this.delayBack = delayBack
    this.direction = direction

    if (this.iterations === 0) {
      return
    }

    if (startPosition) {
      const x = this.axis === 'x' ? startPosition : 0
      const y = this.axis === 'y' ? startPosition : 0
      this.setTransformPosition(x, y)
    } else {
      this.setTransformPosition(0, 0)
    }

    // Cache values after initial setup
    this.cacheValues()

    this.isInited = true
  }

  // MARK: backToStartPosition
  backToStartPosition(willPause: boolean = true, onEnd?: () => void, immediately: boolean = false) {
    if (!this.isInited || !this.wrapperEl?.current?.style) return

    this.onAnimationEnd = onEnd || null

    this.clearTimeouts()

    const origSpeedBack = this.speedBack
    this.speedBack = immediately ? 1000 : this.speedBack

    this.animate(AnimationKey.Back, () => {
      this.speedBack = origSpeedBack

      if (!willPause) {
        this.timeoutIds.push(
          setTimeout(() => {
            this.animate(AnimationKey.Forward)
          }, this.delay) as unknown as number
        ) // Cast to number
      } else {
        if (typeof this.onAnimationEnd === 'function') {
          this.onAnimationEnd()
        }
      }
    })
  }

  getCounter(): number {
    return this.iterationCounter
  }

  setCounter(counter: number): void {
    this.iterationCounter = counter
  }

  destroy() {
    this.clearTimeouts()
    this.stopAnimation()
  }
}
