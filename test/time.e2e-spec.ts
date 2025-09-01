import {
  getCurrentTime,
  mockTime,
  removeTimeMock,
} from './common/time.test.methods';
import moment from 'moment';

const testDateTime = '2025-01-01T09:43:52.123Z';

// we can use mock time from one test suite only - skip it while we use mock in billing tests
describe.skip('TimeController (e2e)', () => {
  it('get time', async () => {
    const now = moment();
    const curTime = await getCurrentTime();
    const nowFromTimeService = moment(curTime);
    expect(now.isSame(nowFromTimeService, 'day')).toBe(true);
  });

  it('mock time', async () => {
    const dateToMock = moment(testDateTime);
    await mockTime(testDateTime);

    const nowFromTimeService = moment(await getCurrentTime());
    expect(dateToMock.isSame(nowFromTimeService, 'day')).toBe(true);
  });

  it('remove mock', async () => {
    await removeTimeMock();
    const now = moment();
    const nowFromTimeService = moment(await getCurrentTime());
    expect(now.isSame(nowFromTimeService, 'day')).toBe(true);
  });
});
