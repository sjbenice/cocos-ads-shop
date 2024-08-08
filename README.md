https://github.com/magician-f/cocos-playable-demo?tab=readme-ov-file
https://github.com/ppgee/cocos-pnp?tab=readme-ov-file
https://adrawer.com/

https://play.google.com/store/apps/details?id=com.vitgames.shopexpan

https://elements.envato.com/ru/
https://www.freepik.com/
https://www.freepng.ru/
https://www.pngwing.com/
https://www.zapsplat.com/
https://www.storyblocks.com/

СЕТИ :
    Vungle
    Moloco
    Ironsource
    Applovin - первый приоритет
    Google
    Unity
    Lifoff
    Facebook
Версии:
    важно: для Google Ads делать HTML-5 не в адаптивном формате разрешений, а отдельно горизонтальную и вертикальную версию двумя файлами. 
    портрет: width=320,height=480
    горизонт: width=480,height=320
    
Events for integration:

- Start - the playable has loaded and opened.
- First Interaction - the first active user interaction with the playable (touch or click).
- Sound - sound was turned on or off in the playable.
- Time Spent - total time spent by the user in the playable.
- First Order - received an order from the first person.
- Kitchen Upgrade - bought a chef for the kitchen.
- Cassa Upgrade - bought a cashier for the cash register.
- Second Kitchen Upgrade - bought a second chef for the kitchen.
- Completion - marks the complete passage of the playable by the user, indicating high engagement.
- Install button - if there is a button in the active window of the playable.
- Exit - logs the user's exit from the playable before completion.
- Inaction 5/10/15 - user inactivity for a certain amount of time.

Credits for Google account: MEASUREMENT ID - G-D0ZC63K2RC

SE_pl_123v1

Facebook, Moloco:
    NOT mraid
    FbPlayableAd.onCTAClick();
Ironsource:
    NOT mraid
    dapi.openStoreUrl();


Google:
    <meta name="ad.orientation" content="portrait">
    <meta name="ad.size" content="width=320,height=480">
    <meta name="ad.orientation" content="landscape">
    <meta name="ad.size" content="width=480,height=320">

    <script src="https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"></script>
    ExitApi.exit();

Applovin:
    https://p.applov.in/playablePreview?create=1&qr=1
Vungle:
    NOT mraid
    parent.postMessage('download', '*');
