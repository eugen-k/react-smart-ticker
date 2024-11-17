import React, { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styles from './smartTicker.module.scss'
import { useSmartCheck } from '../../hooks/useSmartCheck'
import { TickerContainer } from '../TickerContainer'
import { SmartTickerProps } from '../../types/smartTickerTypes'

const CSSDirectionParams = {
  left: {
    '--stage0': '0',
    '--stage50': '-50%',
    '--stage100': '-100%'
  },
  right: {
    '--stage0': '0%',
    '--stage50': '50%',
    '--stage100': '100%'
  },
  top: {
    '--stage0': '0%',
    '--stage50': '-50%',
    '--stage100': '-100%'
  },
  bottom: {
    '--stage0': '0%',
    '--stage50': '50%',
    '--stage100': '100%'
  },

  infiniteScroll: {
    left: {
      '--stage0': '0%',
      '--stage50': '-50%',
      '--stage100': '-100%'
    },
    right: {
      '--stage0': '0%',
      '--stage50': '50%',
      '--stage100': '100%'
    },
    top: {
      '--stage0': '0%',
      '--stage50': '-50%',
      '--stage100': '-100%'
    },
    bottom: {
      '--stage0': '0%',
      '--stage50': '50%',
      '--stage100': '100%'
    }
  }
}

/**
 * React component that transforms child elements into a ticker (marquee)
 *
 * @component
 *
 * @visibleName React Smart Ticker
 */
const SmartTicker: React.FC<SmartTickerProps> = ({
  children,
  smart = true,
  isText = true,
  waitForFonts = isText ? true : false,
  multiLine = 0,
  infiniteScrollView = true,
  autoFill = false,
  rtl = false,
  direction = rtl ? 'right' : 'left',
  speed = 50,
  pauseOnClick = false,
  pauseOnHover = false,
  playOnClick = false,
  playOnHover = false,
  delay = 0,
  iterations = 'infinite',
  disableSelect = false,
  recalcDeps = [],
  style,
  containerStyle
}) => {
  const tickerCloneElRef = useRef<HTMLDivElement>(null)

  smart = smart && !autoFill
  pauseOnClick = playOnClick || playOnHover ? false : pauseOnClick
  pauseOnHover = playOnClick || playOnHover ? false : pauseOnHover

  const playOnDemand = playOnClick || playOnHover
  direction = multiLine ? 'top' : direction
  isText = multiLine ? true : isText
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'

  const {
    containerRef,
    tickerRef,
    containerRect,
    tickerRect,
    isChildFit,
    duration,
    amountToFill,
    isCalculated,
    recalc
  } = useSmartCheck({
    direction,
    autoFill,
    multiLine,
    infiniteScrollView,
    speed,
    smart,
    waitForFonts,
    recalcDeps,
    children
  })

  const [isPaused, setIsPaused] = useState(true)

  const canBeAnimated = !(smart && isChildFit) && isCalculated

  useLayoutEffect(() => {
    // prevent reset while the initial component loading
    if (isCalculated) {
      recalc()
    }
  }, [...recalcDeps])

  useLayoutEffect(() => {
    setIsPaused((smart && isChildFit) || playOnDemand)
    resetPosition()
  }, [isCalculated, playOnDemand])

  useEffect(() => {
    if (isPaused && playOnDemand && isCalculated) {
      resetPosition()
    }

    if (isPaused) {
      if (tickerRef.current) {
        tickerRef.current.style.willChange = 'auto'
      }
    } else {
      if (tickerRef.current) {
        tickerRef.current.style.willChange = 'transform'
      }
    }
  }, [isPaused])

  const onResizeHandler = () => {
    recalc()
  }

  const onHoverHandler = (hovered: boolean) => {
    if (pauseOnHover) {
      setIsPaused(hovered)
    } else if (playOnHover) {
      setIsPaused(!hovered)
    }
  }

  const onClickHandler = (clicked: boolean) => {
    if (pauseOnClick) {
      setIsPaused(clicked)
    } else if (playOnClick) {
      setIsPaused(!clicked)
    }
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
  }, [children, autoFill, amountToFill, isText])

  const resetPosition = () => {
    if (tickerRef.current) {
      const currentAnimationName = tickerRef.current.style.animationName
      tickerRef.current.style.animationName = 'none'
      tickerRef.current.offsetHeight /* trigger reflow */
      tickerRef.current.style.animationName = currentAnimationName
    }

    if (tickerCloneElRef.current) {
      const currentAnimationName = tickerCloneElRef.current.style.animationName
      tickerCloneElRef.current.style.animationName = 'none'
      tickerCloneElRef.current.offsetHeight /* trigger reflow */
      tickerCloneElRef.current.style.animationName = currentAnimationName
    }
  }

  const isRowEllipses = useMemo(() => {
    if (
      (direction === 'left' || (direction === 'right' && rtl)) &&
      isText &&
      !multiLine &&
      isPaused &&
      playOnDemand &&
      !isChildFit &&
      !autoFill &&
      isCalculated
    ) {
      return true
    } else {
      return false
    }
  }, [axis, isText, isPaused, playOnDemand, multiLine, isChildFit, autoFill, isCalculated])

  const isColumnEllipses = useMemo(() => {
    if (
      direction === 'top' &&
      isPaused &&
      playOnDemand &&
      multiLine &&
      !autoFill &&
      !isChildFit &&
      isCalculated
    ) {
      return true
    } else {
      return false
    }
  }, [axis, isText, isPaused, playOnDemand, multiLine, autoFill, isChildFit, isCalculated])

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
    animationDuration: duration + 's',
    direction: rtl ? 'rtl' : 'ltr',
    flexDirection: axis === 'x' ? 'row' : 'column',
    animationName: canBeAnimated ? styles['scroll' + axis] : 'unset',
    animationIterationCount: iterations === 'infinite' ? 'infinite' : Number(iterations),
    animationPlayState: isPaused ? 'paused' : 'running',
    animationDelay: (delay || 0) / 1000 + 's',
    userSelect: disableSelect ? 'none' : 'unset',
    WebkitUserSelect: disableSelect ? 'none' : 'unset',
    WebkitTouchCallout: disableSelect ? 'none' : 'unset',
    ...(!infiniteScrollView && {
      ['--stage0' as string]: CSSDirectionParams[direction]['--stage0'],
      ['--stage50' as string]: CSSDirectionParams[direction]['--stage50'],
      ['--stage100' as string]: CSSDirectionParams[direction]['--stage100']
    }),
    ...(infiniteScrollView && {
      ['--stage0' as string]: CSSDirectionParams['infiniteScroll'][direction]['--stage0'],
      ['--stage50' as string]: CSSDirectionParams['infiniteScroll'][direction]['--stage50'],
      ['--stage100' as string]: CSSDirectionParams['infiniteScroll'][direction]['--stage100']
    }),
    ...(axis === 'x' && {
      minWidth: tickerRect.width,
      whiteSpace: 'nowrap'
    }),
    ...(axis === 'y' && {
      minHeight: tickerRect.height,
      whiteSpace: 'normal'
    }),
    // styles for showing ellipses at the end of the line for the text content for "x" axis)
    ...(isRowEllipses && {
      minWidth: '100%',
      display: displayValue,
      animationName: 'unset',
      textOverflow: 'ellipsis'
    }),
    ...(isColumnEllipses && {
      display: displayValue,
      WebkitLineClamp: multiLine,
      WebkitBoxOrient: 'vertical',
      maxHeight: containerRect.height
    })
  }

  return (
    <TickerContainer
      containerRef={containerRef}
      containerRect={containerRect}
      onResizeHandler={onResizeHandler}
      direction={direction}
      infiniteScrollView={infiniteScrollView}
      style={containerStyle}
      {...((playOnHover || pauseOnHover) && { onHoverHandler: onHoverHandler })}
      {...((playOnClick || pauseOnClick) && { onClickHandler: onClickHandler })}
    >
      <div
        ref={tickerRef}
        data-testid={'ticker-1'}
        className={styles.ticker}
        style={tickerStyle}
        onAnimationEnd={() => {
          setIsPaused(true)
          resetPosition()
        }}
      >
        {filledWithChildren}
      </div>

      {canBeAnimated && infiniteScrollView && (
        <div
          ref={tickerCloneElRef}
          data-testid={'ticker-2'}
          className={styles.ticker}
          style={{ ...tickerStyle, display: isCalculated ? displayValue : 'none' }}
        >
          {filledWithChildren}
        </div>
      )}
    </TickerContainer>
  )
}

export default SmartTicker
