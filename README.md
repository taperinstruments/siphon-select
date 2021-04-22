# Siphon Select

A web component for selecting media devices. It aims to deal with [the complexities of handling audio/visual hardware](https://dev.to/lazerwalker/why-video-chat-is-a-hard-technical-problem-43gj#problem-1-accessing-av-hardware) in the browser, so you don't have to :)

## Features

- Convenience methods for rendering and updating chosen devices
- Automatically updates when devices are added or removed
- Automatically stores and recalls user's preferred device choices

## Usage

Include `siphon-select.js` in your project, then render a `select` element, adding the required attributes:

- `is="siphon-select"` and
- a `data-type` attribute (one of `audioinput`, `audiooutput`, or `videoinput`)

```html
<select is="siphon-select" data-type="audioinput"></select>
```

**Note**: `siphon-select` is a [customized built-in element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#customized_built-in_elements) which is not yet supported in some browsers. For broad browser support, include a [custom elements **polyfill**](https://github.com/ungap/custom-elements).

## API

### `ready`

A `Promise` that resolves when the component has connected, initially rendered, and any recalled preferences have been set. It's important to wait for this to resolve if you're retrieving a value shortly after the element is rendered. For example, to immediately access a stream if permission is already granted:

```js
let stream
const select = document.querySelector('[is="siphon-select"]')

if (await select.permissionGranted) {
  await select.ready
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: select.value }
  })
}
```

### `permissionGranted`

A `Promise` that resolves to `true` or `false` depending on whether permission has been granted i.e. if the labels for a given media type have labels.

### `data-permission-granted` Attribute

The `data-permission-granted` is added if `siphon-select` can determine whether permission has been granted (see above).

### `render()`

Calling `render` will update the options with labels, as well as adding the `data-permission-granted` (if applicable). `render` is typically called after the initial call to `navigator.mediaDevices.getUserMedia(…)`.

Returns a `Promise` that resolves to `undefined`.

### `setValueFromStream(MediaStream)`

When a stream has been requested successfully, pass it in to `setValueFromStream` and `siphon-select` will determine which device has been chosen, and select the option accordingly. This is typically called after the initial call to `navigator.mediaDevices.getUserMedia(…)`. Be sure that `siphon-select` has rendered, for example:

```js
let stream = await navigator.mediaDevices.getUserMedia({ audio: true })
const select = document.querySelector('[is="siphon-select"]')

// Re-render select to display labels
await select.render()

// Select the chosen device
select.setValueFromStream(stream)
```

## Walkthrough of a suggested usage pattern

Suggested usage pattern for audio input devices as demonstrated in `index.html`.

### 1. Set up the HTML

```html
<select is="siphon-select" data-type="audioinput"></select>
<button id="enable">Enable</button>
```

### 2. Style it

The `data-permission-granted` provides a nice way for declarative styles: initially hide the `select` dropdown; once permission is granted, display it and hide the enable button.

```css
[is="siphon-select"] {
  display: none;
}
[is="siphon-select"][data-permission-granted] {
  display: block;
}
[is="siphon-select"][data-permission-granted] ~ #enable {
  display: none;
}
```

### 3. Handle enable

Use a click handler to request access to the currently chosen audio device (by default, this will be the first option in the dropdown). Once requested successfully, re-render the `select`. As permission is now granted, this will display the `select` with device labels, and hide the enable button.

Some browsers, like Firefox, allow the user to select a device when asking for permission; others, like Chrome, let the user specify a default device in their browser settings. To ensure the `select` is accurate with the newly chosen device, we call `setValueFromStream`.

```js
let stream
const select = document.querySelector('[is=siphon-select]')
const enable = document.getElementById('enable')

enable.onclick = async function () {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: select.value }
  })
  await select.render()
  select.setValueFromStream(stream)
}
```

### 4. Handle device selection

Re-set the stream when the `select` changes. We'll create a reusable `setStream` function for this:

```js
let stream
const select = document.querySelector('[is=siphon-select]')
const enable = document.getElementById('enable')

enable.onclick = async function () {
  await setStream()
  await select.render()
  select.setValueFromStream(stream)
}

select.onchange = function () {
  setStream()
}

async function setStream () {
  // End an existing stream
  if (stream) stream.getTracks().forEach(track => track.stop())

  stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: select.value }
  })
}
```

### 5. Handle the initial case

If the user has previously granted permission, we can request access immediately. We'll need to be aware that device preferences are recalled when the `select` element is initially rendered. To ensure the correct device is requested, we'll need to wait for the `select` to be ready. So putting this al together:

```js
let stream
const select = document.querySelector('[is=siphon-select]')
const enable = document.getElementById('enable')

// If permission is granted, access the stream straightaway
if (await select.permissionGranted) setStream()

// Request access to stream, re-render once access is granted (and labels are available), then set the value
enable.onclick = async function () {
  await setStream()
  await select.render()
  select.setValueFromStream(stream)
}

select.onchange = function () {
  setStream()
}

async function setStream () {
  // End an existing stream
  if (stream) stream.getTracks().forEach(track => track.stop())

  // Ensure any recalled preferences have been set
  await select.ready
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: select.value }
  })
}
```

---

Copyright © 2021+ Dom Christie and released under the MIT license.
