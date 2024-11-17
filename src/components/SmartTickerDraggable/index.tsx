import React, { Fragment, useCallback, useMemo, useState } from 'react'
import styles from './smartTickerDraggable.module.scss'
import { useSmartCheck } from '../../hooks/useSmartCheck'
import { SmartTickerDraggableProps } from '../../types/smartTickerTypes'
import { TickerContainer } from '../TickerContainer'
import { useTickerAnimation } from '../../hooks/useTickerAnimation'

/**
 * React component that transforms child elements into a draggable ticker (marquee)
 *
 * @component
 *
 * @visibleName React Smart Ticker
 */
export const SmartTickerDraggable: React.FC<SmartTickerDraggableProps> = ({
  children,
  smart = true,
  autoFill = false,
  rtl = false,
  direction = rtl ? 'right' : 'left',
  speed = 50,
  pauseOnHover = false,
  playOnHover = false,
  delay = 0,
  delayBack = 500,
  iterations = 'infinite',
  recalcDeps = [],
  style,
  containerStyle,
  isText = true,
  waitForFonts = isText ? true : false,
  multiLine = 0,
  infiniteScrollView = true,
  disableSelect = false
}) => {
  smart = smart && !autoFill
  pauseOnHover = playOnHover ? false : pauseOnHover

  direction = multiLine ? 'top' : direction
  isText = multiLine ? true : isText
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'

  const [isDragging, setIsDragging] = useState(false)

  const {
    containerRef,
    tickerRef,
    containerRect,
    tickerRect,
    isChildFit,
    amountToFill,
    isCalculated,
    recalc: smartCheckReset
  } = useSmartCheck({
    children,
    multiLine,
    infiniteScrollView,
    smart,
    waitForFonts,
    direction,
    autoFill,
    speed,
    recalcDeps
  })

  const canBeAnimated = useMemo(
    () => (!isChildFit || (!smart && isChildFit && infiniteScrollView)) && isCalculated,
    [isChildFit, smart, isChildFit, infiniteScrollView, isCalculated]
  )

  const { onMouseDownHandler, onTouchStartHandler, onContainerHoverHandler, wrapperRef, isPaused } =
    useTickerAnimation({
      isCalculated,
      tickerRef,
      tickerRect,
      containerRect,
      infiniteScrollView,
      delay,
      delayBack,
      speed,
      canBeAnimated,
      direction,
      rtl,
      iterations,
      playOnHover,
      pauseOnHover,
      onMouseDown: onMouseDownInnerHandler,
      onMouseUp: onMouseUpInnerHandler
    })

  const onResizeHandler = useCallback(() => {
    smartCheckReset()
  }, [])

  function onMouseDownInnerHandler() {
    wrapperRef!.current?.classList.add(styles['dragging'])
    setIsDragging(true)
  }

  function onMouseUpInnerHandler() {
    wrapperRef!.current?.classList.remove(styles['dragging'])
    setIsDragging(false)
  }

  const filledWithChildren = useMemo(() => {
    if (!autoFill) return children
    return new Array(amountToFill).fill(0).map((_, i) => {
      return (
        <Fragment key={i}>
          {children}
          {axis === 'y' && amountToFill > 1 && isText && <br />}
        </Fragment>
      )
    })
  }, [children, autoFill, amountToFill])

  const isRowEllipses = useMemo(() => {
    if (
      (direction === 'left' || (direction === 'right' && rtl)) &&
      isText &&
      isPaused &&
      !pauseOnHover &&
      !isDragging &&
      !isChildFit &&
      !autoFill &&
      isCalculated
    ) {
      return true
    } else {
      return false
    }
  }, [axis, isText, isPaused, pauseOnHover, isDragging, isChildFit, isCalculated])

  const isColumnEllipses = useMemo(() => {
    if (
      direction === 'top' &&
      isPaused &&
      isText &&
      !pauseOnHover &&
      !isDragging &&
      !isChildFit &&
      multiLine &&
      !autoFill &&
      isCalculated
    ) {
      return true
    } else {
      return false
    }
  }, [axis, isText, isPaused, pauseOnHover, isDragging, multiLine, isChildFit, isCalculated])

  const displayValue = useMemo(() => {
    if (isRowEllipses) {
      return 'inline-block'
    } else if (isColumnEllipses) {
      return '-webkit-box'
    } else {
      return 'flex'
    }
  }, [isRowEllipses, isColumnEllipses])

  const tickerStyle: React.CSSProperties = {
    ...style,
    display: displayValue,
    flexWrap: 'nowrap',
    overflow: 'hidden',
    textSizeAdjust: 'none',
    justifyItems: 'flex-start',
    flexDirection: axis === 'x' ? 'row' : 'column',
    userSelect: disableSelect ? 'none' : 'unset',
    WebkitUserSelect: disableSelect ? 'none' : 'unset',
    WebkitTouchCallout: disableSelect ? 'none' : 'unset',
    ...(axis === 'x' && { minWidth: tickerRect.width, whiteSpace: 'nowrap' }),
    ...(axis === 'y' && {
      minHeight: tickerRect.height,
      whiteSpace: 'normal'
    }),
    direction: rtl ? 'rtl' : 'ltr',
    // Show ellipses on X-axis
    ...(isRowEllipses && {
      minWidth: containerRect.width,
      maxWidth: containerRect.width,
      display: displayValue,
      textOverflow: 'ellipsis'
    }),
    // Show ellipses on Y-axis
    ...(isColumnEllipses && {
      display: displayValue,
      WebkitLineClamp: multiLine,
      WebkitBoxOrient: 'vertical',
      maxHeight: containerRect.height * multiLine
    }),
    ...(rtl &&
      axis === 'x' && {
        transform: `translate${axis}(-100%)`,
        left: `${tickerRect.width}px`,
        ...(isRowEllipses && {
          left: `${containerRect.width}px`
        })
      })
  }

  const wrapperStyle: React.CSSProperties = {
    [direction]: wrapperRef?.current?.style[direction as keyof CSSStyleDeclaration],
    justifyItems: rtl ? 'flex-end' : 'flex-start',
    flexDirection: axis === 'x' ? 'row' : 'column',
    transform: `translate${axis}(-${tickerRect[axis === 'x' ? 'width' : 'height']}px)`,
    ...(isRowEllipses && {
      transform: `translate${axis}(-${containerRect[axis === 'x' ? 'width' : 'height']}px)`
    }),
    ...(!infiniteScrollView && {
      transform: `translate${axis}(0px)`
    })
  }

  // simplified return if handlers aren't needed
  if (smart && isChildFit && isCalculated) {
    return (
      <TickerContainer
        containerRef={containerRef}
        containerRect={containerRect}
        direction={direction}
        infiniteScrollView={infiniteScrollView}
        style={containerStyle}
        onResizeHandler={onResizeHandler}
      >
        <div ref={wrapperRef} className={styles['drag-wrapper'] + ' ' + styles['off']}>
          <div
            key={'ticker-simple'}
            ref={tickerRef}
            data-testid={'ticker-smart'}
            className={styles.ticker}
            style={tickerStyle}
          >
            {children}
          </div>
        </div>
      </TickerContainer>
    )
  }

  return (
    <TickerContainer
      containerRef={containerRef}
      containerRect={containerRect}
      infiniteScrollView={infiniteScrollView}
      direction={direction}
      style={containerStyle}
      onResizeHandler={onResizeHandler}
      draggable
      {...((playOnHover || pauseOnHover) && { onHoverHandler: onContainerHoverHandler })}
    >
      <div
        ref={wrapperRef}
        data-testid={'ticker-wrapper'}
        className={styles['drag-wrapper']}
        style={wrapperStyle}
        onMouseDown={onMouseDownHandler}
        onTouchStart={onTouchStartHandler}
      >
        <div
          key={'ticker-1'}
          ref={tickerRef}
          data-testid={'ticker-1'}
          className={styles.ticker}
          style={tickerStyle}
        >
          {filledWithChildren}
        </div>

        {infiniteScrollView && (
          <>
            <div
              data-testid={'ticker-2'}
              className={styles.ticker}
              style={{ ...tickerStyle, display: isCalculated ? displayValue : 'none' }}
            >
              {filledWithChildren}
            </div>
            <div
              data-testid={'ticker-3'}
              className={styles.ticker}
              style={{ ...tickerStyle, display: isCalculated ? displayValue : 'none' }}
            >
              {filledWithChildren}
            </div>
          </>
        )}
      </div>
    </TickerContainer>
  )
}

export default SmartTickerDraggable
