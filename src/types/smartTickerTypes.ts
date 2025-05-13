import { CSSProperties, ForwardedRef, ReactNode } from 'react'

export type SmartTickerProps = {
  /**
   * @description Smart mode that determines if that's enough space
   * to fit the content of the ticker, and if it's enough the animation
   * will be turned off until the contents change
   * @default true
   */
  smart?: boolean
  /**
   * @description Determines if the content contains only text
   * which allows showing ellipses when text content isn't fitted into the container
   * @default true
   */
  isText?: boolean
  /**
   * @description Should the calculation be started only when fonts are loaded
   * @default true
   */
  waitForFonts?: boolean
  /**
   * @description Determines the maximum amount of lines within a text content
   * @default 0
   */
  multiLine?: number
  /**
   * @description Scrolling speed in pixels per second
   * @default 60
   */
  speed?: number
  /**
   * @description Delay before starting the animation (in milliseconds)
   * @default 0
   */
  delay?: number
  /**
   * @description Amount of animation iterations
   * @default 'infinite'
   */
  iterations?: Iterations
  /**
   * @description Determines if the content will repeated one by one during scrolling animation
   * @default true
   */
  infiniteScrollView?: boolean
  /**
   * @description Flag to determine if ticker content should be copied and fill in all the container's space
   * @default true
   */
  autoFill?: boolean
  /**
   * @description The direction in which the ticker will be moving
   * @default 'left'
   */
  direction?: Directions
  /**
   * @description Aligns text content to the right. The default direction of animation will be switched to 'right'
   * @default false
   */
  rtl?: boolean
  /**
   * @description Pause animation on hover
   * @default false
   */
  pauseOnHover?: boolean
  /**
   * @description Pause animation on click
   * @default false
   */
  pauseOnClick?: boolean
  /**
   * @description Play animation on hover
   * @default false
   */
  playOnHover?: boolean
  /**
   * @description Play animation on click
   * @default false
   */
  playOnClick?: boolean
  /**
   * @description Array of dependencies that trigger recalculation of the component
   * @default []
   */
  recalcDeps?: unknown[]
  /**
   * @description Controls the possibility of a user to select text in a ticker.
   * Useful in mobile devices when the playOnClick param is enabled
   * @default false
   */
  disableSelect?: boolean
  style?: CSSProperties
  containerStyle?: CSSProperties
  forwardedRef?: ForwardedRef<SmartTickerHandle>
  children: ReactNode
}

export type SmartTickerHandle = {
  play?: () => void
  pause?: () => void
  reset?: (isPaused: boolean) => void
}

export type Directions = 'left' | 'right' | 'top' | 'bottom'
export type Iterations = 'infinite' | number

export type SmartTickerDraggableProps = Omit<SmartTickerProps, 'pauseOnClick' | 'playOnClick'> & {
  delayBack?: number
  speedBack?: number
}

export type ElRect = {
  width: number
  height: number
}
