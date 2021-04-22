// MIT License
// -----------
//
// Copyright (c) 2021 Dom Christie
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

;(function () {
  const PREFERRED_AUDIO_INPUT_LABEL = 'SIPHON_PREFERRED_AUDIO_INPUT_LABEL'
  const PREFERRED_AUDIO_OUTPUT_LABEL = 'SIPHON_PREFERRED_AUDIO_OUTPUT_LABEL'
  const PREFERRED_VIDEO_INPUT_LABEL = 'SIPHON_PREFERRED_VIDEO_INPUT_LABEL'

  class SiphonSelect extends HTMLSelectElement {
    constructor () {
      super()
      this.ready = new Promise((resolve) => this._ready = resolve)

      this._ondevicechange = () => this.reRender()
      navigator.mediaDevices.addEventListener('devicechange', this._ondevicechange)
      this._onchange = () => this.persist()
      this.addEventListener('change', this._onchange)
    }

    async connectedCallback () {
      await this.render()
      if (await this.permissionGranted) this.setValueFromPreferences()
      this._ready()
    }

    setValueFromStream (stream) {
      this.setValueFromLabel(deviceLabelFromStream(stream, this.mediaType))
      this.persist()
    }

    setValueFromPreferences () {
      const label = deviceLabelFromPreferences(this.mediaType)
      if (label) this.setValueFromLabel(label)
    }

    setValueFromLabel (label) {
      const options = Array.from(this.options)
      const option = options.find(o => o.textContent === label)
      if (option && !option.selected) {
        options.forEach(o => { o.selected = (o === option) })
      }
    }

    get mediaType () {
      return this.dataset.type
    }

    get devices () {
      return {
        audioinput: audioInputDevices,
        audiooutput: audioOutputDevices,
        videoinput: videoInputDevices
      }[this.mediaType]()
    }

    async render (options = {}) {
      const value = this.value

      const devices = await this.devices
      devices.forEach((device, i) => {
        if (device.deviceId) {
          const option = this.findOrCreateOption(device)
          option.textContent = deviceLabel(device, i)
          option.selected = (device.label === options.selected) || device.deviceId === value
        }
      })

      if (await this.permissionGranted) {
        this.setAttribute('data-permission-granted', '')
      } else {
        this.removeAttribute('data-permission-granted')
      }
    }

    reRender (options) {
      Array.from(this.options).forEach(o => o.remove())
      this.render(options)
    }

    findOrCreateOption (device) {
      let option = this.querySelector(`option[value="${device.deviceId}"]`)
      if (!option) {
        option = document.createElement('option')
        option.value = device.deviceId
        this.appendChild(option)
      }
      return option
    }

    get permissionGranted () {
      return {
        audioinput: isAudioInputPermissionGranted,
        audiooutput: isAudioOutputPermissionGranted,
        videoinput: isVideoInputPermissionGranted
      }[this.mediaType]()
    }

    persist () {
      const label = this.options[this.selectedIndex].textContent
      const kinds = {
        audioinput: PREFERRED_AUDIO_INPUT_LABEL,
        audiooutput: PREFERRED_AUDIO_OUTPUT_LABEL,
        videoinput: PREFERRED_VIDEO_INPUT_LABEL
      }
      localStorage.setItem(kinds[this.mediaType], label)
    }

    disconnectedCallback () {
      navigator.mediaDevices.removeEventListener('devicechange', this._ondevicechange)
      this.removeEventListener('change', this._onchange)
    }
  }

  function mediaDevices () {
    return navigator.mediaDevices.enumerateDevices()
  }

  function audioInputDevices () {
    return mediaDevices()
      .then(devices => devices.filter(device => device.kind === 'audioinput'))
  }

  function audioOutputDevices () {
    return mediaDevices()
      .then(devices => devices.filter(device => device.kind === 'audiooutput'))
  }

  function videoInputDevices () {
    return mediaDevices()
      .then(devices => devices.filter(device => device.kind === 'videoinput'))
  }

  function isAudioInputPermissionGranted () {
    return devicePermissionGranted(audioInputDevices())
  }

  function isAudioOutputPermissionGranted () {
    return devicePermissionGranted(audioOutputDevices())
  }

  function isVideoInputPermissionGranted () {
    return devicePermissionGranted(videoInputDevices())
  }

  function devicePermissionGranted (devices) {
    return devices.then(devices => devices.every(device => !!device.label))
  }

  function deviceLabel (device, index) {
    const kinds = {
      audioinput: 'Audio Input',
      audiooutput: 'Audio Output',
      videoinput: 'Video Input'
    }
    return device.label || `${kinds[device.kind]} ${index + 1}`
  }

  function deviceLabelFromStream (stream, mediaType) {
    if (mediaType === 'audioinput') return stream.getAudioTracks()[0].label
    if (mediaType === 'videoinput') return stream.getVideoTracks()[0].label
  }

  function deviceLabelFromPreferences (mediaType) {
    const kinds = {
      audioinput: PREFERRED_AUDIO_INPUT_LABEL,
      audiooutput: PREFERRED_AUDIO_OUTPUT_LABEL,
      videoinput: PREFERRED_VIDEO_INPUT_LABEL
    }
    return localStorage.getItem(kinds[mediaType])
  }

  customElements.define('siphon-select', SiphonSelect, { extends: 'select' })
})()
