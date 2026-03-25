export default function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  res.status(200).json({
    keyExists: !!key,
    keyLength: key ? key.length : 0,
    keyStart: key ? key.substring(0, 10) : 'none',
    keyEnd: key ? key.substring(key.length - 4) : 'none'
  });
}
