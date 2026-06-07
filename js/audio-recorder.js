// ================================================================
// Tidsbrev.no — Taleopptak (MediaRecorder-modul)
// ================================================================
// Selvstendig nettleser-modul. Ingen npm, kun browser-native API.
// Eksponerer window.AudioRecorder med:
//   isSupported()           -> bool
//   pickMimeType()          -> beste støttede MIME ('' hvis ingen)
//   extForMime(mime)        -> filendelse ('webm' | 'm4a' | 'ogg')
//   friendlyError(err)      -> varm norsk feilmelding
//   create({onTick,onStop,onAutoStop}) -> recorder-instans
//   MAX_DURATION_MS
//
// Recorder-instans:
//   start()        -> Promise (kan kaste ved nektet/manglende mikrofon)
//   stop()         -> stopper opptak (onStop kalles med Blob)
//   cancel()       -> avbryt og forkast
//   getMimeType()  -> valgt MIME
//   getExtension() -> filendelse
// ================================================================
(function () {
  'use strict';

  var MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutter
  // Feature-detect i prioritert rekkefølge:
  //   Chrome/Firefox -> audio/webm;codecs=opus, Safari/iOS -> audio/mp4
  var MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];

  function isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      typeof window.MediaRecorder !== 'undefined'
    );
  }

  function pickMimeType() {
    if (typeof window.MediaRecorder === 'undefined' ||
        typeof MediaRecorder.isTypeSupported !== 'function') {
      return '';
    }
    for (var i = 0; i < MIME_CANDIDATES.length; i++) {
      if (MediaRecorder.isTypeSupported(MIME_CANDIDATES[i])) return MIME_CANDIDATES[i];
    }
    return '';
  }

  function extForMime(mime) {
    if (!mime) return 'webm';
    if (mime.indexOf('mp4') !== -1) return 'm4a';
    if (mime.indexOf('ogg') !== -1) return 'ogg';
    return 'webm';
  }

  function friendlyError(err) {
    var name = err && err.name ? err.name : '';
    switch (name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
      case 'SecurityError':
        return 'Vi fikk ikke tilgang til mikrofonen. Gi nettleseren tillatelse, og prøv igjen.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'Vi fant ingen mikrofon. Koble til en mikrofon og prøv igjen.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Mikrofonen er opptatt av et annet program. Lukk det og prøv igjen.';
      default:
        return 'Noe gikk galt med opptaket. Prøv igjen, eller last opp en lydfil i stedet.';
    }
  }

  function formatTime(ms) {
    var total = Math.floor(ms / 1000);
    var m = Math.floor(total / 60);
    var s = total % 60;
    return (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s);
  }

  function createRecorder(opts) {
    opts = opts || {};
    var onTick     = typeof opts.onTick === 'function'     ? opts.onTick     : function () {};
    var onStop     = typeof opts.onStop === 'function'     ? opts.onStop     : function () {};
    var onAutoStop = typeof opts.onAutoStop === 'function' ? opts.onAutoStop : function () {};

    var mediaRecorder = null;
    var stream = null;
    var chunks = [];
    var mimeType = '';
    var startedAt = 0;
    var tickTimer = null;

    function clearTimer() {
      if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    }

    function releaseStream() {
      if (stream) {
        stream.getTracks().forEach(function (track) { track.stop(); });
        stream = null;
      }
    }

    function tick() {
      var elapsed = Date.now() - startedAt;
      onTick(formatTime(elapsed), elapsed);
      if (elapsed >= MAX_DURATION_MS) {
        onAutoStop();
        stop();
      }
    }

    function start() {
      if (!isSupported()) {
        var e = new Error('UNSUPPORTED');
        e.name = 'UnsupportedError';
        return Promise.reject(e);
      }
      mimeType = pickMimeType();
      return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
        stream = s;
        chunks = [];
        mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType: mimeType })
          : new MediaRecorder(stream);

        mediaRecorder.addEventListener('dataavailable', function (evt) {
          if (evt.data && evt.data.size > 0) chunks.push(evt.data);
        });
        mediaRecorder.addEventListener('stop', function () {
          clearTimer();
          releaseStream();
          var type = mimeType || (chunks[0] && chunks[0].type) || 'audio/webm';
          var blob = new Blob(chunks, { type: type });
          onStop(blob);
        });

        mediaRecorder.start();
        startedAt = Date.now();
        onTick('00:00', 0);
        tickTimer = setInterval(tick, 250);
      });
    }

    function stop() {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }

    function cancel() {
      clearTimer();
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try { mediaRecorder.stop(); } catch (e) { /* ignore */ }
      }
      releaseStream();
      chunks = [];
    }

    return {
      start: start,
      stop: stop,
      cancel: cancel,
      getMimeType: function () { return mimeType; },
      getExtension: function () { return extForMime(mimeType); }
    };
  }

  window.AudioRecorder = {
    isSupported: isSupported,
    pickMimeType: pickMimeType,
    extForMime: extForMime,
    friendlyError: friendlyError,
    formatTime: formatTime,
    create: createRecorder,
    MAX_DURATION_MS: MAX_DURATION_MS
  };
})();
