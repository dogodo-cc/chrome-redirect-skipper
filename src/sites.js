/**
 *  hostname: The hostname of the redirect service.
 *  pathname: The specific path to match (optional).
 *  title: The display name of the redirect service.
 *  param: The query parameter name for the target URL.
 *  getTargetUrl: A function to extract the target URL from the full URL (optional).
 */

export default [
  {
    hostname: 'link.juejin.cn',
    title: '掘金',
    param: 'target',
    example: 'https://link.juejin.cn/?target=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'sspai.com',
    pathname: '/link',
    title: '少数派',
    param: 'target',
    example: 'https://sspai.com/link?target=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'link.zhihu.com',
    title: '知乎',
    param: 'target',
    example: 'https://link.zhihu.com/?target=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'link.csdn.net',
    title: 'CSDN',
    param: 'target',
    example: 'https://link.csdn.net/?from_id=147127098&target=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'www.jianshu.com',
    pathname: '/go-wild',
    title: '简书',
    param: 'url',
    example: 'https://www.jianshu.com/go-wild?ac=2&url=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'gitee.com',
    pathname: '/link',
    title: 'Gitte',
    param: 'target',
    example: 'https://gitee.com/link?target=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'afdian.com',
    pathname: '/link',
    title: '爱发电',
    param: 'target',
    example: 'https://afdian.com/link?target=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'blog.51cto.com',
    pathname: '/transfer',
    title: '51CTO',
    getTargetUrl: (url) => {
      return url.replace('https://blog.51cto.com/transfer?', '');
    },
    example: 'https://blog.51cto.com/transfer?https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'weibo.cn',
    pathname: '/sinaurl',
    title: '微博',
    param: ['toasturl', 'url', 'u'],
    example: 'https://weibo.cn/sinaurl?toasturl=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'www.youtube.com',
    pathname: '/redirect',
    param: 'q',
    title: 'YouTube',
    example: 'https://www.youtube.com/redirect?q=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'www.yuque.com',
    pathname: '/r/goto',
    param: 'url',
    title: '语雀',
    example: 'https://www.yuque.com/r/goto?url=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'developer.aliyun.com',
    pathname: '/redirect',
    param: 'target',
    title: '阿里云',
    example: 'https://developer.aliyun.com/redirect?target=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'www.douban.com',
    pathname: '/link2',
    title: '豆瓣',
    param: 'url',
    example: 'https://www.douban.com/link2/?url=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'xie.infoq.cn',
    pathname: '/link',
    title: 'InfoQ(写作社区)',
    param: 'target',
    example: 'https://xie.infoq.cn/link?target=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'www.infoq.cn',
    pathname: '/link',
    title: 'InfoQ',
    param: 'target',
    example: 'https://www.infoq.cn/link?target=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'www.iplaysoft.com',
    pathname: '/link',
    title: '异次元',
    param: 'url',
    example: 'https://www.iplaysoft.com/link/?url=Hc0RHan9yL6MWdoRXat92YuI3bod0LF5WZ0N3b0lGZvh2RvIiblR3c5FGbQ1ZXI',
    getTargetUrl: (url) => {
      // https://www.iplaysoft.com/link/?url=Hc0RHan9yL6MWdoRXat92YuI3bod0LF5WZ0N3b0lGZvh2RvIiblR3c5FGbQ1ZXI
      // 该网站将目标地址进行了二次加密，必须请求页面内容并解析出目标地址

      return fetch(url)
        .then((res) => res.text())
        .then((text) => {
          const match = text.match(/<a\s+class="button"\s+rel="noopener noreferrer"\s+href="([^"]+)">/i);
          if (match && match[1]) {
            return match[1];
          }
          return '';
        })
        .catch(() => {
          return '';
        });
    },
  },
  {
    hostname: 'www.oschina.net',
    pathname: '/action/GoToLink',
    title: 'OSChina',
    param: 'url',
    example: 'https://www.oschina.net/action/GoToLink?url=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'www.gcores.com',
    pathname: '/link',
    title: '机核',
    param: 'target',
    example: 'https://www.gcores.com/link?target=https%3A%2F%2Fcocos.com',
  },
];
