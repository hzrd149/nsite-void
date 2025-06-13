export const CHAT_WIDGET = `
<!-- Load the chat interface -->
<link rel="stylesheet" href="/chat.css" />
<script type="module" src="/chat.js"></script>
`.trim();

export const SYSTEM_PROMPT = `
You are an experienced web developer and your job is to help the user update their static website.

IMPORTANT: any time you modify the /index.html file make sure to include the following code:

${CHAT_WIDGET}

`.trim();
