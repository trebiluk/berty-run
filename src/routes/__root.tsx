import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";
import { CHIP } from "@/game/techworks";

const APP_NAME = "Berty's Run";
const BASE = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
const ON_CART = BASE.startsWith("/berty-run/");

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#0b1220" },
      { name: "berty-run-rev", content: CHIP },
      {
        name: "description",
        content: "Berty is learning how a computer works. You help him explore. The reward is the PC.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: `${BASE}favicon.svg` },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/berty-run/apple-touch-icon.png" },
      { rel: "stylesheet", href: "/fonts/room.css?v=2026-10-05-signin" },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="/shared/kulibert-prefs.js?v=2026-10-05-signin" />
        <script src="/shared/kulibert-i18n.js?v=2026-10-05-signin" />
        {ON_CART ? (
          <>
            <script dangerouslySetInnerHTML={{ __html: "(function(){var asked=false;function staff(){try{if(localStorage.getItem('tech-room-hub-staff')==='1'||sessionStorage.getItem('tech-room-hub-staff')==='1')return true;}catch(e){}try{return !!(window.KulibertStaffAuth&&window.KulibertStaffAuth.isUnlocked&&window.KulibertStaffAuth.isUnlocked());}catch(e2){return false;}}function sw(){var pack=false,on=false;try{var raw=JSON.parse(sessionStorage.getItem('kulibert-test-pack')||'null');pack=!!(raw&&raw.testMode===true);}catch(e){}try{on=new URLSearchParams(location.search).get('test')==='1'||sessionStorage.getItem('kulibert-test-tab')==='1';}catch(e2){}return pack&&on;}function strip(){var nodes=document.querySelectorAll(\"script[src*='kw-test']\");for(var i=0;i<nodes.length;i++)if(nodes[i].parentNode)nodes[i].parentNode.removeChild(nodes[i]);var chip=document.getElementById('kw-test-chip');if(chip&&chip.parentNode)chip.parentNode.removeChild(chip);try{delete window.KulibertTest;}catch(e){window.KulibertTest=undefined;}try{delete window.KWTest;}catch(e2){window.KWTest=undefined;}}function load(){if(!(staff()&&sw())){if(!asked)strip();return;}if(asked||document.querySelector(\"script[src*='kw-test']\")){asked=true;return;}asked=true;var s=document.createElement('script');s.src='/shared/kw-test.js?v=BR-1.12.43';document.head.appendChild(s);}load();})();" }} />
            <script src="/shared/kulibert-bar.js?v=2026-10-12-one-menu" data-app="berty-run" data-name="Berty's Run" data-version={CHIP} data-menu="[data-game-menu]" data-rtl="1" defer />
            <script
              dangerouslySetInnerHTML={{
                __html:
                  "(function(){function fit(){var vv=window.visualViewport;var h=vv?vv.height:window.innerHeight;var w=vv?vv.width:window.innerWidth;var s=document.documentElement.style;s.height=h+'px';s.width=w+'px';}requestAnimationFrame(fit);window.addEventListener('resize',fit);window.addEventListener('orientationchange',fit);if(window.visualViewport){visualViewport.addEventListener('resize',fit);visualViewport.addEventListener('scroll',fit);}try{if(window.top!==window.self)return;var host=location.hostname;if(host.slice(-13)!=='.kulibert.net')return;var p=location.pathname;if(p.indexOf('/berty-run')!==0)return;var q=new URLSearchParams(location.search);var lang=q.get('lang')||'';var dir=q.get('dir')||'';if(lang){try{var prefs=JSON.parse(localStorage.getItem('kulibert-prefs-v1')||'null')||{v:1};prefs.lang=lang;localStorage.setItem('kulibert-prefs-v1',JSON.stringify(prefs));var acc=JSON.parse(localStorage.getItem('br-access-v1')||'null');if(acc&&typeof acc==='object'){acc.lang=lang;localStorage.setItem('br-access-v1',JSON.stringify(acc));}}catch(e){}}var search=location.search;if(lang){q.set('lang',lang);if(dir)q.set('dir',dir);search='?'+q.toString();}var open=p+search+location.hash;var hub='/?open='+encodeURIComponent(open);if(lang)hub+='&lang='+encodeURIComponent(lang);if(dir)hub+='&dir='+encodeURIComponent(dir);location.replace(hub);}catch(e){}})();",
              }}
            />
          </>
        ) : null}
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
