const content = document.querySelector('#content');
const question = document.querySelector('#question');
const result = document.querySelector('#result');
const status = document.querySelector('#status');
async function request(url, body) {
  if (content.value.trim().length < 100) throw new Error('Please add at least 100 characters of paper content.');
  status.textContent = 'Thinking…'; result.textContent = '';
  const response = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
  const data = await response.json(); if (!response.ok) throw new Error(data.detail || 'Request failed');
  status.textContent = 'Complete'; return data.result;
}
document.querySelectorAll('[data-task]').forEach(button => button.addEventListener('click', async () => {
  try { const data = await request('/api/analyze', {content:content.value, task:button.dataset.task}); result.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data; } catch (e) { status.textContent='Error'; result.textContent=e.message; }
}));
document.querySelector('#ask').addEventListener('click', async () => {
  try { if (!question.value.trim()) throw new Error('Enter a question first.'); result.textContent = await request('/api/ask', {content:content.value, question:question.value}); } catch (e) { status.textContent='Error'; result.textContent=e.message; }
});

