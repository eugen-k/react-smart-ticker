import { Directions, ElRect, Iterations } from '../types/smartTickerTypes'

type InitParams = {
  tickerEl: React.RefObject<HTMLDivElement>
  wrapperEl: React.RefObject<HTMLDivElement>
  tickerRect: ElRect
  containerRect: ElRect
  startPosition: number
  speed: number
  delay: number
  delayBack: number
  direction: Directions
  infiniteScrollView: boolean
  playOnHover: boolean
  rtl: boolean
  iterations: Iterations
  onAnimationEnd?: () => void
}

export class Animation {
  private tickerEl: React.RefObject<HTMLDivElement>
  private tickerRect: ElRect
  private wrapperEl: React.RefObject<HTMLDivElement>
  private containerRect: ElRect
  private axis: 'x' | 'y'
  private sign: -1 | 1
  private prevTime: number = 0
  private isDragging: boolean = false
  private iterationCounter: number = 0
  private infiniteScrollView: boolean
  private speed = 50
  private isInnerPaused = false
  private isPaused = true
  private delay: number
  private playOnHover: boolean = false
  private delayBack: number
  private iterations: Iterations
  private sideX: 'left' | 'right' = 'left'
  private isInited: boolean = false
  private onAnimationEnd: (() => void) | null

  private draw(fraction: number) {
    const step = this.speed * fraction * this.sign

    const newPos =
      Number(
        this.wrapperEl!.current!.style[this.axis === 'x' ? this.sideX : 'top'].replace('px', '')
      ) + step

    this.wrapperEl!.current!.style[this.axis === 'x' ? this.sideX : 'top'] = newPos + 'px'
    this.alignPosition()
  }

  private animate() {
    this.prevTime = 0

    const _animate = (time: number) => {
      if (!this.prevTime) this.prevTime = time

      if (
        !this.isPaused &&
        !this.isInnerPaused &&
        (this.iterations === 'infinite' || this.iterationCounter < this.iterations)
      ) {
        const fraction = (time - this.prevTime) / 1000
        this.prevTime = time
        this.draw(fraction)

        requestAnimationFrame(_animate.bind(this))
      }
    }
    requestAnimationFrame(_animate.bind(this))
  }

  alignPosition() {
    if (!this.isInited) return

    if (this.infiniteScrollView) {
      switch (this.axis) {
        case 'x': {
          const wrapperX = Number(this.wrapperEl?.current?.style[this.sideX].replace('px', ''))
          const tickerWidth = Number(this.tickerEl?.current?.style.minWidth.replace('px', ''))

          if (this.wrapperEl && wrapperX >= tickerWidth) {
            if (!this.isDragging) this.iterationCounter++
            requestAnimationFrame(() => {
              this.wrapperEl!.current!.style[this.sideX] = wrapperX - tickerWidth + 'px'
            })
            break
          }

          if (this.wrapperEl && wrapperX <= -tickerWidth) {
            if (!this.isDragging) this.iterationCounter++
            requestAnimationFrame(() => {
              this.wrapperEl!.current!.style[this.sideX] = wrapperX + tickerWidth + 'px'
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
      }
    } else if (!this.isDragging) {
      const minPos: { [Property in typeof this.axis]: { [Property in Directions]?: number } } = {
        y: { top: -(this.tickerRect.height - this.containerRect.height) },
        x: {
          left: -(this.tickerRect.width - this.containerRect.width),
          right: -(this.tickerRect.width - this.containerRect.width)
        }
      }
      const maxPos: { [Property in typeof this.axis]: { [Property in Directions]?: number } } = {
        y: { top: 0 },
        x: {
          left: 0,
          right: 0
        }
      }

      const newPos = Number(
        this.wrapperEl!.current!.style[this.axis === 'x' ? this.sideX : 'top'].replace('px', '')
      )

      if (
        newPos < minPos[this.axis][this.axis === 'x' ? this.sideX : 'top']! ||
        newPos > maxPos[this.axis][this.axis === 'x' ? this.sideX : 'top']!
      ) {
        this.iterationCounter++
        this.isInnerPaused = true

        setTimeout(() => {
          this.restartLoop()
        }, this.delayBack)
      }
    }
  }

  private restartLoop = () => {
    const restart = () => {
      if (this.wrapperEl.current) {
        this.wrapperEl.current.style.transition = `${this.sideX} .2s linear, top .2s linear`
        this.wrapperEl.current.style[this.axis === 'x' ? this.sideX : 'top'] = 0 + 'px'

        setTimeout(() => {
          if (this.wrapperEl.current) {
            this.wrapperEl.current.style.transition = 'none'

            if (this.iterations === 'infinite' || this.iterationCounter < this.iterations) {
              setTimeout(() => {
                this.isInnerPaused = false
                this.animate()
              }, this.delay)
            } else {
              // reset animation state
              this.isInnerPaused = false
              if (typeof this.onAnimationEnd === 'function') {
                this.onAnimationEnd()
              }
            }
          }
        }, 200)
      }
    }

    if (this.iterations === 'infinite' || this.iterationCounter < this.iterations) {
      requestAnimationFrame(restart)
    } else if (this.playOnHover) {
      // reset animation state
      this.isInnerPaused = false
    } else {
      requestAnimationFrame(restart)
    }
  }

  pause() {
    this.isPaused = true
  }

  setIsDragging(drag: boolean) {
    // the animation should be stopped while dragging
    if (drag) {
      this.isPaused = true
    }
    this.isDragging = drag
  }

  play() {
    if (!this.isInited) return

    this.isPaused = false

    if (!this.isDragging) {
      setTimeout(() => {
        this.animate()
      }, this.delay)
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
    infiniteScrollView,
    direction,
    playOnHover,
    iterations,
    rtl,
    onAnimationEnd
  }: InitParams) {
    this.tickerEl = tickerEl
    this.wrapperEl = wrapperEl
    this.axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
    this.sign = direction === 'left' || rtl || direction === 'top' ? -1 : 1
    this.speed = speed
    this.isPaused = true
    this.iterations = iterations
    this.onAnimationEnd = onAnimationEnd || null
    this.iterationCounter = 0
    this.infiniteScrollView = infiniteScrollView
    this.tickerRect = tickerRect
    this.containerRect = containerRect
    this.delay = delay
    this.delayBack = delayBack
    this.playOnHover = playOnHover

    if (rtl) {
      this.sideX = 'right'
    }

    if (startPosition) {
      this.wrapperEl!.current!.style[this.axis === 'x' ? this.sideX : 'top'] = startPosition + 'px'
    }

    this.isInited = true
  }

  backToStartPosition() {
    if (!this.isInited) return

    this.isPaused = true

    if (!this.isDragging) {
      requestAnimationFrame(() => {
        if (this.wrapperEl.current) {
          this.wrapperEl.current.style.transition = `${this.sideX} .2s linear, top .2s linear`
          this.wrapperEl.current.style[this.axis === 'x' ? this.sideX : 'top'] = 0 + 'px'

          setTimeout(() => {
            if (this.wrapperEl.current) {
              this.wrapperEl.current.style.transition = 'none'
            }
          }, 200)
        }
      })
    }
  }

  getCounter(): number {
    return this.iterationCounter
  }

  setCounter(counter: number): void {
    this.iterationCounter = counter
  }
}
