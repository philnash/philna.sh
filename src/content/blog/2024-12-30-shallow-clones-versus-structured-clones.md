---
title: "Shallow clones versus structured clones"
tags:
  - javascript
image: ../../assets/posts/structuredClone/shallow-clones-versus-structured-clones.jpg
imageAlt: "Two hands holding up a paper chain of four men, all copies of one of them."
imageWidth: 1920
imageHeight: 600
pubDate: "2024-12-30"
---

Have you ever had one of those times when you think you're doing everything right, yet still you get an unexpected bug in your application? Particularly when it is state-related and you thought you did everything you could to isolate the state by making copies instead of mutating it in place.

*Especially* when you are, say, [building a game](https://www.datastax.com/blog/building-unreel-ai-movie-quiz) that copies a blank initial state when you create a new room and, no matter what you do, you still find that *every player is in every room*.

If you find yourself in this sort of situation, like I might have recently, then it's almost certain that you have nested state, you are only making a shallow clone, and you should be using [`structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone).

## Shallow copies of nested states

Here's a simple version of the issue I described above. We have a default state and when we generate a new room that state is cloned to the room. The room has a function to add a player to its state.

```js
const defaultState = {
  roomName: "",
  players: []
}

class Room {
  constructor(name) {
    this.state = { ...defaultState, roomName: name }
  }

  addPlayer(playerName) {
    this.state.players.push(playerName);
  }
}
```

You can create a new room and add a player to it.

```js
const room = new Room("room1");
room.addPlayer("Phil");
console.log(room.state);
// { roomName: "room1", players: ["Phil"] }
```

But if you try to create a second room, you'll find the player is already in there.

```js
const room2 = new Room("room2");
console.log(room2.state);
// { roomName: "room2", players: ["Phil"] }
```

It turns out the player even entered the default state.

```js
console.log(defaultState);
// { roomName: "", players: ["Phil"] }
```

The issue is the clone of the default state that was made in the constructor. It uses [object spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) (though it could have been using [`Object.assign`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)) to make a *shallow clone* of the default state object, but a shallow clone is only useful for cloning primitive values in the object. If you have values like arrays or objects, they aren't cloned, the reference to the original object is cloned.

You can see this because the `players` array in the above example is equal across the default state and the two rooms.

```js
defaultState.players === room.state.players;
// true
defaultState.players === room2.state.players;
// true
room.state.players === room2.state.players;
// true
```

Since all these references point to the same object, whenever you make an update to any room's players, all rooms and the default state will reflect that.

## How to make a deep clone

There have been many ways in JavaScript over the years to make deep clones of objects, examples include [Lodash's `cloneDeep`](https://lodash.com/docs/#cloneDeep) and using `JSON` to `stringify` and then `parse` an object. However it turned out that the web platform already had an underlying algorithm to perform deep clones through APIs like [`postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

In 2015 [it was suggested on a W3C mailing list](https://lists.w3.org/Archives/Public/public-webapps/2015AprJun/0251.html) that the algorithm was exposed publicly, though it took until late 2021 when Deno, Node.js and Firefox released support for `structuredClone`, followed in 2022 by the other browsers.

If you want to make a deep clone of an object in JavaScript you should use `structuredClone`.

### Using structuredClone

Let's see the function in action. If we update the `Room` class from the example above to use `structuredClone`, it looks like this:

```js
class Room {
  constructor(name) {
    this.state = structuredClone(defaultState);
    this.state.roomName = name;
  }

  addPlayer(playerName) {
    this.state.players.push(playerName);
  }
}
```

Creating one room acts as it did before:

```js
const room = new Room("room1");
room.addPlayer("Phil");
console.log(room.state);
// { roomName: "room1", players: ["Phil"] }
```

But creating a second room now works as expected, the players are no longer shared.

```js
const room2 = new Room("room2");
console.log(room2.state);
// { roomName: 'room2', players: [] }
```

And the players arrays are no longer equal references, but completely different objects:

```js
defaultState.players === room.state.players;
// false
defaultState.players === room2.state.players;
// false
room.state.players === room2.state.players;
// false
```

It is worth reading how the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) works and what doesn't work. For example, you cannot deep clone `Function` objects or DOM nodes, but circular references are handled with no problem.

## What a state

If you find yourself in a pickle when trying to clone your state, it may be because you are only making a shallow clone. If you have a simple state that is made up of primitives, then it is fine to use a shallow clone. Once you introduce nested objects that's when you need to consider using `structuredClone` to create a deep clone and avoid just copying references.

If you do find yourself facing this issue, I hope it takes you less time than it took me to realise what was going on.