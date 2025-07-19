(async () => {
  const video  = document.getElementById('video');
  const canvas = document.getElementById('canvas');

  async function captureFrameOnce() {
    let stream;
    try {
      stream = video.srcObject
        ? video.srcObject
        : await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;

      await new Promise(r => {
        if (video.readyState >= 2) r();
        else video.onloadedmetadata = () => r();
      });

      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      await fetch('/api/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: dataUrl })
      });
    } catch (err) {
      console.error('Auto-capture error:', err);
    } finally {
      if (stream) stream.getTracks().forEach(t => t.stop());
    }
  }

  window.runAutoCapture = captureFrameOnce;
  captureFrameOnce();
})();