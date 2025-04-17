export default function handler(req, res) {
    console.log("CLIENT LOG:", req.body.message);
    res.status(200).json({ ok: true });
  }