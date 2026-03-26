/**
 * Only keep rules that require custom JavaScript extraction logic.
 * Static rules are now stored in sites.json.
 */

export default [
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
    hostname: 'jump2.bdimg.com',
    pathname: '/safecheck/index',
    title: '百度贴吧(安全检查)',
    getTargetUrl: (url) => {
      return fetch(url)
        .then((res) => res.text())
        .then((text) => {
          const matches = text.matchAll(/href="(https?:\/\/[^"]+)"/gi);
          for (const match of matches) {
            try {
              const href = match[1];
              const { hostname } = new URL(href);
              if (hostname !== 'baidu.com' && !hostname.endsWith('.baidu.com') && hostname !== 'bdimg.com' && !hostname.endsWith('.bdimg.com')) {
                return href;
              }
            } catch (_) {
              // skip malformed URLs
            }
          }
          return '';
        })
        .catch(() => {
          return '';
        });
    },
    example:
      'https://jump2.bdimg.com/safecheck/index?url=rN3wPs8te/pjz8pBqGzzzzaW4WFUTyCxEKS+pQ5Nttjr2uAMWdahP1GqNiv2gRPiuW2ln5mMyf/SFV1x/lEH3W60ibUui7IJCffeoXtreurzROPHR9ebf+Ih67tHKGgBZAWf8SbXleGpjMhMko4mnXY9qHh6BM0y',
  },
  {
    hostname: 'blog.ziyibbs.com',
    pathname: '/go/',
    title: '紫忆论坛',
    param: 'target',
    getTargetUrl: (url) => {
      const urlObj = new URL(url);
      const target = urlObj.searchParams.get('target');
      if (target) {
        try {
          const decoded = atob(target);
          // Validate that the decoded URL is a safe HTTP/HTTPS URL
          const targetUrl = new URL(decoded);
          if (targetUrl.protocol === 'http:' || targetUrl.protocol === 'https:') {
            return decoded;
          }
          return '';
        } catch (e) {
          return '';
        }
      }
      return '';
    },
    example: 'https://blog.ziyibbs.com/go/?target=aHR0cHM6Ly9iZC5iZHdwd2ViLnNob3AvcXVhcmsv',
  },
  {
    hostname: 'www.hackv.cn',
    pathname: '/%e5%a4%96%e9%93%be%e8%b7%b3%e8%bd%ac.html',
    title: 'HackV',
    param: 'url',
    getTargetUrl: (url) => {
      const urlObj = new URL(url);
      const target = urlObj.searchParams.get('url');
      if (target) {
        try {
          const decoded = atob(target);
          const targetUrl = new URL(decoded);
          if (targetUrl.protocol === 'http:' || targetUrl.protocol === 'https:') {
            return decoded;
          }
          return '';
        } catch (e) {
          return '';
        }
      }
      return '';
    },
    example: 'https://www.hackv.cn/%e5%a4%96%e9%93%be%e8%b7%b3%e8%bd%ac.html?url=aHR0cHM6Ly9oYWNrdi5sYW56b3V1LmNvbS9iMDF0bzlnNHNk',
  },
];
