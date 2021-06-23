export default `
<div editor-ref="TrackBox">
  <div editor-ref="TrackBoxHeader">
    <div editor-ref="TrackBoxDrag" draggable="true">
      <i editor-ref="TrackBoxDragIcon" class="material-icons" >drag_indicator</i>
      <span editor-ref="TrackBoxDragText"></span>
    </div>
    <div editor-ref="TrackBoxMover"></div>
  </div>
  <div editor-ref="TrackBoxWaveform">
    <canvas editor-ref="TrackBoxWaveformCanvas"></canvas>
  </div>
  <div editor-ref="TrackBoxInfo">
    <i editor-ref="TrackBoxInfoIcon" class="material-icons"></i>
    <span editor-ref="TrackBoxInfoText" ></span>
  </div>
  <div editor-ref="TrackBoxOffset"></div>
  <div editor-ref="TrackBoxActivator"></div>
</div>
`
