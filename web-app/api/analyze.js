const fs = require('fs');
const { formidable } = require('formidable');

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function parseForm(req) {
  const form = formidable({
    maxFiles: 1,
    maxFileSize: MAX_IMAGE_BYTES,
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function locationHint(req) {
  const city = req.headers['x-vercel-ip-city'];
  const region = req.headers['x-vercel-ip-country-region'];
  const country = req.headers['x-vercel-ip-country'];
  return [city, region, country].filter(Boolean).join(', ') || 'unknown location';
}

function outputText(data) {
  if (data.output_text) return data.output_text;
  const message = (data.output || []).find(item => item.type === 'message');
  const text = message && (message.content || []).find(item => item.type === 'output_text');
  return text && text.text;
}

module.exports = async function analyze(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'YUK vision is not configured yet.' });
  }

  try {
    const { fields, files } = await parseForm(req);
    const image = first(files.image);
    const locale = first(fields.locale) || 'en';

    if (!image || !image.filepath) {
      return res.status(400).json({ error: 'Upload one image as the image field.' });
    }

    if (!image.mimetype || !image.mimetype.startsWith('image/')) {
      return res.status(415).json({ error: 'YUK only eats image files.' });
    }

    const buffer = await fs.promises.readFile(image.filepath);
    const dataUrl = `data:${image.mimetype};base64,${buffer.toString('base64')}`;
    const place = locationHint(req);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.4-nano',
        store: false,
        reasoning: { effort: 'none' },
        instructions: [
          'You are YUK, a playful trash-identification creature.',
          'Inspect the uploaded photo and identify the main discardable object and its material.',
          'Be conservative about disposal instructions. Waste rules vary by municipality and facility.',
          'Use the supplied location only as a hint. Never claim a local rule is verified unless it is universally obvious.',
          'If uncertain, say to check local rules rather than inventing a bin.',
          'The verdict is short, funny, lowercase, and can naturally use one of these emojis: 💩 🤢 🤮.',
          'The fate field explains the likely material journey in plain language, not a guaranteed outcome.',
          `User locale: ${locale}. Approximate location hint: ${place}.`,
        ].join('\n'),
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: 'Eat this trash and return the structured YUK analysis.' },
              { type: 'input_image', image_url: dataUrl },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'yuk_trash_analysis',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                item: { type: 'string' },
                emoji: { type: 'string' },
                material: { type: 'string' },
                materialKey: {
                  type: 'string',
                  enum: ['plastic', 'paper', 'organic', 'metal', 'ewaste', 'glass', 'composite', 'textile', 'unknown'],
                },
                bin: { type: 'string' },
                fate: { type: 'string' },
                verdict: { type: 'string' },
                tip: { type: 'string' },
              },
              required: ['item', 'emoji', 'material', 'materialKey', 'bin', 'fate', 'verdict', 'tip'],
              additionalProperties: false,
            },
          },
          verbosity: 'low',
        },
        max_output_tokens: 500,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('YUK vision upstream error', response.status, details.slice(0, 1000));
      return res.status(502).json({ error: 'YUK could not digest that photo.' });
    }

    const data = await response.json();
    const text = outputText(data);
    if (!text) {
      console.error('YUK vision returned no output text', data.id);
      return res.status(502).json({ error: 'YUK chewed the photo but produced no result.' });
    }

    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error('YUK analyze failed', error);
    return res.status(500).json({ error: 'YUK had a stomach problem.' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
