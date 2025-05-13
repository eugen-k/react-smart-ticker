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
  play: boolean
  onAnimationEnd?: () => void
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
  private isInnerPaused = false
  private isPausedByVisibility = false
  private isPaused = true
  private delay: number
  private delayBack: number
  private iterations: Iterations
  private isInited: boolean = false
  private onAnimationEnd: (() => void) | null
  private isRestartAnimation: boolean = false
  private isBackAnimation: boolean = false
  private animationStartPos: number
  private reqAnimFrameKey: number | null = null
  private animationState: AnimationKey | null = null

  private draw(fraction: number) {
    if (this.wrapperEl?.current === null) return

    const step =
      (this.isRestartAnimation || this.isBackAnimation ? this.speedBack : this.speed) *
      fraction *
      this.getSign()

    const newPos =
      Number(
        this.wrapperEl?.current?.style[this.axis === 'x' ? 'left' : 'top']?.replace('px', '') || 0
      ) + step

    this.wrapperEl!.current!.style[this.axis === 'x' ? 'left' : 'top'] = newPos + 'px'
  }

  // MARK: animate
  private animate(key: AnimationKey, onEnd?: () => void) {
    this.stopAnimation()

    if (key !== this.animationState) {
      this.animationState = key
    }

    this.prevTime = 0

    this.animationStartPos = Number(
      this.wrapperEl?.current?.style?.[this.axis === 'x' ? 'left' : 'top']?.replace('px', '') || 0
    )

    const _animate = (time: number) => {
      if (!this.prevTime) this.prevTime = time

      if (
        !this.isPaused &&
        !this.isInnerPaused &&
        (this.iterations === 'infinite' || this.iterationCounter < this.iterations)
      ) {
        const fraction = Math.min((time - this.prevTime) / 1000, 0.1)
        this.prevTime = time
        this.draw(fraction)

        if (this.alignPosition(key, onEnd)) {
          this.reqAnimFrameKey = requestAnimationFrame(_animate.bind(this))
        } else {
          this.stopAnimation()
        }
      } else {
        this.stopAnimation()
      }
    }
    requestAnimationFrame(_animate.bind(this))
  }
  // MARK: stopAnimation
  private stopAnimation() {
    if (this.reqAnimFrameKey) {
      cancelAnimationFrame(this.reqAnimFrameKey)
      this.reqAnimFrameKey = null
    }
  }

  // MARK: alignPosition
  alignPosition(key: AnimationKey, onEnd?: () => void): boolean {
    if (!this.isInited) return false

    if (this.infiniteScrollView && !this.isRestartAnimation && !this.isBackAnimation) {
      switch (this.axis) {
        case 'x': {
          const wrapperX = Number(this.wrapperEl?.current?.style.left.replace('px', ''))
          const tickerWidth = Number(this.tickerEl?.current?.style.minWidth.replace('px', ''))

          if (this.wrapperEl && wrapperX >= tickerWidth) {
            if (!this.isDragging) this.iterationCounter++
            requestAnimationFrame(() => {
              this.wrapperEl!.current!.style.left = wrapperX - tickerWidth + 'px'
            })
            break
          }

          if (this.wrapperEl && wrapperX <= -tickerWidth) {
            if (!this.isDragging) this.iterationCounter++
            requestAnimationFrame(() => {
              this.wrapperEl!.current!.style.left = wrapperX + tickerWidth + 'px'
            })
            break
          }
          break
        }
        case 'y': {
          const wrapperTop = Number(this.wrapperEl?.current?.style.top.replace('px', ''))
          const tickerHeight = Number(this.tickerEl?.current?.style.minHeight.replace('px', ''))

          if (this.wrapperEl && wrapperTop >= tickerHeight) {
            if (!this.isDragging) this.iterationCounter++
            requestAnimationFrame(() => {
              this.wrapperEl!.current!.style.top = wrapperTop - tickerHeight + 'px'
            })
            break
          }

          if (this.wrapperEl && wrapperTop <= -tickerHeight) {
            if (!this.isDragging) this.iterationCounter++
            requestAnimationFrame(() => {
              this.wrapperEl!.current!.style.top = wrapperTop + tickerHeight + 'px'
            })
            break
          }
          break
        }
      }

      if (this.iterations !== 'infinite' && this.iterationCounter >= this.iterations) {
        if (typeof this.onAnimationEnd === 'function') {
          this.onAnimationEnd()
        }

        // reset animation state
        this.isInnerPaused = false
        return false
      }
    } else if (!this.isDragging && !this.isBackAnimation && !this.isRestartAnimation) {
      // min "top" or "left" position depending on the direction
      const minPos: { [Property in typeof this.axis]: { [Property in Directions]?: number } } = {
        y: {
          top: 0,
          bottom: 0
        },
        x: {
          left: 0,
          right: 0
        }
      }
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

      const newPos = Math.abs(
        Math.floor(
          Number(
            this.wrapperEl?.current?.style?.[this.axis === 'x' ? 'left' : 'top']?.replace(
              'px',
              ''
            ) || 0
          )
        )
      )

      if (
        newPos < minPos[this.axis][this.direction]! ||
        newPos > maxPos[this.axis][this.direction]!
      ) {
        this.iterationCounter++
        this.isInnerPaused = true

        setTimeout(() => {
          this.restartLoop()
        }, this.delayBack)

        return false
      }
    } else if (this.isRestartAnimation) {
      const newPos = Number(
        this.wrapperEl!.current!.style[this.axis === 'x' ? 'left' : 'top'].replace('px', '')
      )

      if (newPos * -this.getSign() >= 0) {
        this.isInnerPaused = true
        this.isRestartAnimation = false

        requestAnimationFrame(() => {
          this.wrapperEl!.current!.style[this.axis === 'x' ? 'left' : 'top'] = 0 + 'px'

          if (this.iterations === 'infinite' || this.iterationCounter < this.iterations) {
            setTimeout(() => {
              this.isInnerPaused = false
              this.animate(AnimationKey.Forward)
            }, this.delay)
          } else {
            // reset animation state
            this.isInnerPaused = false
            if (typeof this.onAnimationEnd === 'function') {
              this.onAnimationEnd()
            }
          }
        })

        return false
      }
    } else if (this.isBackAnimation) {
      const newPos = Number(
        this.wrapperEl!.current!.style[this.axis === 'x' ? 'left' : 'top'].replace('px', '')
      )

      if (newPos * -this.getSign() >= 0) {
        this.isBackAnimation = false
        this.isInnerPaused = true

        requestAnimationFrame(() => {
          this.wrapperEl!.current!.style[this.axis === 'x' ? 'left' : 'top'] = 0 + 'px'

          if (typeof onEnd !== 'undefined') {
            onEnd()
          }
        })
        return false
      }
    }
    return true
  }

  private restartLoop = () => {
    const restart = () => {
      if (this.wrapperEl.current) {
        this.isRestartAnimation = true
        this.isInnerPaused = false
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

  pause() {
    this.isPaused = true
    this.isPausedByVisibility = false
  }

  setIsDragging(drag: boolean) {
    // the animation should be stopped while dragging
    if (drag) {
      this.isPaused = true
    }
    this.isDragging = drag
  }

  getIsDragging(): boolean {
    return this.isDragging
  }

  // MARK: play
  play(onEnd?: () => void) {
    if (!this.isInited || !this.wrapperEl?.current?.style) return

    this.isPaused = false
    this.isPausedByVisibility = false

    if (!this.isDragging) {
      setTimeout(
        () => {
          this.animate(this.animationState || AnimationKey.Forward, () => {
            if (typeof onEnd === 'function') {
              onEnd()
            }
          })
        },
        this.animationState ? 0 : this.delay
      )
    }
  }

  toggleByVisibility() {
    if (!this.isInited) return

    if (!this.isPaused && document?.visibilityState === 'hidden') {
      // Pausing the animation due to visibility change
      this.isPaused = true
      this.isPausedByVisibility = true
    } else if (this.isPausedByVisibility && document?.visibilityState === 'visible') {
      // Resuming animation previously paused by visibility change
      this.prevTime = performance.now() // Reset the timer to avoid animation jumps
      this.play()
    }
  }

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
    play,
    onAnimationEnd
  }: InitParams) {
    this.tickerEl = tickerEl
    this.wrapperEl = wrapperEl
    this.axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
    this.speed = speed
    this.speedBack = speedBack * -1
    this.isPaused = play
    this.iterations = iterations
    this.onAnimationEnd = onAnimationEnd || null
    this.iterationCounter = 0
    this.infiniteScrollView = infiniteScrollView
    this.tickerRect = tickerRect
    this.containerRect = containerRect
    this.delay = delay
    this.delayBack = delayBack
    this.direction = direction

    if (startPosition) {
      this.wrapperEl!.current!.style[this.axis === 'x' ? 'left' : 'top'] = startPosition + 'px'
    }

    this.isInited = true
  }

  // MARK: backToStartPosition
  backToStartPosition(willPause: boolean = true, onEnd?: () => void) {
    if (!this.isInited || !this.wrapperEl?.current?.style) return

    this.isInnerPaused = false
    this.isRestartAnimation = false
    this.isPaused = false

    this.isBackAnimation = true

    this.animate(AnimationKey.Back, () => {
      this.isBackAnimation = false
      this.isPaused = true
      this.isInnerPaused = false
      this.animationState = null

      if (!willPause) {
        setTimeout(() => {
          this.isPaused = false
          this.animate(AnimationKey.Forward)
        }, this.delay)
      } else {
        if (typeof onEnd === 'function') {
          onEnd()
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
}
