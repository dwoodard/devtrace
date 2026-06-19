export function setupPageCapture(cdpClient, onPageChange) {
  cdpClient.on('Page.frameNavigated', async (params) => {
    const { frame } = params;
    const { url, name } = frame;

    onPageChange({
      type: 'navigation',
      url,
      title: name || '',
      timestamp: new Date().toISOString(),
    });

    // Take a snapshot of the page
    try {
      const snapshot = await capturePageSnapshot(cdpClient);
      onPageChange({
        type: 'snapshot',
        snapshot,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to capture page snapshot:', err.message);
    }
  });
}

export async function capturePageSnapshot(cdpClient) {
  try {
    // Get page title
    const titleResult = await cdpClient.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true,
    });

    const title = titleResult.value || '';

    // Get page text content
    const textResult = await cdpClient.send('Runtime.evaluate', {
      expression: 'document.body.innerText.substring(0, 2000)',
      returnByValue: true,
    });

    const text = textResult.value || '';

    // Get buttons
    const buttonsResult = await cdpClient.send('Runtime.evaluate', {
      expression:
        'Array.from(document.querySelectorAll("button")).map(b => ({text: b.textContent, id: b.id})).slice(0, 10)',
      returnByValue: true,
    });

    const buttons = buttonsResult.value || [];

    // Get links
    const linksResult = await cdpClient.send('Runtime.evaluate', {
      expression:
        'Array.from(document.querySelectorAll("a")).map(a => ({text: a.textContent, href: a.href})).slice(0, 10)',
      returnByValue: true,
    });

    const links = linksResult.value || [];

    // Get forms
    const formsResult = await cdpClient.send('Runtime.evaluate', {
      expression:
        'Array.from(document.querySelectorAll("form")).map(f => ({id: f.id, name: f.name, inputs: Array.from(f.querySelectorAll("input")).map(i => ({name: i.name, type: i.type}))})).slice(0, 5)',
      returnByValue: true,
    });

    const forms = formsResult.value || [];

    return {
      title,
      text: text.substring(0, 1000),
      buttons: buttons.slice(0, 5),
      links: links.slice(0, 5),
      forms: forms.slice(0, 3),
    };
  } catch (err) {
    return {
      title: '',
      text: '',
      buttons: [],
      links: [],
      forms: [],
    };
  }
}
