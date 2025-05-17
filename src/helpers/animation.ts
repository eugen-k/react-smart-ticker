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
  private onIterationsEnd: (() => void) | null
  private animationStartPos: number
  private reqAnimFrameKey: number | null = null
  private animationState: AnimationKey | null = null
  private timeoutIds: number[] = [] // Track all setTimeout IDs

  private draw(fraction: number) {
    if (this.wrapperEl?.current === null) return

    const step =
      ([AnimationKey.Back, AnimationKey.Restart].includes(this.animationState!)
        ? this.speedBack
        : this.speed) *
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
    }
  }

  private clearTimeouts() {
    // Clear all timeouts
    this.timeoutIds.forEach((id) => clearTimeout(id))
    this.timeoutIds = []
  }

  // MARK: alignPosition
  alignPosition(key: AnimationKey, onEnd?: () => void): boolean {
    if (!this.isInited) return false

    if (
      this.infiniteScrollView &&
      (key === AnimationKey.Forward || key === AnimationKey.Dragging)
    ) {
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
        this.stopAnimation()

        if (onEnd) {
          onEnd()
        }

        if (typeof this.onIterationsEnd === 'function') {
          this.onIterationsEnd()
        }

        return false
      }
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

      const newPos = Math.abs(
        Number(
          this.wrapperEl?.current?.style?.[this.axis === 'x' ? 'left' : 'top']?.replace('px', '') ||
            0
        )
      )

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
    } else if (key === AnimationKey.Restart) {
      const newPos = Number(
        this.wrapperEl!.current!.style[this.axis === 'x' ? 'left' : 'top'].replace('px', '')
      )

      if (newPos * -this.getSign() >= 0) {
        this.stopAnimation()

        requestAnimationFrame(() => {
          this.wrapperEl!.current!.style[this.axis === 'x' ? 'left' : 'top'] = 0 + 'px'

          if (this.iterations === 'infinite' || this.iterationCounter < this.iterations) {
            this.timeoutIds.push(
              setTimeout(() => {
                this.animate(AnimationKey.Forward)
              }, this.delay) as unknown as number
            )
          } else {
            if (typeof this.onIterationsEnd === 'function') {
              if (onEnd) {
                onEnd()
              }

              this.onIterationsEnd()
            }
          }
        })

        return false
      }
    } else if (key === AnimationKey.Back) {
      const newPos = Number(
        this.wrapperEl!.current!.style[this.axis === 'x' ? 'left' : 'top'].replace('px', '')
      )

      if (newPos * -this.getSign() >= 0) {
        this.stopAnimation()
        this.animationState = null

        requestAnimationFrame(() => {
          this.wrapperEl!.current!.style[this.axis === 'x' ? 'left' : 'top'] = 0 + 'px'
        })

        if (onEnd) {
          onEnd()
        }

        return false
      }
    }
    return true
  }

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
  play(onEnd?: () => void) {
    if (!this.isInited || !this.wrapperEl?.current?.style) return

    this.isPausedByVisibility = false
    this.clearTimeouts()

    // If the animation is back already, we need to restart it
    if (this.animationState === AnimationKey.Back) {
      this.animationState = AnimationKey.Restart
    }

    if (!this.isDragging) {
      this.timeoutIds.push(
        setTimeout(
          () => {
            this.animate(this.animationState || AnimationKey.Forward, () => {
              if (typeof onEnd === 'function') {
                onEnd()
              }
            })
          },
          this.animationState ? 0 : this.delay
        ) as unknown as number
      ) // Cast to number
    }
  }

  toggleByVisibility() {
    if (!this.isInited) return

    if (document?.visibilityState === 'hidden') {
      // Pausing the animation due to visibility change
      if (this.animationState) {
        this.isPausedByVisibility = true
      }
      this.stopAnimation()
    } else if (this.isPausedByVisibility && document?.visibilityState === 'visible') {
      // Resuming animation previously paused by visibility change
      this.prevTime = performance.now() // Reset the timer to avoid animation jumps
      this.play()
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
      this.wrapperEl!.current!.style[this.axis === 'x' ? 'left' : 'top'] = startPosition + 'px'
    }

    // Set initial position of the perpendicular axis to 0
    if (this.axis === 'x') {
      this.wrapperEl!.current!.style.top = 0 + 'px'
    } else {
      this.wrapperEl!.current!.style.left = 0 + 'px'
    }

    this.isInited = true
  }

  // MARK: backToStartPosition
  backToStartPosition(willPause: boolean = true, onEnd?: () => void, immediately: boolean = false) {
    if (!this.isInited || !this.wrapperEl?.current?.style) return

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
