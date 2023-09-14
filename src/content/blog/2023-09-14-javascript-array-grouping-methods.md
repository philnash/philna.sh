---
title: "JavaScript is getting array grouping methods"
tags:
  - javascript
image: ../../assets/posts/node.png
imageAlt: "The Node.js logo"
imageWidth: 1920
imageHeight: 600
pubDate: "2023-09-14"
---

Grouping items in an array is one of those things you've probably done a load of times. Each time you would have written a grouping function by hand or perhaps reached for [lodash's `groupBy`](https://lodash.com/docs/4.17.15#groupBy) function.

The good news is that JavaScript is now getting grouping methods so you won't have to anymore. [`Object.groupBy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy) and [`Map.groupBy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy) are new methods that will make grouping easier and save us time or a dependency.

## Grouping until now

Let's say you have an array of objects representing people and you want to group them by their age. You might use a `forEach` loop like this:

```js
const people = [
  { name: "Alice", age: 28 },
  { name: "Bob", age: 30 },
  { name: "Eve", age: 28 },
];

const peopleByAge = {};

people.forEach((person) => {
  const age = person.age;
  if (!peopleByAge[age]) {
    peopleByAge[age] = [];
  }
  peopleByAge[age].push(person);
});
console.log(peopleByAge);
/* 
{
  "28": [{"name":"Alice","age":28}, {"name":"Eve","age":28}],
  "30": [{"name":"Bob","age":30}]
}
*/
```

Or you may choose to use `reduce`, like this:

```js
const peopleByAge = people.reduce((acc, person) => {
  const age = person.age;
  if (!acc[age]) {
    acc[age] = [];
  }
  acc[age].push(person);
  return acc;
}, {});
```

Either way, it's slightly awkward code. You always have to check the object to see whether the grouping key exists and if not, create it with an empty array. Then you can push the item into the array.

## Grouping with Object.groupBy

With the new `Object.groupBy` method, you can outcome like this:

```js
const peopleByAge = Object.groupBy(people, (person) => person.age);
```

Much simpler! Though there are some things to be aware of.

`Object.groupBy` returns a [null-prototype object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object#null-prototype_objects). This means the the object does not inherit any properties from `Object.prototype`. This is great because it means you won't accidentally overwrite any properties on `Object.prototype`, but it also means that the object doesn't have any of the methods you might expect, like `hasOwnProperty` or `toString`.

```js
const peopleByAge = Object.groupBy(people, (person) => person.age);
console.log(peopleByAge.hasOwnProperty("28"));
// TypeError: peopleByAge.hasOwnProperty is not a function
```

The callback function you pass to `Object.groupBy` should return a `string` or a `Symbol`. If it returns anything else, it will be coerced to a `string`.

In our example, we have been returning the `age` as a `number`, but in the result it is coerced to `string`. Though you can still access the properties using a `number` as using square bracket notation will also coerce the argument to `string`.

```js
console.log(peopleByAge[28]);
// => [{"name":"Alice","age":28}, {"name":"Eve","age":28}]
console.log(peopleByAge["28"]);
// => [{"name":"Alice","age":28}, {"name":"Eve","age":28}]
```

## Grouping with Map.groupBy

`Map.groupBy` does almost the same thing as `Object.groupBy` except it returns a [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/Map). This means that you can use all the usual `Map` functions. It also means that you can return any type of value from the callback function.

```js
const ceo = { name: "Jamie", age: 40, reportsTo: null };
const manager = { name: "Alice", age: 28, reportsTo: ceo };

const people = [
  ceo
  manager,
  { name: "Bob", age: 30, reportsTo: manager },
  { name: "Eve", age: 28, reportsTo: ceo },
];

const peopleByManager = Map.groupBy(people, (person) => person.reportsTo);
```

In this case, we are grouping people by who they report to. Note that to retrieve items from this `Map` by an object, the objects have to have the same identity.

```js
peopleByManager.get(ceo);
// => [{ name: "Alice", age: 28, reportsTo: ceo }, { name: "Eve", age: 28, reportsTo: ceo }]
peopleByManager.get({ name: "Jamie", age: 40, reportsTo: null });
// => undefined
```

In the above example, the second line uses an object that looks like the `ceo` object, but it is not the same object so it doesn't return anything from the `Map`. To retrieve items successfully from the `Map`, make sure you keep a reference to the object you want to use as the key.

## When will this be available?

The two `groupBy` methods are part of a [TC39 proposal that is currently at stage 3](https://github.com/tc39/proposal-array-grouping). This means that there is a good chance it will become a standard and, as such, there are implementations appearing.

[Chrome 117 just launched with support for these two methods](https://developer.chrome.com/en/blog/new-in-chrome-117/#array-grouping), Firefox Nightly has implemented them behind a flag. Safari had implemented these methods under different names, I'm sure they will be update that soon. As the methods are in Chrome that means they have been implemented in V8, so will be available in Node the next time V8 is updated.

## Why use static methods?

You might wonder why this is being implemented as `Object.groupBy` and not `Array.prototype.groupBy`. [According to the proposal](https://github.com/tc39/proposal-array-grouping#why-static-methods) there is a library that used to monkey patch the `Array.prototype` with an incompatible `groupBy` method. When considering new APIs for the web, backwards compatibility is hugely important. This was highligted a few years ago when trying to implement `Array.prototype.flatten`, in an event known as [SmooshGate](https://developer.chrome.com/blog/smooshgate/).

Fortunately, using static methods actually seems better for future extensibility. When the [Records and Tuples proposal](https://github.com/tc39/proposal-record-tuple) comes to fruition, we can add a `Record.groupBy` method for grouping arrays into an immutable record.

## JavaScript is filling in the gaps

Grouping items together is clearly an important thing we do as developers. [`lodash.groupBy` is currently downloaded from npm](https://www.npmjs.com/package/lodash.groupby) between 1.5 and 2 million times a week. It's great to see JavaScript filling in these gaps and making it easier for us to do our jobs.

For now, go get Chrome 117 and try these new methods out for yourself.
