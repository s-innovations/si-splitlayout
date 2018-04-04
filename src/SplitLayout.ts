




import * as ko from "knockout";
import { KoLayout, IKoLayout, KnockoutTemplateBindingHandlerOptions } from "si-kolayout";

import { defaults, Factory } from "si-decorators";
import { observable } from "si-decorators";

import * as SplitLayoutTemplate from "template!./templates/SplitLayoutTemplate.html";
import "css!./content/SplitLayout.less";
import * as anime from "animejs";

 

function extend(a: any, b: any) {
    for (var key in b) {
        if (b.hasOwnProperty(key)) {
            a[key] = b[key];
        }
    }
    return a;
}

function createDOMEl(type: string, className?: string, content?: string) {
    var el = document.createElement(type);
    el.className = className || '';
    el.innerHTML = content || '';
    return el;
}
declare global{
    export interface CSSStyleDeclaration {
        WebkitTransform: any;
        WebkitTransformOrigin: any;
    }
}
class RevealFx {

    isAnimating: boolean;
    el: HTMLElement;
    content: HTMLElement;
    revealer: HTMLElement;

    options = {
        // If true, then the content will be hidden until it´s "revealed".
        isContentHidden: true,
        // The animation/reveal settings. This can be set initially or passed when calling the reveal method.
        revealSettings: {
            // Animation direction: left right (lr) || right left (rl) || top bottom (tb) || bottom top (bt).
            direction: 'lr',
            // Revealer´s background color.
            bgcolor: '#f0f0f0',
            // Animation speed. This is the speed to "cover" and also "uncover" the element (seperately, not the total time).
            duration: 500,
            // Animation easing. This is the easing to "cover" and also "uncover" the element.
            easing: 'easeInOutQuint',
            // percentage-based value representing how much of the area should be left covered.
            coverArea: 0,
            // Callback for when the revealer is covering the element (halfway through of the whole animation).
            onCover: function (contentEl: HTMLElement, revealerEl: HTMLElement) { return false; },
            // Callback for when the animation starts (animation start).
            onStart: function (contentEl: HTMLElement, revealerEl: HTMLElement) { return false; },
            // Callback for when the revealer has completed uncovering (animation end).
            onComplete: function (contentEl: HTMLElement, revealerEl: HTMLElement) { return false; }
        }
    };

    constructor(el: HTMLElement, options: any) {
        this.el = el;
        this.options = extend({}, this.options);
        extend(this.options, options);
        this._init();
    }

    _init() {
        this._layout();
    }
    _layout() {
        console.log(this.el);
        var position = getComputedStyle(this.el).position;
        if (position !== 'fixed' && position !== 'absolute' && position !== 'relative') {
            this.el.style.position = 'relative';
        }
        // Content element.
        this.content = createDOMEl('div', 'block-revealer__content'/*, this.el.innerHTML*/);

        while (this.el.childNodes.length > 0) {
            this.content.appendChild(this.el.childNodes[0]);
        }
        
      //  this.el = createDOMEl('div');
        if (this.options.isContentHidden) {
            this.content.style.opacity = "0";
        }
        // Revealer element (the one that animates)
        this.revealer = createDOMEl('div', 'block-revealer__element');
        this.el.classList.add('block-revealer');
        this.el.innerHTML = '';
        this.el.appendChild(this.content);
        this.el.appendChild(this.revealer);
    }

    _getTransformSettings(direction: string) {
        var val, origin, origin_2;

        switch (direction) {
            case 'lr':
                val = 'scale3d(0,1,1)';
                origin = '0 50%';
                origin_2 = '100% 50%';
                break;
            case 'rl':
                val = 'scale3d(0,1,1)';
                origin = '100% 50%';
                origin_2 = '0 50%';
                break;
            case 'tb':
                val = 'scale3d(1,0,1)';
                origin = '50% 0';
                origin_2 = '50% 100%';
                break;
            case 'bt':
                val = 'scale3d(1,0,1)';
                origin = '50% 100%';
                origin_2 = '50% 0';
                break;
            default:
                val = 'scale3d(0,1,1)';
                origin = '0 50%';
                origin_2 = '100% 50%';
                break;
        };

        return {
            // transform value.
            val: val,
            // initial and halfway/final transform origin.
            origin: { initial: origin, halfway: origin_2 },
        };
    };

