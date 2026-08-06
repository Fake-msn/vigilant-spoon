import type { Metadata } from 'next';
import { Ma_Shan_Zheng } from 'next/font/google';
import './globals.css';

const maShanZheng = Ma_Shan_Zheng({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-ma-shan-zheng',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '小信 · 你好，我是小信',
  description: 'AI 一对一谈心，画下你的话，写下我的信，守护每一个乡村孩子的梦想。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={maShanZheng.variable}>
      <body>{children}</body>
    </html>
  );
}
