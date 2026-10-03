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
            <script src="/shared/kulibert-bar.js?v=2026-10-12-one-menu" data-app="berty-run" data-name="Berty's Run" data-version={CHIP} data-menu="[data-game-menu]" data-rtl="1" defer />
            <script
              dangerouslySetInnerHTML={{
                __html:
                  "(function(){function fit(){var vv=window.visualViewport;var h=vv?vv.height:window.innerHeight;var w=vv?vv.width:window.innerWidth;var s=document.documentElement.style;s.height=h+'px';s.width=w+'px';}requestAnimationFrame(fit);window.addEventListener('resize',fit);window.addEventListener('orientationchange',fit);if(window.visualViewport){visualViewport.addEventListener('resize',fit);visualViewport.addEventListener('scroll',fit);}try{if(window.top!==window.self)return;var host=location.hostname;if(host.slice(-13)!=='.kulibert.net')return;var p=location.pathname;if(p.indexOf('/berty-run')!==0)return;location.replace('/?open='+encodeURIComponent(p+location.search+location.hash));}catch(e){}})();",
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
