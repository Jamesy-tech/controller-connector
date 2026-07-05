let connectedGamepadIndex = null;
let focusableElements = [];
let currentFocusIndex = -1;
let inputCooldown = false;

function injectStyles() {
    if (document.getElementById('controller-navigation-styles')) return;
    const style = document.createElement('style');
    style.id = 'controller-navigation-styles';
    style.textContent = `
        :focus {
            outline: 4px solid #007bff !important;
            outline-offset: 4px !important;
            background-color: rgba(0, 123, 255, 0.1) !important;
            transition: outline 0.1s ease-in-out !important;
        }
    `;
    if (document.head) {
        document.head.appendChild(style);
    } else {
        document.documentElement.appendChild(style);
    }
}

function updateFocusableElements() {
    const allElements = document.getElementsByTagName('*');
    focusableElements = [];

    for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];

        if (el.offsetParent === null) {
            continue;
        }

        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            continue;
        }

        const tagName = el.tagName.toLowerCase();
        const hasOnClickAttr = el.hasAttribute('onclick') || el.onclick !== null;
        const hasTabindex = el.hasAttribute('tabindex');
        const isStandardInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(tagName);
        const hasPointerCursor = style.cursor === 'pointer';

        if (isStandardInteractive || hasOnClickAttr || hasTabindex || hasPointerCursor) {
            if (!hasTabindex && !isStandardInteractive) {
                el.setAttribute('tabindex', '0');
            }
            focusableElements.push(el);
        }
    }
}

function updateControllerStatus() {
    if (connectedGamepadIndex === null) return;

    const gamepads = navigator.getGamepads();
    const gp = gamepads[connectedGamepadIndex];

    if (!gp) return;

    const dpadUp = gp.buttons[12]?.pressed;
    const dpadDown = gp.buttons[13]?.pressed;
    const axisLeftStickY = gp.axes[1];
    const actionButtonPressed = gp.buttons[0]?.pressed;

    if (!inputCooldown) {
        if (dpadDown || axisLeftStickY > 0.5) {
            navigateMenu(1);
            triggerCooldown();
        }
        if (dpadUp || axisLeftStickY < -0.5) {
            navigateMenu(-1);
            triggerCooldown();
        }
        if (actionButtonPressed && currentFocusIndex !== -1) {
            focusableElements[currentFocusIndex].click();
            triggerCooldown();
        }
    }

    requestAnimationFrame(updateControllerStatus);
}

function navigateMenu(direction) {
    if (focusableElements.length === 0) return;

    if (currentFocusIndex !== -1 && focusableElements[currentFocusIndex]) {
        focusableElements[currentFocusIndex].blur();
    }

    currentFocusIndex += direction;
    if (currentFocusIndex >= focusableElements.length) currentFocusIndex = 0;
    if (currentFocusIndex < 0) currentFocusIndex = focusableElements.length - 1;

    if (focusableElements[currentFocusIndex]) {
        focusableElements[currentFocusIndex].focus();
    }
}

function triggerCooldown() {
    inputCooldown = true;
    setTimeout(() => {
        inputCooldown = false;
    }, 200);
}

function init() {
    injectStyles();
    updateFocusableElements();
    
    window.addEventListener("gamepadconnected", (e) => {
        connectedGamepadIndex = e.gamepad.index;
        updateFocusableElements();
        requestAnimationFrame(updateControllerStatus);
    });

    window.addEventListener("gamepaddisconnected", (e) => {
        connectedGamepadIndex = null;
    });

    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
