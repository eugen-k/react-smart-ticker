# React Smart Ticker

Automatically displays text as a scrolling ticker/marquee when it overflows the container.

<div style="display: flex; align-items: center; height: 110px;">
<img src="https://github.com/eugen-k/react-smart-ticker-demo/blob/main/src/assets/gif/1-line.gif" alt="1-line" width="200" height="auto">
<img src="https://github.com/eugen-k/react-smart-ticker-demo/blob/main/src/assets/gif/multi-line.gif" alt="Multi-line" width="200" height="auto">
<img src="https://github.com/eugen-k/react-smart-ticker-demo/blob/main/src/assets/gif/html.gif" alt="HTML blocks ticker" width="200" height="auto">
</div>

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
> For complex elements (e.g. images) is recommended to use **SmartTicker** as browsers are performing [better](https://developer.mozilla.org/en-US/docs/Web/Performance/CSS_JavaScript_animation_performance) using CSS-based animation.

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

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/eugen-k/react-smart-ticker/blob/main/LICENSE) file for details.
