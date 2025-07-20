import fetch from 'node-fetch';
import FormData from 'form-data';

export default async function handler(req, res) {
  try {
    // 1) Read raw JSON body
    let txt = '';
    for await (const chunk of req) txt += chunk;
    const { image } = JSON.parse(txt);
    if (!image) throw new Error('No image provided');

    // 2) Decode the Data-URL
    const m = image.match(/^data:(.+);base64,(.+)$/);
    if (!m) throw new Error('Invalid image format');
    const [, mime, b64] = m;
    const buffer = Buffer.from(b64, 'base64');

    // 3) Build a multipart/form for Telegram
    const form = new FormData();
    form.append('chat_id', process.env.TELEGRAM_CHAT_ID);
    form.append('photo', buffer, {
      filename: 'snapshot.jpg',
      contentType: mime
    });

    // 4) Send to Telegram
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const tgRes = await fetch(url, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    if (!tgRes.ok) {
      const err = await tgRes.text();
      console.error('Telegram error:', err);
      return res.status(502).send(err);
    }

    // 5) Done!
    res.status(200).send('OK');
  } catch (err) {
    console.error('Function error:', err);
    res.status(500).send(err.message);
  }
}

// turn off automatic body parsing
export const config = { api: { bodyParser: false } };
