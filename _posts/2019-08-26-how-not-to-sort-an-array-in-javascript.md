---
layout: post
title: 'How not to sort an array in JavaScript'
tags:
  - javascript
image: posts/sorting
image_alt: 'Sorting a JavaScript array containing undefined, null and NaN.'
---

Array sorting is one of those things you don't spend too long thinking about, until it stops working for you. Recently I was working with array of items in JavaScript that were not sorting at all properly and completely messing up an interface. It took me way too long to work out what went wrong so I wanted to share what happened and why it was so weird.

## Basic sorting

JavaScript has a `sort` method available on Array objects and running it will probably do what you expect. For example:

```javascript
const stringArray = ['cat', 'dog', 'ant', 'butterfly'];
stringArray.sort();
// => [ 'ant', 'butterfly', 'cat', 'dog' ]
```

It's even pretty good if you're sorting arrays that might have members that are `undefined`. [MDN says that "all undefined elements are sorted to the end of the array."](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort).

```javascript
const stringArrayWithUndefined = [
  'cat',
  undefined,
  'dog',
  undefined,
  'ant',
  'butterfly',
  'zebra'
];
stringArrayWithUndefined.sort();
// => [ 'ant', 'butterfly', 'cat', 'dog', 'zebra', undefined, undefined ]
```

## Gotchas

The first issue you might come across is if you find yourself with an array containing `null`.

```javascript
const stringArrayWithUndefinedAndNull = [
  'cat',
  undefined,
  'dog',
  undefined,
  'ant',
  null,
  'butterfly',
  'zebra'
];
stringArrayWithUndefinedAndNull.sort();
// => [ 'ant', 'butterfly', 'cat', 'dog', null, 'zebra', undefined, undefined ]
```

Sorting will coerce the `null` to the string `"null"` which will appear somewhere in the middle of the alphabet.

Then there are numbers. The default JavaScript sorting algorithm is to convert all members of an array to strings and then compare their sequences of UTF-16 code unit values. This works great for arrays of strings as we've already seen, but it breaks down very quickly for numbers.

```javascript
const numberArray = [5, 3, 7, 1];
numberArray.sort();
// => [ 1, 3, 5, 7 ]

const biggerNumberArray = [5, 3, 10, 7, 1];
biggerNumberArray.sort();
// => [ 1, 10, 3, 5, 7 ]
```

In the example above, 10 gets sorted to before 3 because "10" is sorted before "3".

We can fix this by providing JavaScript a comparison function to use to perform the sort. The function receives two items from the array and it needs to return a numeric value and whether that value is above, below or equal to zero defines how the items are sorted relative to each other. If the return value is less than zero, then the first item is sorted in front of the second, if the value is above zero then the second item is sorted in front of the first. If the return value is 0 then the items stay in the same order with respect to each other.

To sort numbers in ascending order, the comparison function is relatively simple:

```javascript
const compareNumbers = (a, b) => a - b;
```

Subtracting the first item from the second one satisfies the requirements above. Using this comparison function with our `biggerNumberArray` from earlier will sort the numbers correctly.

```javascript
biggerNumberArray.sort(compareNumbers);
// => [ 1, 3, 5, 7, 10 ]
```

This still works if you have `undefined` elements as they are ignored and sorted to the end.

```javascript
const numberArrayWithUndefined = [5, undefined, 3, 10, 7, 1];
numberArrayWithUndefined.sort(compareNumbers);
// => [ 1, 10, 3, 5, 7, undefined ]
```

`null` causes problems again though.

```javascript
const numberArrayWithUndefinedAndNull = [5, undefined, 3, null, 10, 7, 1];
numberArrayWithUndefinedAndNull.sort(compareNumbers);
// => [ null, 1, 3, 5, 7, 10, undefined ]
```

This happens because coercing `null` to a number returns 0.

```javascript
Number(null);
// => 0
```

You could handle this in your `compareNumbers` function or be happy that it is consistent.

## Inconsistent gotchas

The biggest problem, and this caught me out recently, comes when `undefined` sneaks in another way. As we've seen, if the array contains `undefined` it's ignored and just sorted to the back. However, if you are sorting objects where the keys may be `undefined` this automatic sorting doesn't happen and the results become inconsistent.

For example, if you have an array of objects where some of them have values and some don't, trying to sort by that value will not give you the result you want.

```javascript
const objectArray = [
  { value: 1 },
  { value: 10 },
  {},
  { value: 5 },
  { value: 7 },
  { value: 3 }
];
const compareObjects = (a, b) => a.value - b.value;
objectArray.sort(compareObjects);
// => [ { value: 1 },
//      { value: 10 },
//      {},
//      { value: 3 },
//      { value: 5 },
//      { value: 7 } ]
```

Subtracting a number from `undefined` or subtracting `undefined` from a number both return `NaN` and since that doesn't lay on the scale of numbers that `sort` needs from the comparison function the results end up a little strange. In this case, the item that caused the problem stays where it started in the array and the other objects are locally sorted.

There are a few ways around this, but the important thing is knowing that it can happen. In my case when I came across this, I filtered out the items that didn't have a value as they weren't important until they did.

```javascript
objectArray
  .filter(obj => typeof obj.value !== 'undefined')
  .sort(compareObjects);
// => [ { value: 1 },
//      { value: 3 },
//      { value: 5 },
//      { value: 7 },
//      { value: 10 } ]
```

## Beware sorting

The upshot of all of this is that the `sort` function is not as straightforward as it might seem. Strings work, numbers need some input and while `undefined` is handled as a primitive you have to keep an eye on coercing `null`s or `undefined` object values.

Have you come across problems sorting in JavaScript or other languages? I'd love to hear your stories too, so give me a shout on [Twitter at @philnash](https://twitter.com/philnash).
