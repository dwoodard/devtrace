// Captures page metadata: title, content snapshots, URL parameters
export class PageMetadataCapture {
  constructor(cdpClient, onMetadata) {
    this.cdpClient = cdpClient;
    this.onMetadata = onMetadata;
    this.lastTitle = null;
    this.lastUrl = null;

    this.setupListeners();
  }

  setupListeners() {
    // Track title changes
    this.cdpClient.on('Page.titleChanged', (params) => {
      if (params.title && params.title !== this.lastTitle) {
        this.lastTitle = params.title;
        this.onMetadata({
          type: 'page-title-changed',
          title: params.title,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Track URL changes
    this.cdpClient.on('Page.frameNavigated', (params) => {
      const { frame } = params;
      if (!frame.parentId && frame.url !== this.lastUrl) {
        this.lastUrl = frame.url;
        const params_extracted = this.extractUrlParams(frame.url);
        this.onMetadata({
          type: 'page-navigation',
          url: frame.url,
          searchQuery: params_extracted.q || params_extracted.query || params_extracted.s,
          params: params_extracted,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  extractUrlParams(urlString) {
    try {
      const url = new URL(urlString);
      const params = {};
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    } catch (err) {
      return {};
    }
  }

  async capturePageContent() {
    try {
      const result = await this.cdpClient.send('Runtime.evaluate', {
        expression: `({
          title: document.title,
          url: window.location.href,
          textContent: document.body.innerText?.substring(0, 500),
          links: Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText, href: a.href })).slice(0, 10),
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText).slice(0, 10),
          forms: Array.from(document.querySelectorAll('form')).map(f => ({ action: f.action, method: f.method, inputs: Array.from(f.querySelectorAll('input')).map(i => i.name).slice(0, 5) })),
        })`,
        returnByValue: true,
      });

      if (result.result.value) {
        this.onMetadata({
          type: 'page-content-snapshot',
          content: result.result.value,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      // Skip on error - page not ready
    }
  }
}
