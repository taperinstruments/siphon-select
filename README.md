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

### `data-permission-granted` Attribute

The `data-permission-granted` is added if `siphon-select` can determine whether permission has been granted i.e. if the labels for a given media type have labels.

---

Copyright © 2021+ Dom Christie and released under the MIT license.
