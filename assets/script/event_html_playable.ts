import { sys } from "cc";

const google_play = "https://play.google.com/store/apps/details?id=com.vitgames.shopexpan";
// const appstore = "https://apps.apple.com/us/app/ad-testing/id1463016906";

export class event_html_playable {
    protected _startTime:number = 0;
    protected _idleTime:number = 0;
    protected _hasFirstInteract:boolean = false;
    protected _idleUnit:number = 5000;// milliseconds

    download() {
        // console.log("download");
        try {
            //@ts-ignore
            window.event_html && event_html.trackInstallButton();
        } catch (error) {
            
        }
        try {
            //@ts-ignore
            window.event_html && event_html.download();
        } catch (error) {
            
        }
    }

    game_start() {
        this._startTime = sys.now();
        this._idleTime = sys.now();

        // console.log("game start");
        try {
            //@ts-ignore
            window.event_html && event_html.trackStart();
            // this.set_google_play_url(google_play);
        } catch (error) {
        }
    }

    game_end() {
        // console.log("game end");
        try {
            //@ts-ignore
            window.event_html && event_html.trackCompletion();
            //@ts-ignore
            // window.event_html && event_html.game_end();
        } catch (error) {
            
        }

        this.checkIdle();
        this.trackTimeSpent(sys.now() - this._startTime);
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

            this.trackFirstInteraction();
        }
    }

    protected checkIdle() {
        let time = Math.floor((sys.now() - this._idleTime) / this._idleUnit);
        if (time > 0) {
            this.trackInaction(Math.floor(Math.max(3, time) * this._idleUnit / 1000));
        }
    }
    
     // ------------------------------------------
     trackExit() {
        // console.log("game end no complete");
        try {
            //@ts-ignore
            window.event_html && event_html.trackExit();
        } catch (error) {
            
        }

        this.checkIdle();
        this.trackTimeSpent(sys.now() - this._startTime);
    }

    trackFirstInteraction() {
        // console.log("First active user interaction");
        try {
            //@ts-ignore
            window.event_html && event_html.trackFirstInteraction();
        } catch (error) {
            
        }
    }

    trackSound(on) {
        this.checkFirstInteract();

        // console.log("Sound turned");
        try {
            //@ts-ignore
            window.event_html && event_html.trackSound(on);
        } catch (error) {
            
        }
    }

    trackTimeSpent(timeSpent:number) {
        timeSpent = Math.floor(timeSpent / 1000);
        // console.log("Total time spent:" + timeSpent);
        try {
            //@ts-ignore
            window.event_html && event_html.trackTimeSpent(timeSpent);
        } catch (error) {
            
        }
    }

    trackFirstOrder() {
        // console.log("Received an order from the first person");
        try {
            //@ts-ignore
            window.event_html && event_html.trackFirstOrder();
        } catch (error) {
            
        }
    }

    trackKitchenUpgrade() {
        // console.log("Bought a chef for the kitchen");
        try {
            //@ts-ignore
            window.event_html && event_html.trackKitchenUpgrade();
        } catch (error) {
            
        }
    }

    trackCassaUpgrade() {
        // console.log("Bought a cashier for the cash register");
        try {
            //@ts-ignore
            window.event_html && event_html.trackCassaUpgrade();
        } catch (error) {
            
        }
    }

    trackInaction(duration) {
        // console.log("User inactivity:" + duration);
        try {
            //@ts-ignore
            window.event_html && event_html.trackInaction(duration);
        } catch (error) {
            
        }
    }
    // ---------------------------------------
    set_google_play_url(url: string) {
        //@ts-ignore
        window.event_html && (event_html.google_play_url = url);
    }

    set_app_store_url(url: string) {
        //@ts-ignore
        window.event_html && (event_html.appstore_url = url);
    }
}

export default new event_html_playable();