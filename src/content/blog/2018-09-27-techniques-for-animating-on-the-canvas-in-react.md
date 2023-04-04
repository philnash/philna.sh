---
title: 'Techniques for animating on the canvas in React'
tags:
  - react
  - javascript
  - animation
  - canvas
image: /posts/react.png
imageAlt: 'The React logo slowly spinning'
video: /posts/react_vid.mp4
videoWidth: 1280
videoHeight: 400
showImage: false
pubDate: "2018-09-27"
---

I recently experimented with [audio visualisation in React on the Twilio blog](https://www.twilio.com/blog/audio-visualisation-web-audio-api--react). While I meant to teach myself more about the web audio API I found that I picked up a few techniques for animating in canvas within a React project. If you're creating a canvas animation in React then perhaps this will help you too.

## Good references

First up, if you've used React before you'll know that you're supposed to avoid touching the <abbr title="Document Object Model">DOM</abbr> and let React handle it. If you've worked with an HTML5 `<canvas>` before, you'll also know that to get a context with which to draw on the canvas, you need to call directly on the canvas element itself. Thankfully this is an edge case that [React supports through refs](https://reactjs.org/docs/refs-and-the-dom.html).

To get a ref to a canvas element inside a React component you first need to create the ref in the constructor using `React.createRef`. When you come to render the canvas element, add a prop called `ref` that points to the ref you created.

```jsx
class Animation extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  render() {
    return (
      <div>
        <canvas ref={this.canvasRef} />
      </div>
    );
  }
}
```

Once you've set it up this way, you can then refer to the canvas element through the ref's `current` property, for example in `componentDidMount`:

```javascript
  componentDidMount() {
    const canvas = this.canvasRef.current;
    const context = canvas.getContext('2d');
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
```

Now you have the context you can draw and animate all you like.

## Separating animation and drawing

A lot of building with React is about maintaining the state of the view. The first time I animated something on a canvas in React I held the state and the code to draw it in the same component. After browsing examples online, I came across [this rotating square on CodePen](https://codepen.io/vasilly/pen/NRKyWL). What I really liked about this example was the way the state was separated from the drawing with the use of two components. The state of the drawing was then passed from the animating component to the drawing component through props.

I recreated the original to show the separation.

First you define a `Canvas` component that draws an image using the props as parameters.

```jsx
class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidUpdate() {
    // Draws a square in the middle of the canvas rotated
    // around the centre by this.props.angle
    const { angle } = this.props;
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.save();
    ctx.beginPath();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.fillStyle = '#4397AC';
    ctx.fillRect(-width / 4, -height / 4, width / 2, height / 2);
    ctx.restore();
  }

  render() {
    return <canvas width="300" height="300" ref={this.canvasRef} />;
  }
}
```

Then you create an `Animation` component that runs an animation loop using [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame). Each time the animation loop runs you update the parameters of the animation in the state and let React render the `Canvas` with the updated props.

Don't forget to implement `componentWillUnmount` to stop the `requestAnimationFrame` loop too.

```jsx
class Animation extends React.Component {
  constructor(props) {
    super(props);
    this.state = { angle: 0 };
    this.updateAnimationState = this.updateAnimationState.bind(this);
  }

  componentDidMount() {
    this.rAF = requestAnimationFrame(this.updateAnimationState);
  }

  updateAnimationState() {
    this.setState(prevState => ({ angle: prevState.angle + 1 }));
    this.rAF = requestAnimationFrame(this.updateAnimationState);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rAF);
  }

  render() {
    return <Canvas angle={this.state.angle} />;
  }
}
```

You can see [this in action in this pen](https://codepen.io/philnash/pen/QVeOrd).

## Rerendering

A concern when animating or doing other intensive visual updates in React is rerendering child elements too often, causing [jank](http://jankfree.org/). When we are drawing on the canvas we never want the canvas element itself to be rerendered. So what's the best way to hint to React that we don't want that to happen?

You might be thinking of the [`shouldComponentUpdate`](https://reactjs.org/docs/react-component.html#shouldcomponentupdate) lifecycle method. Returning `false` from `shouldComponentUpdate` will let React know that this component doesn't need to change. However, if we're using the pattern above, returning `false` from `shouldComponentUpdate` will skip running `componentDidUpdate` and that's responsible for our drawing.

I eventually came across [this answer from Dan Abramov to a question on StackOverflow](https://stackoverflow.com/a/49803151/28376). We can create a `PureCanvas` component that implements `shouldComponentUpdate` and returns `false` and use a [callback ref](https://reactjs.org/docs/refs-and-the-dom.html#callback-refs) to get the reference to the canvas element in a parent `Canvas` component.

_Note: in [Dan's answer](https://stackoverflow.com/a/49803151/28376) he says that using the pattern above should be ok and the following technique is likely only necessary if you have profiled your application and found it makes a difference._

Updating the example above, we split the `Canvas` component into a `Canvas` and a `PureCanvas`. First, the `PureCanvas` uses a callback ref and a callback provided through the props to return the canvas context to the parent component. It also renders the canvas element itself.

```jsx
class PureCanvas extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <canvas
        width="300"
        height="300"
        ref={node =>
          node ? this.props.contextRef(node.getContext('2d')) : null
        }
      />
    );
  }
}
```

Then the `Canvas` component passes a callback function, `saveContext`, as the `contextRef` prop when rendering the `PureCanvas`. When the function is called we save the context (and cache the canvas element's width and height). The rest of the differences from before are turning references to `ctx` to `this.ctx`.

```jsx
class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.saveContext = this.saveContext.bind(this);
  }

  saveContext(ctx) {
    this.ctx = ctx;
    this.width = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;
  }

  componentDidUpdate() {
    const { angle } = this.props;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.rotate((angle * Math.PI) / 180);
    this.ctx.fillStyle = '#4397AC';
    this.ctx.fillRect(
      -this.width / 4,
      -this.height / 4,
      this.width / 2,
      this.height / 2
    );
    this.ctx.restore();
  }

  render() {
    return <PureCanvas contextRef={this.saveContext} />;
  }
}
```

Even though it is not necessary, I find this separation between animation, drawing and rendering the canvas element itself quite pleasing. You can [see this example in action on CodePen too](https://codepen.io/philnash/pen/pxzVzw).

## Canvas vs React

It's been an interesting journey working with a canvas element within React. The way they work feels very different to each other, so getting them in sync wasn't necessarily straightforward. Hopefully if you have this problem then these techniques can help you.

If you're interested in other animations in React, do please check out my article on [audio visualisation in React](https://www.twilio.com/blog/audio-visualisation-web-audio-api--react).

If you have another way of working with canvas in React I'd love to hear. Drop me a note on Twitter at [@philnash](https://twitter.com/philnash).
