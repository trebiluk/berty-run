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
            <script src="/shared/kulibert-bar.js?v=BR-1.12.44" data-app="berty-run" data-name="Berty's Run" data-version={CHIP} data-menu="[data-game-menu]" data-rtl="1" defer />
<script dangerouslySetInnerHTML={{ __html: "(function(){var W={'en':'BR 1.12.44: What\\'s new in the menu now shows the latest Berty\\'s Run news in your language.','simple':'BR 1.12.44: Menu shows Berty\\'s Run news.','es':'BR 1.12.44: Novedades en el men\\u00fa ya muestra las \\u00faltimas noticias de Berty\\'s Run en tu idioma.','uk':'BR 1.12.44: \\u00ab\\u0429\\u043e \\u043d\\u043e\\u0432\\u043e\\u0433\\u043e\\u00bb \\u0432 \\u043c\\u0435\\u043d\\u044e \\u0442\\u0435\\u043f\\u0435\\u0440 \\u043f\\u043e\\u043a\\u0430\\u0437\\u0443\\u0454 \\u043e\\u0441\\u0442\\u0430\\u043d\\u043d\\u0456 \\u043d\\u043e\\u0432\\u0438\\u043d\\u0438 Berty\\'s Run \\u0442\\u0432\\u043e\\u0454\\u044e \\u043c\\u043e\\u0432\\u043e\\u044e.','ru':'BR 1.12.44: \\u00ab\\u0427\\u0442\\u043e \\u043d\\u043e\\u0432\\u043e\\u0433\\u043e\\u00bb \\u0432 \\u043c\\u0435\\u043d\\u044e \\u0442\\u0435\\u043f\\u0435\\u0440\\u044c \\u043f\\u043e\\u043a\\u0430\\u0437\\u044b\\u0432\\u0430\\u0435\\u0442 \\u043f\\u043e\\u0441\\u043b\\u0435\\u0434\\u043d\\u0438\\u0435 \\u043d\\u043e\\u0432\\u043e\\u0441\\u0442\\u0438 Berty\\'s Run \\u043d\\u0430 \\u0442\\u0432\\u043e\\u0451\\u043c \\u044f\\u0437\\u044b\\u043a\\u0435.','ar':'BR 1.12.44: \\u00ab\\u0645\\u0627 \\u0627\\u0644\\u062c\\u062f\\u064a\\u062f\\u00bb \\u0641\\u064a \\u0627\\u0644\\u0642\\u0627\\u0626\\u0645\\u0629 \\u064a\\u0639\\u0631\\u0636 \\u0627\\u0644\\u0622\\u0646 \\u0622\\u062e\\u0631 \\u0623\\u062e\\u0628\\u0627\\u0631 Berty\\'s Run \\u0628\\u0644\\u063a\\u062a\\u0643.','fa-AF':'BR 1.12.44: \\u00ab\\u062a\\u0627\\u0632\\u0647\\u200c\\u0647\\u0627\\u00bb \\u062f\\u0631 \\u0641\\u0647\\u0631\\u0633\\u062a \\u0627\\u06a9\\u0646\\u0648\\u0646 \\u0622\\u062e\\u0631\\u06cc\\u0646 \\u062e\\u0628\\u0631\\u0647\\u0627\\u06cc Berty\\'s Run \\u0631\\u0627 \\u0628\\u0647 \\u0632\\u0628\\u0627\\u0646 \\u062a\\u0648 \\u0646\\u0634\\u0627\\u0646 \\u0645\\u06cc\\u200c\\u062f\\u0647\\u062f.','rw':'BR 1.12.44: \\u00abIbishya\\u00bb muri menu ubu byerekana amakuru mashya ya Berty\\'s Run mu rurimi rwawe.','ti':'BR 1.12.44: \\u00ab\\u1213\\u12f5\\u123d \\u12a5\\u1295\\u1273\\u12ed \\u12a3\\u120e\\u00bb \\u12a3\\u1265 \\u12dd\\u122d\\u12dd\\u122d \\u1215\\u1302 \\u1293\\u12ed Berty\\'s Run \\u1213\\u12f5\\u123d \\u12dc\\u1293 \\u1265\\u124b\\u1295\\u124b\\u12ad\\u12eb \\u12e8\\u122d\\u12a2\\u1362'};function lang(){var q=new URLSearchParams(location.search).get('lang');if(q)return q;try{var p=JSON.parse(localStorage.getItem('kulibert-prefs-v1')||'null');if(p&&p.lang)return p.lang;}catch(e){}return 'en';}function set(){var tag=document.querySelector('script[src*=kulibert-bar]');if(tag)tag.setAttribute('data-whats-new',W[lang()]||W.en);}set();function paint(code){if(!document.getElementById('kb-drawer')){var box=document.createElement('aside');box.id='kb-drawer';box.className='kb-drawer';box.innerHTML='<p class=kb-drawer-news><strong class=kb-drawer-kicker>What is new</strong> <span class=kb-drawer-line></span></p>';document.body.appendChild(box);}var line=document.querySelector('#kb-drawer .kb-drawer-line');if(line)line.textContent=W[code||lang()]||W.en;}if(document.body)paint();else document.addEventListener('DOMContentLoaded',function(){paint();});window.addEventListener('kulibert-lang',function(ev){paint(ev&&ev.detail&&ev.detail.lang);});})();" }} />
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
