<p align="center">
  <img alt="React Smart Ticker Demo" width="600px" src="https://github.com/eugen-k/react-smart-ticker-demo/blob/main/src/assets/gif/demo2.gif">
</p>

<h1 align="center">React Smart Ticker</h1>

<p align="center">
  <a aria-label="NPM Type Definitions" href="https://www.npmjs.com/package/react-smart-ticker">
    <img alt="NPM Type Definitions" src="https://img.shields.io/npm/types/react-smart-ticker">
  </a>
  <a aria-label="npm package minimized gzipped size" href="https://www.npmjs.com/package/react-smart-ticker">
    <img alt="npm package minimized gzipped size" src="https://img.shields.io/bundlejs/size/react-smart-ticker">
  </a>
  <a aria-label="Codecov" href="https://www.npmjs.com/package/react-smart-ticker">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/eugen-k/react-smart-ticker?logo=codecov&logoColor=%23F01F7A&label=codecov">
  </a>
  <a aria-label="GitHub License" href="https://www.npmjs.com/package/react-smart-ticker">
    <img alt="GitHub License" src="https://img.shields.io/github/license/eugen-k/react-smart-ticker">
  </a>
</p>

[**React Smart Ticker**](https://eugen-k.github.io/react-smart-ticker-demo/) is a React component that automatically displays text as a scrolling ticker/marquee when it overflows the container.

<!-- <img src="https://github.com/eugen-k/react-smart-ticker-demo/blob/main/src/assets/gif/multi-line.gif" alt="Multi-line" width="100" height="auto">
<img src="https://github.com/eugen-k/react-smart-ticker-demo/blob/main/src/assets/gif/1-line.gif" alt="1-line" width="100" height="auto">
<img src="https://github.com/eugen-k/react-smart-ticker-demo/blob/main/src/assets/gif/html.gif" alt="HTML blocks ticker" width="100" height="auto"> -->

## Demo

https://eugen-k.github.io/react-smart-ticker-demo/

## Features

- Multiline support
- Can be used as a ticker/marquee for any element e.g. text, images, HTML blocks
- Optionally draggable
- Supports RTL
- Highly customizable
- Zero dependency

## _SmartTicker_ and _SmartTickerDraggable_ component differences

#### SmartTicker

- uses _CSS_ based animation
- can be played or paused by click

#### SmartTickerDraggable

- uses _requestAnimationFrame()_ based animation
- draggable
- has backward animation
- can have a delay before animating back to the start position

> [!IMPORTANT]
> For complex elements (e.g. images) is recommended to use **SmartTicker** component as browsers are performing [better](https://developer.mozilla.org/en-US/docs/Web/Performance/CSS_JavaScript_animation_performance) using CSS-based animation.

## Installation

#### NPM

```sh
npm install react-smart-ticker --save
```

#### Yarn

```sh
yarn add react-smart-ticker
```

## Usage

Import **SmartTicker** or **SmartTickerDraggable** to a file depending on intended use:

```javascript
import { SmartTicker } from 'react-smart-ticker'
```

```javascript
import { SmartTickerDraggable } from 'react-smart-ticker'
```

Or import them both:

```javascript
import { SmartTicker, SmartTickerDraggable } from 'react-smart-ticker'
```

Then in your .jsx or .tsx file use it as a simple React component:

```jsx
import { SmartTicker, SmartTickerDraggable } from 'react-smart-ticker'

const App = () => (
  <>
    <SmartTicker>Some text</SmartTicker>
    <SmartTickerDraggable>Some draggable text</SmartTickerDraggable>
  </>
)

export default App
```

## Props

| Prop Name            | Type                                           | Required | Default      | Description                                                                                                                                                       |
| -------------------- | ---------------------------------------------- | -------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smart`              | `boolean`                                      | No       | `true`       | Smart mode that determines if that's enough space to fit the content of the ticker, and if it's enough the animation will be turned off until the contents change |
| `isText`             | `boolean`                                      | No       | `true`       | Determines if the content contains only text which allows showing ellipses when text content isn't fitted into the container                                      |
| `multiLine`          | `number`                                       | No       | 0            | Determines the maximum amount of lines within a text content. Sets direction to "top"                                                                             |
| `waitForFonts`       | `boolean`                                      | No       | `true`       | Run the calculation only when fonts are loaded                                                                                                                    |
| `speed`              | `number`                                       | No       | 60           | Scrolling speed in pixels per second                                                                                                                              |
| `delay`              | `number`                                       | No       | 0            | Delay before starting the animation (in milliseconds)                                                                                                             |
| ⚠️ `delayBack`       | `number`                                       | No       | 0            | Delay before returning to a start position (in milliseconds). Requires _infiniteScrollView_ prop to be **false** **⚠️ _SmartTickerDraggable_ prop only**          |
| `iterations`         | `number` \| `"infinite"`                       | No       | `"infinite"` | Amount of animation iterations second                                                                                                                             |
| `infiniteScrollView` | `boolean`                                      | No       | `true`       | Determines if the content will repeated one by one during scrolling animation                                                                                     |
| `autoFill`           | `boolean`                                      | No       | `false`      | Flag to determine if ticker content should be copied and fill in all the container's space                                                                        |
| `direction`          | `"left"` \| `"right"` \| `"top"` \| `"bottom"` | No       | `"left"`     | The direction in which the ticker will be moving                                                                                                                  |
| `rtl`                | `boolean`                                      | No       | `false`      | Aligns text content to the right. The default direction of animation will be switched to 'right'                                                                  |
| `pauseOnHover`       | `boolean`                                      | No       | `false`      | Pause animation on hover                                                                                                                                          |
| `playOnHover`        | `boolean`                                      | No       | `false`      | Play animation on hover                                                                                                                                           |
| ⚠️ `pauseOnClick`    | `boolean`                                      | No       | `false`      | Pause animation on click **⚠️ _SmartTicker_ prop only**                                                                                                           |
| ⚠️ `playOnClick`     | `boolean`                                      | No       | `false`      | Play animation on click **⚠️ _SmartTicker_ prop only**                                                                                                            |
| `recalcDeps`         | `[]`                                           | No       | `[]`         | Array of dependencies that trigger recalculation of the component                                                                                                 |
| `disableSelect`      | `boolean`                                      | No       | `false`      | Controls the possibility of a user to select text in a ticker                                                                                                     |
| `style`              | `CSSProperties`                                | No       | `null`       | Ticker component custom CSS styles                                                                                                                                |
| `containerStyle`     | `CSSProperties`                                | No       | `null`       | Ticker container component custom CSS styles                                                                                                                      |
| `forwardedRef`       | `ForwardedRef`                                 | No       | `null`       | Forwareded Ref for controlling the animation state                                                                                                                |

## Controlling the Play, Pause snd Reset States

The components provide methods for developers to control the ticker’s play, pause and resets state programmatically. These methods are accessible via `forwardedRef` and allow you to start, stop and reset the ticker based on your app’s requirements.

### Exposed Methods

To enable control over play and pause, react-smart-ticker uses forwardRef. The component exposes the following methods:

- **play()**: Starts the ticker animation.
- **pause()**: Pauses the ticker animation.
- **reset(isPaused: boolean)**: Resets the ticker animation. `isPaused` flag sets the state of the animation after resetting.

### Usage

To use these methods, you need to: 1. Create a reference using useRef. 2. Attach the ref to the SmartTicker component. 3. Call the play and pause methods directly from the ref.

### Example

Here’s an example of setting up and using play and pause with react-smart-ticker:

```javascript
import { useRef } from 'react';
import SmartTicker from 'react-smart-ticker';

function App() {
  // Create a ref to access SmartTicker methods
  const tickerRef = useRef<{
    play: () => void
    pause: () => void
    reset: (isPaused: boolean) => void
  }>(null)

  // Define handlers to control the ticker
  const handlePlay = () => {
    tickerRef.current?.play()
  }

  const handlePause = () => {
    tickerRef.current?.pause()
  }

  const handleReset = (isPaused: boolean = true) => {
    tickerRef.current?.reset(isPaused)
  }

  return (
    <div>
      <SmartTicker forwardedRef={tickerRef}>
        <p>Your ticker content goes here</p>
      </SmartTicker>

      <button onClick={() => { handlePlay() }}>Play</button>
      <button onClick={() => { handlePause() }}>Pause</button>
      <button onClick={() => { handleReset(true) }}>Reset (w/pause)</button>
    </div>
  )
}

export default App;
```

## Licence

This project is licensed under the MIT License - see the [LICENSE](https://github.com/eugen-k/react-smart-ticker/blob/main/LICENSE) file for details.
