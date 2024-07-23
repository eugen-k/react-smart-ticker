import React, { CSSProperties, FC, ReactNode, RefObject, useEffect } from 'react'

import { SmartTickerProps } from '../../types/smartTickerTypes'
import { debounce } from '../../helpers/debounce'

type Props = {
  direction: SmartTickerProps['direction']
  rtl: boolean
  containerRef: RefObject<HTMLDivElement>
  containerRect: { width: number; height: number }
  children: ReactNode
  onHoverHandler?: (hoverState: boolean) => void
  onClickHandler?: (clickState: boolean) => void
  draggable?: boolean
  onResizeHandler?: () => void
  style?: CSSProperties
}

export const TickerContainer: FC<Props> = ({
  children,
  containerRef,
  containerRect,
  direction,
  rtl,
  onHoverHandler,
  onClickHandler,
  draggable,
  onResizeHandler,
  style
}) => {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'

  useEffect(() => {
    if (typeof onResizeHandler === 'function') {
      let debounceFunc
      window.addEventListener('resize', (debounceFunc = debounce(onResizeHandler, 200)))

      return () => {
        window.removeEventListener('resize', debounceFunc)
      }
    }
  }, [])

  const containerStyles: CSSProperties = {
    ...style,
    display: 'inline-flex',
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
    ...(rtl &&
      axis === 'x' && {
        justifyContent: 'flex-end'
      })
  }

  return (
    <div
      ref={containerRef}
      data-testid={'ticker-container'}
      style={containerStyles}
      {...(typeof onHoverHandler === 'function' && {
        onMouseOver: () => {
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
