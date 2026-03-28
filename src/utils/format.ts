// 格式化工具函数

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

/**
 * 格式化日期
 * @param date 日期字符串或时间戳
 * @param format 格式模板
 */
export function formatDate(date: string | number | Date, format = 'YYYY-MM-DD'): string {
  if (!date) return '';
  return dayjs(date).format(format);
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | number | Date): string {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

/**
 * 相对时间 (如：3天前)
 */
export function formatRelativeTime(date: string | number | Date): string {
  if (!date) return '';
  return dayjs(date).fromNow();
}

/**
 * 格式化数字 (超过1000显示为1k)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

/**
 * 格式化浏览量
 */
export function formatViewCount(count: number): string {
  return formatNumber(count) + ' 热度';
}

/**
 * 格式化评论数
 */
export function formatCommentCount(count: number): string {
  return count + ' 条评论';
}
