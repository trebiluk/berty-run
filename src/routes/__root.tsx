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
            <script src="/shared/kulibert-bar.js?v=BR-1.12.46" data-app="berty-run" data-name="Berty's Run" data-version={CHIP} data-menu="[data-game-menu]" data-rtl="1" defer />
<script dangerouslySetInnerHTML={{ __html: "(function(){var W={'en':'BR 1.12.46 — The news box no longer covers the game. Find it in Menu.','simple':'BR 1.12.46 — News box is in Menu. It no longer covers the game.','es':'BR 1.12.46 — La caja de noticias ya no cubre el juego. Encu\u00e9ntrala en el Men\u00fa.','uk':'BR 1.12.46 — \\u042f\\u0449\\u0438\\u043a \\u043d\\u043e\\u0432\\u0438\\u043d \\u0431\\u0456\\u043b\\u044c\\u0448\\u0435 \\u043d\\u0435 \\u043f\\u0435\\u0440\\u0435\\u043a\\u0440\\u0438\\u0432\\u0430\\u0454 \\u0433\\u0440\\u0443. \\u0417\\u043d\\u0430\\u0439\\u0434\\u0438 \\u0439\\u043e\\u0433\\u043e \\u0432 \\u041c\\u0435\\u043d\\u044e.','ru':'BR 1.12.46 — \\u042f\\u0449\\u0438\\u043a \\u043d\\u043e\\u0432\\u043e\\u0441\\u0442\\u0435\\u0439 \\u0431\\u043e\\u043b\\u044c\\u0448\\u0435 \\u043d\\u0435 \\u043f\\u0435\\u0440\\u0435\\u043a\\u0440\\u044b\\u0432\\u0430\\u0435\\u0442 \\u0438\\u0433\\u0440\\u0443. \\u041d\\u0430\\u0439\\u0434\\u0438 \\u0435\\u0433\\u043e \\u0432 \\u041c\\u0435\\u043d\\u044e.','ar':'BR 1.12.46 — \\u0635\\u0646\\u062f\\u0648\\u0642 \\u0627\\u0644\\u0623\\u062e\\u0628\\u0627\\u0631 \\u0644\\u0645 \\u064a\\u0639\\u062f \\u064a\\u063a\\u0637\\u064a \\u0627\\u0644\\u0644\\u0639\\u0628\\u0629. \\u0627\\u0628\\u062d\\u062b \\u0639\\u0646\\u0647 \\u0641\\u064a \\u0627\\u0644\\u0642\\u0627\\u0626\\u0645\\u0629.','fa-AF':'BR 1.12.46 — \\u062c\\u0639\\u0628\\u0647 \\u062e\\u0628\\u0631 \\u062f\\u06cc\\u06af\\u0631 \\u0628\\u0627\\u0632\\u06cc \\u0631\\u0627 \\u0646\\u0645\\u06cc\\u200c\\u067e\\u0648\\u0634\\u0627\\u0646\\u062f. \\u0622\\u0646 \\u0631\\u0627 \\u062f\\u0631 \\u0641\\u0647\\u0631\\u0633\\u062a \\u0628\\u06cc\\u0627\\u0628\\u06cc\\u062f.','rw':'BR 1.12.46 — Agasanduku k'amakuru ntigisubira gupfuka umukino. Kimenya muri Menu.','ti':'BR 1.12.46 — \\u1293\\u12ed \\u1233\\u1325\\u1295 \\u12b3\\u1291\\u1295\\u1275 \\u1295\\u1265\\u12ed \\u121d\\u12d5\\u121b\\u12b5 \\u12a0\\u12ed\\u12ab\\u120d\\u12d5\\u1295\\u1362 \\u12a3\\u1265 \\u1218\\u1295\\u12eb \\u122d\\u12ab\\u1265\\u1362'};function lang(){var q=new URLSearchParams(location.search).get('lang');if(q)return q;try{var p=JSON.parse(localStorage.getItem('kulibert-prefs-v1')||'null');if(p&&p.lang)return p.lang;}catch(e){}return 'en';}function set(){var tag=document.querySelector('script[src*=kulibert-bar]');if(tag)tag.setAttribute('data-whats-new',W[lang()]||W.en);}set();function paint(code){var line=document.querySelector('#kb-drawer .kb-drawer-line');if(line)line.textContent=W[code||lang()]||W.en;}if(document.body)paint();else document.addEventListener('DOMContentLoaded',function(){paint();});window.addEventListener('kulibert-lang',function(ev){paint(ev&&ev.detail&&ev.detail.lang);});})();" }} />
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
