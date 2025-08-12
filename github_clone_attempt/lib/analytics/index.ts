type EventName = 'conversion_started' | 'conversion_succeeded' | 'conversion_failed';

export interface AnalyticsAdapter {
  track: (event: EventName, props?: Record<string, any>) => void;
}

class NoopAnalytics implements AnalyticsAdapter {
  track() {}
}

export const analytics: AnalyticsAdapter = new NoopAnalytics();

