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
  {
    hostname: 'urlsec.qq.com',
    pathname: '/check',
    title: '腾讯安全中心',
    param: 'url',
    example: 'https://urlsec.qq.com/check.html?url=https%3A%2F%2Fwww.example.com',
  },
  {
    hostname: 'seccaptcha.baidu.com',
    pathname: '/v1/webapi/verint/svcp.html',
    title: '百度安全验证',
    param: 'backurl',
    getTargetUrl: (url) => {
      const urlObj = new URL(url);
      const backurl = urlObj.searchParams.get('backurl');
      if (backurl) {
        try {
          const url2 = new URL(backurl);
          if (url2.hostname === 'bsb.baidu.com') {
            const s_cap = url2.searchParams.get('s_cap');
            if (s_cap) {
              return decodeURIComponent(s_cap);
            }
          }
          return backurl;
        } catch (e) {
          return backurl;
        }
      }
      return '';
    },
    example:
      'https://seccaptcha.baidu.com/v1/webapi/verint/svcp.html?ak=lBdQoPALalwAmGSRgKmMzI7cEErgRFZK&backurl=https%3A%2F%2Fbsb.baidu.com%2Fdiagnosis%3Fs_cap%3Dhttps%253A%2F%2Fwww.example.com&ctype=p_spin&ts=1756448493&sign=6e1e4436c160be7d3cf354f4d06e7397',
  },
  {
    hostname: 'c.pc.qq.com',
    title: 'QQ 安全中心',
    param: 'pfurl',
    example:
      'https://c.pc.qq.com/middlem.html?pfurl=https%3A%2F%2Fkongdetuo%2Egithub%2Eio%2Fposts%2Favalonia%2Dbinding%2Dto%2Ddatatable%2F&pfuin=2809735321&pfto=qq.msg&type=0&gjlevel=15&gjsublevel=2804&iscontinue=0&ADUIN=2809735321&ADSESSION=1756427704&ADTAG=CLIENT.QQ.5723_AIO.0&ADPUBNO=27456',
  },
  {
    hostname: 'docs.qq.com',
    pathname: '/scenario/link',
    param: 'url',
    title: '腾讯文档',
    example: 'https://docs.qq.com/scenario/link?url=https%3A%2F%2Fcocos.com',
  },
  {
    hostname: 'cloud.tencent.com',
    pathname: '/developer/tools/blog-entry',
    param: 'target',
    title: '腾讯云',
    example:
      'https://cloud.tencent.com/developer/tools/blog-entry?target=https%3A%2F%2Fgithub.com%2FYutaka-Sawada%2FMultiPar%2Freleases&objectId=2219115&objectType=1&contentType=undefined',
  },
  {
    hostname: 'www.google.com.hk',
    pathname: '/url',
    param: 'q',
    title: 'Google 香港',
    example: 'https://www.google.com.hk/url?q=https%3A%2F%2Fwww.jd.com%2F%3Fcountry%3DUSA',
  },
];
