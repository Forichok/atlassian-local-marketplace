import axios from 'axios';
import * as cheerio from 'cheerio';
import { retry } from '../utils/retry';
import { config } from '../config';
import { VersionHistoryEntry } from '../types';

export class HtmlParser {
  async parseVersionHistory(
    appId: string,
    slug: string
  ): Promise<VersionHistoryEntry[]> {
    const url = `${config.marketplace.baseUrl}/apps/${appId}/${slug}/version-history`;

    const html = await retry(
      async () => {
        const response = await axios.get(url, {
          timeout: 30000,
          headers: {
            'User-Agent': 'DC-PluginX/1.0',
          },
        });
        return response.data as string;
      },
      {
        maxRetries: config.marketplace.maxRetries,
        retryDelay: config.marketplace.retryDelay,
        onRetry: (error, attempt) => {
          console.log(
            `Retry attempt ${attempt} for parseVersionHistory (${appId}/${slug}): ${error.message}`
          );
        },
      }
    );

    return this.extractVersionHistory(html);
  }

  private extractVersionHistory(html: string): VersionHistoryEntry[] {
    const $ = cheerio.load(html);
    const versions: VersionHistoryEntry[] = [];

    $('.version-item, .version-row, [data-version]').each((_, element) => {
      const $el = $(element);

      const version = this.extractVersion($el);
      if (!version) return;

      const entry: VersionHistoryEntry = {
        version,
        releaseDate: this.extractReleaseDate($el),
        releaseNotes: this.extractReleaseNotes($el),
        jiraMin: this.extractJiraVersion($el, 'min'),
        jiraMax: this.extractJiraVersion($el, 'max'),
        dataCenterCompatible: this.extractDataCenterCompatibility($el),
        downloadUrl: this.extractDownloadUrl($el),
        hidden: this.extractHiddenStatus($el),
        deprecated: this.extractDeprecatedStatus($el),
      };

      versions.push(entry);
    });

    return versions;
  }

  private extractVersion($el: cheerio.Cheerio<any>): string | null {
    const versionText =
      $el.attr('data-version') ||
      $el.find('.version-number, .version-name, h3, h4').first().text().trim() ||
      $el.find('[class*="version"]').first().text().trim();

    const match = versionText.match(/(\d+\.[\d.]+(?:-[\w.]+)?)/);
    return match ? match[1] : null;
  }

  private extractReleaseDate($el: cheerio.Cheerio<any>): Date | undefined {
    const dateText = $el
      .find('.release-date, .date, time, [datetime]')
      .first()
      .attr('datetime') || $el.find('.release-date, .date').text().trim();

    if (!dateText) return undefined;

    const date = new Date(dateText);
    return isNaN(date.getTime()) ? undefined : date;
  }

  private extractReleaseNotes($el: cheerio.Cheerio<any>): string | undefined {
    const notes = $el
      .find('.release-notes, .description, .changelog, [class*="notes"]')
      .first()
      .html();

    return notes?.trim() || undefined;
  }

  private extractJiraVersion($el: cheerio.Cheerio<any>, type: 'min' | 'max'): string | undefined {
    const compatText = $el.find('.compatibility, .compatible-versions, [class*="compat"]').text();

    const pattern = type === 'min'
      ? /(?:min|from|>=?)\s*:?\s*(\d+\.[\d.]+)/i
      : /(?:max|to|<=?)\s*:?\s*(\d+\.[\d.]+)/i;

    const match = compatText.match(pattern);
    return match ? match[1] : undefined;
  }

  private extractDataCenterCompatibility($el: cheerio.Cheerio<any>): boolean {
    const text = $el.text().toLowerCase();
    return (
      text.includes('data center') ||
      text.includes('datacenter') ||
      $el.find('[class*="datacenter"], [class*="data-center"]').length > 0
    );
  }

  private extractDownloadUrl($el: cheerio.Cheerio<any>): string | undefined {
    const downloadLink = $el.find('a[href*="download"], a[href$=".jar"]').first().attr('href');
    return downloadLink || undefined;
  }

  private extractHiddenStatus($el: cheerio.Cheerio<any>): boolean {
    return (
      $el.hasClass('hidden') ||
      $el.attr('data-hidden') === 'true' ||
      $el.find('.hidden, [data-hidden="true"]').length > 0
    );
  }

  private extractDeprecatedStatus($el: cheerio.Cheerio<any>): boolean {
    const text = $el.text().toLowerCase();
    return (
      text.includes('deprecated') ||
      $el.hasClass('deprecated') ||
      $el.find('.deprecated').length > 0
    );
  }
}
