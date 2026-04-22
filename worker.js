export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    // /transcribe → Groq Whisper STT
    if (url.pathname === '/transcribe') {
      const body = await request.formData();
      const resp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.GROQ_KEY}` },
        body,
      });
      const data = await resp.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // /chat → Groq Llama streaming
    if (url.pathname === '/chat') {
      const body = await request.json();
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return new Response(resp.body, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' } });
    }

    // /tts → Cartesia TTS
    if (url.pathname === '/tts') {
      const body = await request.json();
      const resp = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'X-API-Key': env.CARTESIA_KEY,
          'Cartesia-Version': '2024-06-10',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const blob = await resp.arrayBuffer();
      return new Response(blob, { headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' } });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};
