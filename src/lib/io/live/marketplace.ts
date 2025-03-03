import { DateTime, Duration, Interval } from 'luxon';
import fetch from 'node-fetch';
import { RawLicense, RawTransaction } from "../../model/marketplace/raw";
import env from '../../parameters/env.js';
import { AttachableError } from '../../util/errors.js';
import cache from '../cache.js';
import { MarketplaceService, Progress } from '../interfaces.js';

export class LiveMarketplaceService implements MarketplaceService {

  async downloadTransactions(): Promise<RawTransaction[]> {
    return cache('transactions.json',
      await this.downloadMarketplaceData('/sales/transactions/export'));
  }

  async downloadLicensesWithoutDataInsights(): Promise<RawLicense[]> {
    return cache('licenses-without.json',
      await this.downloadMarketplaceData('/licenses/export?endDate=2018-07-01'));
  }

  async downloadLicensesWithDataInsights(progress: Progress): Promise<RawLicense[]> {
    const dates = dataInsightDateRanges();
    progress.setCount(dates.length);
    const promises = dates.map(async ({ startDate, endDate }) => {
      const json: RawLicense[] = await this.downloadMarketplaceData(`/licenses/export?withDataInsights=true&startDate=${startDate}&endDate=${endDate}`);
      progress.tick(`${startDate}-${endDate}`);
      return json;
    });
    return cache('licenses-with.json',
      (await Promise.all(promises)).flat());
  }

  private async downloadMarketplaceData<T>(subpath: string): Promise<T[]> {
    const res = await fetch(`https://marketplace.atlassian.com/rest/2/vendors/${env.mpac.sellerId}/reporting${subpath}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(env.mpac.user + ':' + env.mpac.pass).toString('base64'),
      },
    });

    let text;
    try {
      text = await res.text();
      return JSON.parse(text);
    }
    catch (e) {
      throw new AttachableError('Probably invalid Marketplace JSON.', text as string);
    }
  }

}

function dataInsightDateRanges() {
  return Interval.fromDateTimes(
    DateTime.local(2018, 7, 1),
    DateTime.local()
  ).splitBy(Duration.fromObject({ months: 2 })).map(int => ({
    startDate: int.start.toISODate(),
    endDate: int.end.toISODate(),
  }));
}
