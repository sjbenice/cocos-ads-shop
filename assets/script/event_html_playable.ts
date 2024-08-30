import { sys } from "cc";

// const google_play = "https://play.google.com/store/apps/details?id=com.vitgames.shopexpan";
// const apple_store = null;//"https://apps.apple.com/us/app/ad-testing/id1463016906";
const google_play = "https://play.google.com/store/apps/details?id=com.vizorapps.klondike";
const apple_store = "https://apps.apple.com/us/app/klondike-adventures-farm-game/id1127240206";
let playable = "SE_31_4111_SE_Queue";// a, b, c,...
let networkName = null;

export class super_html_playable {
    protected _startTime:number = 0;
    protected _idleTime:number = 0;
    protected _hasFirstInteract:boolean = false;
    protected _idleUnit:number = 5000;// milliseconds
    protected _gotoDownload:boolean = false;

    constructor() {
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    handleVisibilityChange() {
        if (!document.hidden) {
            if (this._gotoDownload) {
                this._gotoDownload = false;
                this.track_gtag('Return from Store');
            }
        }
    }

    version() {
        //@ts-ignore
        return window.super_html && super_html.version ? super_html.version : 1;
    }

    hideSoundButton() {// Liftoff, IronSource
        //@ts-ignore
        return window.super_html && super_html.hideSoundButton ? super_html.hideSoundButton : 0;
    }

    hideAllButton() {// Google
        //@ts-ignore
        return window.super_html && super_html.hideAllButton ? super_html.hideAllButton : 0;
    }

    rightLogo() {// IronSource
        //@ts-ignore
        return window.super_html && super_html.rightLogo ? super_html.rightLogo : 0;
    }

    getPlayUrl() {
        if (apple_store && this.getMobileOperatingSystem() == 'iOS')
            return apple_store;
        
        return google_play;
    }

    download() {
        if (google_play)
            this.set_google_play_url(google_play);
        if (apple_store)
            this.set_app_store_url(apple_store);
        
        this.track_gtag('Install Button');

        this._gotoDownload = true;
        //@ts-ignore
        window.super_html && super_html.download(this.getPlayUrl());
    }

    game_start() {
        this._startTime = sys.now();
        this._idleTime = sys.now();

        this.track_gtag('Start');
    }

    game_end() {
        this.track_gtag('Completion');
        //@ts-ignore
        window.super_html && super_html.game_end && super_html.game_end();

        this.checkIdle();
        this.trackTimeSpent(sys.now() - this._startTime);
    }

    set_google_play_url(url: string) {
        //@ts-ignore
        window.super_html && (super_html.google_play_url = url);
    }

    set_app_store_url(url: string) {
        //@ts-ignore
        window.super_html && (super_html.appstore_url = url);
    }

    interact_start() {
        this.checkFirstInteract();

        this.checkIdle();
    }

    interact_end() {
        this._idleTime = sys.now();
    }

    protected checkFirstInteract() {
        if (!this._hasFirstInteract) {
            this._hasFirstInteract = true;
            this.track_gtag('First Interaction');
        }
    }

    protected checkIdle() {
        let time = Math.floor((sys.now() - this._idleTime) / this._idleUnit);
        if (time > 0) {
            this.trackInaction(Math.floor(Math.min(3, time) * this._idleUnit / 1000));
            this._idleTime = sys.now();
        }
    }
    
    // ------------------------------------------
    trackExit() {
        this.track_gtag('Exit');

        this.checkIdle();
        this.trackTimeSpent(sys.now() - this._startTime);
    }

    trackSound(on) {
        this.checkFirstInteract();
        this.track_gtag('Sound', on ? 1 : 0);
    }

    trackTimeSpent(timeSpent:number) {
        timeSpent = Math.floor(timeSpent / 1000);
        this.track_gtag('Time Spent', timeSpent);
    }

    trackFirstOrder() {
        this.track_gtag('First Order');
    }

    trackKitchenUpgrade() {
        this.track_gtag('Kitchen Upgrade');
    }

    trackCassaUpgrade() {
        this.track_gtag('Cassa Upgrade');
    }

    trackInaction(duration) {
        this.track_gtag('Inaction' + duration);
    }
    // ---------------------------------------
    track_gtag(eventName:string, value:any=null) {
        // console.log(eventName, value);
        // UTF8ToString
        //@ts-ignore
        if (typeof gtag === "undefined") {
            // console.log("Gtag not defined. Google Analytics event {", eventName, "} not sent");
            return;
        }

        if (networkName == null) {
            //@ts-ignore
            if (window.super_html){
                //@ts-ignore
                if (window.super_html_channel){
                    //@ts-ignore
                    networkName = window.super_html_channel;
                    playable += String.fromCharCode('a'.charCodeAt(0) + this.version() - 1);
                }
            }
        }
        console.log("jsAddEvent event: ", eventName, ", eventPlayable: ", playable, ", channel: ", networkName);
        if (value) {
            //@ts-ignore
            gtag("event", eventName, { eventPlayable: playable, channel: networkName, value:value });
        } else {
            //@ts-ignore
            gtag("event", eventName, { eventPlayable: playable, channel: networkName });
        }
    }

    getMobileOperatingSystem() {
        var userAgent = navigator.userAgent || navigator.vendor || window["opera"];
        if (/windows phone/i.test(userAgent)) {
            return "Windows Phone";
        }
        if (/android/i.test(userAgent)) {
            return "Android";
        }
        if (/iPad|iPhone|iPod/.test(userAgent) && !window["MSStream"]) {
            return "iOS";
        }
        return "unknown";
    }
}

export default new super_html_playable();