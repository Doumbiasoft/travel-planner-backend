export class CronExpression {
  /** Run every second */
  static everySecond(): string {
    return "* * * * * *"; // 6 fields: seconds included
  }

  /** Run every 5 seconds */
  static everyFiveSeconds(): string {
    return "*/5 * * * * *";
  }

  /** Run every 10 seconds */
  static everyTenSeconds(): string {
    return "*/10 * * * * *";
  }
  /** Run every 15 seconds */
  static everyFifteenSeconds(): string {
    return "*/15 * * * * *";
  }
  /** Run every 30 seconds */
  static everyThirtySeconds(): string {
    return "*/30 * * * * *";
  }

  /** Run every minute */
  static everyMinute(): string {
    return "0 * * * * *";
  }

  /** Run every 5 minutes */
  static everyFiveMinutes(): string {
    return "0 */5 * * * *";
  }

  /** Run every 10 minutes */
  static everyTenMinutes(): string {
    return "0 */10 * * * *";
  }

  /** Run every 30 minutes */
  static everyThirtyMinutes(): string {
    return "0 */30 * * * *";
  }

  /** Run every hour */
  static everyHour(): string {
    return "0 0 * * * *";
  }

  /** Run every 6 hours */
  static everySixHours(): string {
    return "0 0 */6 * * *";
  }

  /** Run every day at midnight */
  static everyMidnight(): string {
    return "0 0 0 * * *";
  }

  /** Run every day at 9 AM */
  static everyDayAt9AM(): string {
    return "0 0 9 * * *";
  }

  /** Run every Monday at 9 AM */
  static everyMondayAt9AM(): string {
    return "0 0 9 * * 1";
  }

  /** Run every weekday at 9 AM */
  static everyWeekdayAt9AM(): string {
    return "0 0 9 * * 1-5";
  }

  /** Run on the first day of every month at midnight */
  static firstDayOfMonth(): string {
    return "0 0 0 1 * *";
  }

  /** Run on the last day of every month at midnight */
  static lastDayOfMonth(): string {
    return "0 0 0 L * *"; // `L` is supported in some cron parsers
  }

  /** Run on January 1st at midnight (New Year job 🎉) */
  static everyNewYear(): string {
    return "0 0 0 1 1 *";
  }

  /** Run every year on July 1st at midnight */
  static everyYearOnJuly1st(): string {
    return "0 0 0 1 7 *";
  }

  /** Custom generator: second, minute, hour, day of month, month, day of week */
  static custom(
    second: string | number,
    minute: string | number,
    hour: string | number,
    dayOfMonth: string | number,
    month: string | number,
    dayOfWeek: string | number
  ): string {
    return `${second} ${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  }
}
