(function() {
    console.log("Initializing Custom C3 Hooks...");

    // Trap the assignment of C3_GetObjectRefTable
    let realRefTableFn = undefined;

    Object.defineProperty(self, "C3_GetObjectRefTable", {
        get: function() {
            return realRefTableFn;
        },
        set: function(fn) {
                console.log("Trapped assignment of C3_GetObjectRefTable!");
                
                // Wrap the function
                realRefTableFn = function() {
                    console.log("C3_GetObjectRefTable EXECUTION intercepted.");
                    const list = fn.apply(this, arguments);

                    // Inject hooks into the returned list
                    if (window.C3 && window.C3.Plugins && window.C3.Plugins.System) {
                        const restartFn = window.C3.Plugins.System.Acts.RestartLayout;
                        const goToFn = window.C3.Plugins.System.Acts.GoToLayout;
                    const spriteDestroyFn = window.C3.Plugins.Sprite && window.C3.Plugins.Sprite.Acts && window.C3.Plugins.Sprite.Acts.Destroy;
                    const shapeDestroyFn = window.C3.Plugins.Shape3D && window.C3.Plugins.Shape3D.Acts && window.C3.Plugins.Shape3D.Acts.Destroy;
                    const keyboardCnds = window.C3.Plugins.Keyboard && window.C3.Plugins.Keyboard.Cnds;
                    const eightDirSimCtrlFn = window.C3.Behaviors && window.C3.Behaviors.EightDir && window.C3.Behaviors.EightDir.Acts && window.C3.Behaviors.EightDir.Acts.SimulateControl;
                        
                        for (let i = 0; i < list.length; i++) {
                            if (restartFn && list[i] === restartFn) {
                            console.log("Hooking RestartLayout at index " + i);
                            list[i] = function(...args) {
                            console.log("Hook: RestartLayout Triggered!");
                            // Prevent actual restart if game over
                            if (window.playerLives <= 0) {
                                console.log("Game Over - Blocking RestartLayout");
                                return; 
                            }
                            if (window.onPlayerDeath) window.onPlayerDeath();
                            const ret = restartFn.apply(this, args);
                            if (window.onLevelRestart) setTimeout(window.onLevelRestart, 500);
                            return ret;
                        };
                    }
                    if (goToFn && list[i] === goToFn) {
                        console.log("Hooking GoToLayout at index " + i);
                        list[i] = function(...args) {
                            console.log("Hook: GoToLayout Triggered!");
                            // Prevent actual layout change if game over
                            if (window.playerLives <= 0) {
                                console.log("Game Over - Blocking GoToLayout");
                                return;
                            }
                            if (window.onPlayerDeath) window.onPlayerDeath();
                            const ret = goToFn.apply(this, args);
                            if (window.onLevelRestart) setTimeout(window.onLevelRestart, 500);
                            return ret;
                        };
                    }
                    if (spriteDestroyFn && list[i] === spriteDestroyFn) {
                        console.log("Hooking Sprite.Destroy at index " + i);
                        const original = spriteDestroyFn;
                        list[i] = function(...args) {
                            try {
                                const nameGuess = (this && (this.GetObjectClass?.().GetName?.() || this.GetObjectClassName?.() || this.name)) || "";
                                if (nameGuess && /gem/i.test(String(nameGuess))) {
                                    if (window.onRewardPickup) window.onRewardPickup();
                                }
                            } catch (err) {}
                            return original.apply(this, args);
                        };
                    }
                            if (shapeDestroyFn && list[i] === shapeDestroyFn) {
                                console.log("Hooking Shape3D.Destroy at index " + i);
                                const originalShapeDestroy = shapeDestroyFn;
                                list[i] = function(...args) {
                                    try {
                                        const nameGuess = (this && (this.GetObjectClass?.().GetName?.() || this.GetObjectClassName?.() || this.name)) || "";
                                        if (nameGuess && /gem/i.test(String(nameGuess))) {
                                            if (window.onRewardPickup) window.onRewardPickup();
                                        }
                                    } catch (err) {}
                                    return originalShapeDestroy.apply(this, args);
                                };
                            }
                            
                        }
                    } else {
                        console.warn("C3 Plugins not ready during RefTable execution. Retrying via Acts directly later.");
                    }

                    return list;
                };
            },
            configurable: true
        });

    // Backup: Polling for direct Acts modification (in case RefTable hook missed or Plugins weren't ready)
    const interval = setInterval(() => {
        if (window.C3 && window.C3.Plugins && window.C3.Plugins.System && window.C3.Plugins.System.Acts) {
            const acts = window.C3.Plugins.System.Acts;
            
            if (acts.RestartLayout && !acts.RestartLayout.hooked) {
                console.log("Directly hooking RestartLayout (Backup)");
                const originalRestart = acts.RestartLayout;
                acts.RestartLayout = function(...args) {
                    console.log("Hook: RestartLayout (Direct)");
                    // Prevent actual restart if game over
                    if (window.playerLives <= 0) {
                        console.log("Game Over - Blocking RestartLayout");
                        return;
                    }
                    if (window.onPlayerDeath) window.onPlayerDeath();
                    const ret = originalRestart.apply(this, args);
                    if (window.onLevelRestart) setTimeout(window.onLevelRestart, 500);
                    return ret;
                };
                acts.RestartLayout.hooked = true;
            }

            if (acts.GoToLayout && !acts.GoToLayout.hooked) {
                 console.log("Directly hooking GoToLayout (Backup)");
                 const originalGoTo = acts.GoToLayout;
                 acts.GoToLayout = function(...args) {
                    console.log("Hook: GoToLayout (Direct)");
                    // Prevent actual layout change if game over
                    if (window.playerLives <= 0) {
                        console.log("Game Over - Blocking GoToLayout");
                        return;
                    }
                    if (window.onPlayerDeath) window.onPlayerDeath();
                    const ret = originalGoTo.apply(this, args);
                    if (window.onLevelRestart) setTimeout(window.onLevelRestart, 500);
                    return ret;
                 };
                 acts.GoToLayout.hooked = true;
            }
        }
        if (window.C3 && window.C3.Plugins && !window.__hookedDestroyOnce) {
            try {
                const spriteActs = window.C3.Plugins.Sprite?.Acts;
                const shapeActs = window.C3.Plugins.Shape3D?.Acts;
                const eightDirActs = window.C3.Behaviors?.EightDir?.Acts;
                const keyboardCnds = window.C3.Plugins?.Keyboard?.Cnds;
                const gamepadCnds = window.C3.Plugins?.gamepad?.Cnds;
                const systemExps = window.C3.Plugins?.System?.Exps;
                if (spriteActs?.Destroy && !spriteActs.Destroy.hooked) {
                    const original = spriteActs.Destroy;
                    spriteActs.Destroy = function(...args) {
                        try {
                            const nameGuess = (this && (this.GetObjectClass?.().GetName?.() || this.GetObjectClassName?.() || this.name)) || "";
                            if (nameGuess && /gem/i.test(String(nameGuess))) {
                                if (window.onRewardPickup) window.onRewardPickup();
                            }
                        } catch (err) {}
                        return original.apply(this, args);
                    };
                    spriteActs.Destroy.hooked = true;
                }
                if (shapeActs?.Destroy && !shapeActs.Destroy.hooked) {
                    const originalShapeDestroy = shapeActs.Destroy;
                    shapeActs.Destroy = function(...args) {
                        try {
                            const nameGuess = (this && (this.GetObjectClass?.().GetName?.() || this.GetObjectClassName?.() || this.name)) || "";
                            if (nameGuess && /gem/i.test(String(nameGuess))) {
                                if (window.onRewardPickup) window.onRewardPickup();
                            }
                        } catch (err) {}
                        return originalShapeDestroy.apply(this, args);
                    };
                    shapeActs.Destroy.hooked = true;
                }
                
                
                window.__hookedDestroyOnce = true;
            } catch (err) {
                console.warn("Error hooking destroy acts: ", err);
            }
        }
    }, 100);

    // Stop polling after 20 seconds
    setTimeout(() => clearInterval(interval), 20000);

    setInterval(() => {
        const menu = document.getElementById('game-menu');
        const icon = document.getElementById('ingame-setting-icon');
        const hearts = document.getElementById('player-hearts');
        const gemCounter = document.getElementById('gem-counter');
        const settingModal = document.getElementById('setting-modal');
        const canvas = document.querySelector('canvas');
        if (menu && icon && hearts && settingModal) {
            const menuHidden = window.getComputedStyle(menu).display === 'none';
            const canvasReady = !!canvas && canvas.clientWidth > 0 && canvas.clientHeight > 0 && window.getComputedStyle(canvas).display !== 'none' && window.getComputedStyle(canvas).visibility !== 'hidden';
            const isGameRunning = menuHidden && canvasReady;
            if (isGameRunning) {
                if (window.getComputedStyle(settingModal).display === 'none') {
                    if (icon.style.display !== 'block') {
                        icon.style.display = 'block';
                        icon.style.zIndex = "99999";
                        icon.style.visibility = "visible";
                        icon.style.opacity = "1";
                    }
                } else {
                    if (icon.style.display !== 'none') icon.style.display = 'none';
                }
                if (hearts.style.display !== 'flex') {
                    hearts.style.display = 'flex';
                    hearts.style.zIndex = "99999";
                    hearts.style.visibility = "visible";
                    hearts.style.opacity = "1";
                }
                if (gemCounter && gemCounter.style.display !== 'block') {
                    gemCounter.style.display = 'block';
                }
            } else {
                if (icon.style.display !== 'none') icon.style.display = 'none';
                if (hearts.style.display !== 'none') hearts.style.display = 'none';
                if (gemCounter && gemCounter.style.display !== 'none') gemCounter.style.display = 'none';
            }
        }
    }, 500);

    // Hook instance destroy for reward pickup (Gem/Reward)
    (function hookInstanceDestroy() {
        const HOOK_DELAY = 100;
        const timer = setInterval(() => {
            try {
                if (self.IInstance && !self.__rewardDestroyHooked) {
                    const originalDestroy = self.IInstance.prototype.destroy;
                    self.IInstance.prototype.destroy = function(...args) {
                        try {
                            if (!window.__c3_runtime && this?.runtime) {
                                window.__c3_runtime = this.runtime;
                            }
                            const objName = String(this?.objectType?.name || "").toLowerCase();
                            if (objName.includes('gem') || objName.includes('reward')) {
                                if (window.onRewardPickup) window.onRewardPickup();
                            }
                        } catch (err) {}
                        return originalDestroy.apply(this, args);
                    };
                    self.__rewardDestroyHooked = true;
                    clearInterval(timer);
                }
            } catch (err) {
                // Keep trying until runtime ready
            }
        }, HOOK_DELAY);
    })();

    

})();
