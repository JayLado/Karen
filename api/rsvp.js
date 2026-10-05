module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const body = req.body || {};
  const { name, contact, attendance, message } = body;

  if (!name || !contact || !attendance) {
    return res.status(400).json({ ok: false, message: 'Missing required fields.' });
  }

  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!appsScriptUrl) {
    return res.status(500).json({ ok: false, message: 'Google Apps Script URL is not configured.' });
  }

  try {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ name, contact, attendance, message: message || '' })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Google Apps Script error:', text);
      return res.status(502).json({ ok: false, message: 'Unable to save RSVP.' });
    }

    return res.status(200).json({ ok: true, message: 'RSVP received.' });
  } catch (error) {
    console.error('RSVP forwarding error:', error);
    return res.status(500).json({ ok: false, message: 'Something went wrong while sending your reply.' });
  }
};
