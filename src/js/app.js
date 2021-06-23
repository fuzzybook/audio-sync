'use strict'
import Config from './utils/config'
import Zoom from './utils/zoom'
import Globals from './utils/globals'
import VideoStore from './video/video-storage'
import AudioEditor from './editor/audioEditor'
import Sizes from './utils/size'

window.loadSquyncEditor = () => {
	try {
		var event = new Event('squync-editor-ready')
		var eventError = new Event('squync-editor-error')
		if (!window.SquyncEditor) {
			window.SquyncEditor = {
				config: null,
				globals: null,
				sizes: null,
				videoStore: null,
				audioEditor: null,
				zoom: null,
				ready: false
			}
			window.SquyncEditor.init = node => {
				if (node) {
					node.innerHTML = `
        <div editor-ref="audio-editor-container">
          <div config-ref="config"></div>
          <div config-ref="colors"></div>
          <div editor-ref="editor-header">
            <div editor-ref="main-player"></div>
            <div editor-ref="debug"></div>
          </div>
          <div editor-ref="editor-app">
            <div editor-ref="editor-commands" class="editor-commands"></div>
            <div editor-ref="timeline">
              <div editor-ref="slider"></div>
              <div editor-ref="editor-box-frame"></div>
              <div editor-ref="editor-box">
                <div editor-ref="editor-rows">
                  <div editor-ref="canvas"></div>
                  <div editor-ref="rows-container"></div>
                </div>
              </div>
              <div class="placeholder"></div>
            </div>
          </div>
        </div>
        `
					var AudioContext =
						window.AudioContext || // Default
						window.webkitAudioContext || // Safari and old versions of Chrome
						false

					if (!AudioContext) {
						// Web Audio API is not supported
						// Alert the user
						alert('Sorry, but the Web Audio API is not supported by your browser. Please, consider upgrading to the latest version or downloading Google Chrome')
					}

					window.pastelleAudioContext = AudioContext
					window.SquyncEditor.config = new Config(node)
					window.SquyncEditor.zoom = new Zoom()
					window.SquyncEditor.globals = new Globals()
					window.SquyncEditor.sizes = new Sizes()
					window.SquyncEditor.videoStore = new VideoStore()
					window.SquyncEditor.audioEditor = new AudioEditor()
					window.SquyncEditor.ready = true
					window.SquyncEditor.audioContext = null
					window.SquyncEditor.OfflineAudioContext = null
					window.dispatchEvent(event)
				} else {
					console.log('no editor dom found')
					window.dispatchEvent(eventError)
				}
			}
		} else {
			console.log('SquyncEditor present!')
			window.dispatchEvent(event)
		}
	} catch (e) {
		console.log(e)
		window.dispatchEvent(eventError)
	}
}

window.loadSquyncEditor()