    reveal(revealSettings?: any) {
        // Do nothing if currently animating.
        if (this.isAnimating) {
            return false;
        }
        this.isAnimating = true;

        // Set the revealer element´s transform and transform origin.
        var defaults = { // In case revealSettings is incomplete, its properties deafault to:
            duration: 500,
            easing: 'easeInOutQuint',
            delay: 0,
            bgcolor: '#f0f0f0',
            direction: 'lr',
            coverArea: 0
        },
            revealSettings = revealSettings || this.options.revealSettings,
            direction = revealSettings.direction || defaults.direction,
            transformSettings = this._getTransformSettings(direction);

        this.revealer.style.WebkitTransform = this.revealer.style.transform = transformSettings.val;
        this.revealer.style.WebkitTransformOrigin = this.revealer.style.transformOrigin = transformSettings.origin.initial;

        // Set the Revealer´s background color.
        this.revealer.style.backgroundColor = revealSettings.bgcolor || defaults.bgcolor;

        // Show it. By default the revealer element has opacity = 0 (CSS).
        this.revealer.style.opacity = "1";

        // Animate it.
        var self = this,
            // Second animation step.
            animationSettings_2 = {
                complete: function () {
                    self.isAnimating = false;
                    if (typeof revealSettings.onComplete === 'function') {
                        revealSettings.onComplete(self.content, self.revealer);
                    }
                }
            } as any,
            // First animation step.
            animationSettings = {
                delay: revealSettings.delay || defaults.delay,
                complete: function () {
                    self.revealer.style.WebkitTransformOrigin = self.revealer.style.transformOrigin = transformSettings.origin.halfway;
                    if (typeof revealSettings.onCover === 'function') {
                        revealSettings.onCover(self.content, self.revealer);
                    }
                    anime(animationSettings_2);
                }
            } as any;

        animationSettings.targets = animationSettings_2.targets = this.revealer;
        animationSettings.duration = animationSettings_2.duration = revealSettings.duration || defaults.duration;
        animationSettings.easing = animationSettings_2.easing = revealSettings.easing || defaults.easing;

        var coverArea = revealSettings.coverArea || defaults.coverArea;
        if (direction === 'lr' || direction === 'rl') {
            animationSettings.scaleX = [0, 1];
            animationSettings_2.scaleX = [1, coverArea / 100];
        }
        else {
            animationSettings.scaleY = [0, 1];
            animationSettings_2.scaleY = [1, coverArea / 100];
        }

        if (typeof revealSettings.onStart === 'function') {
            revealSettings.onStart(self.content, self.revealer);
        }
        anime(animationSettings);
    };
}


export interface SplitLayoutOptions {
    leftLayout?: IKoLayout,
    rightLayout?: IKoLayout
}

const SplitLayoutDefaults = {
    leftLayout: ()=>undefined,
    rightLayout: ()=>undefined
} as Factory<SplitLayoutOptions>;




@defaults(SplitLayoutDefaults,true)
export class SplitLayout extends KoLayout {


    @observable leftLayout: IKoLayout;
    @observable rightLayout: IKoLayout;    



    constructor(protected layoutOptions: SplitLayoutOptions = {}) {
        super(
            {
                name: SplitLayoutTemplate,
                as: "$SplitLayout",
                afterRender: (...args: any[]) =>this.afterRender.apply(this,args)
            } as KnockoutTemplateBindingHandlerOptions);
       
        document.body.classList.add("keep-loading");
    }

    protected afterRender(nodes: HTMLElement[], layout: this    ) {
     
        let splitContent = document.querySelector('.dual__content');
        let s = getComputedStyle(splitContent);
        console.log(s);
        console.log(s.width);
        let parent = getComputedStyle(splitContent.parentElement);
        console.log(parseFloat(s.width) / parseFloat(parent.width));

        let    rev1 = new RevealFx(document.querySelector('#rev-1') as HTMLElement, {
                revealSettings: {
                    bgcolor: '#2d2c2c',
                    direction: 'rl',
                    duration: 600,
                    easing: 'easeInOutCirc',
                    coverArea: parseFloat(s.width) / parseFloat(parent.width)*100,
                    onCover: function (contentEl: HTMLElement, revealerEl: HTMLElement) {
                        contentEl.style.opacity = "1";
                        splitContent.classList.add('dual__content--show');
                       
                    },
                    onComplete: function (contentEl: HTMLElement, revealerEl: HTMLElement) {
                        document.body.classList.add("loading-bottom");
                        setTimeout(() => {
                            console.log("removing loading");
                            document.body.classList.remove('loading');
                            document.body.classList.remove("loading-bottom");
                        },1000);
                    
                    },
                }
            });
        rev1.reveal();
        
    }


}


export default SplitLayout;