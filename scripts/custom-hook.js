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
    }, 100);

    // Stop polling after 20 seconds
    setTimeout(() => clearInterval(interval), 20000);

    // Force UI Sync Loop (Robustness for Setting Icon and Hearts)
    setInterval(() => {
        const menu = document.getElementById('game-menu');
        const icon = document.getElementById('ingame-setting-icon');
        const hearts = document.getElementById('player-hearts');
        const settingModal = document.getElementById('setting-modal');
        const spaceshipScreen = document.getElementById('spaceship-screen');
        const loadingScreen = document.getElementById('loading-screen');
        
        if (menu && icon && hearts && settingModal) {
            const menuDisplay = window.getComputedStyle(menu).display;
            const modalDisplay = window.getComputedStyle(settingModal).display;
            const spaceshipDisplay = spaceshipScreen ? window.getComputedStyle(spaceshipScreen).display : 'none';
            const loadingDisplay = loadingScreen ? window.getComputedStyle(loadingScreen).display : 'none';
            
            // Logic: Game is truly running ONLY if:
            // 1. Menu is hidden
            // 2. Loading screen is hidden
            // 3. Spaceship screen is hidden
            
            const isGameTrulyRunning = (menuDisplay === 'none') && 
                                       (loadingDisplay === 'none') && 
                                       (spaceshipDisplay === 'none');

            // If game is running (menu hidden)
            if (isGameTrulyRunning) {
                // Handle Setting Icon
                if (modalDisplay === 'none') {
                    if (icon.style.display !== 'block') {
                        icon.style.display = 'block';
                        icon.style.zIndex = "99999";
                        icon.style.visibility = "visible";
                        icon.style.opacity = "1";
                    }
                } else {
                    if (icon.style.display !== 'none') icon.style.display = 'none';
                }

                // Handle Hearts (Always show in-game)
                if (hearts.style.display !== 'flex') {
                    hearts.style.display = 'flex';
                    hearts.style.zIndex = "99999";
                    hearts.style.visibility = "visible";
                    hearts.style.opacity = "1";
                    // console.log("CustomHook: Force showing hearts");
                }
            } else {
                // Menu is visible, hide in-game UI
                if (icon.style.display !== 'none') icon.style.display = 'none';
                if (hearts.style.display !== 'none') hearts.style.display = 'none';
            }
        }
    }, 500);

})();
