import React, { CSSProperties, FC, ReactNode, RefObject, useEffect } from 'react'

import { SmartTickerProps } from '../../types/smartTickerTypes'
import { debounce } from '../../helpers/debounce'

type Props = {
  direction: SmartTickerProps['direction']
  containerRef: RefObject<HTMLDivElement>
  containerRect: { width: number; height: number }
  children: ReactNode
  onVisibilityChangeHandler?: () => void
  onHoverHandler?: (hoverState: boolean) => void
  onClickHandler?: (clickState: boolean) => void
  draggable?: boolean
  infiniteScrollView: boolean
  onResizeHandler?: () => void
  style?: CSSProperties
}

export const TickerContainer: FC<Props> = ({
  children,
  containerRef,
  containerRect,
  direction,
  onHoverHandler,
  onClickHandler,
  onVisibilityChangeHandler,
  draggable = false,
  infiniteScrollView,
  onResizeHandler,
  style
}) => {
  // const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'

  useEffect(() => {
    if (typeof onResizeHandler === 'function') {
      let debounceFunc
      window.addEventListener('resize', (debounceFunc = debounce(onResizeHandler, 200)))

      return () => {
        window.removeEventListener('resize', debounceFunc)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof onVisibilityChangeHandler === 'function') {
      document.addEventListener('visibilitychange', onVisibilityChangeHandler)

      return () => {
        document.removeEventListener('visibilitychange', onVisibilityChangeHandler)
      }
    }
  }, [])

  const containerStyles: CSSProperties = {
    ...style,
    display: 'flex',
    position: 'relative',
    flexWrap: 'nowrap',
    flexDirection: direction === 'left' || direction === 'right' ? 'row' : 'column',
    overflow: 'hidden',
    ...(containerRect.width && {
      maxWidth: containerRect.width
    }),
    ...(containerRect.height && {
      maxHeight: containerRect.height
    }),
    ...(draggable && { touchAction: 'none' }),
    ...((direction === 'right' || direction === 'bottom') &&
      !(infiniteScrollView && draggable) && {
        justifyContent: 'flex-end'
      })
  }

  return (
    <div
      ref={containerRef}
      data-testid={'ticker-container'}
      style={containerStyles}
      {...(typeof onHoverHandler === 'function' && {
        onMouseEnter: () => {
          onHoverHandler(true)
        }
      })}
      {...(typeof onHoverHandler === 'function' && {
        onMouseLeave: () => {
          onHoverHandler(false)
        }
      })}
      {...(typeof onClickHandler === 'function' && {
        onMouseDown: () => {
          onClickHandler(true)

          let mouseUpEventListener: () => void
          addEventListener(
            'mouseup',
            (mouseUpEventListener = () => {
              onClickHandler(false)
              removeEventListener('mouseup', mouseUpEventListener)
            })
          )
        }
      })}
      {...(typeof onClickHandler === 'function' && {
        onTouchStart: () => {
          onClickHandler(true)

          let touchEndEventListener: () => void
          addEventListener(
            'touchend',
            (touchEndEventListener = () => {
              onClickHandler(false)
              removeEventListener('touchend', touchEndEventListener)
            })
          )
        }
      })}
    >
      {children}
    </div>
  )
}
