let connectedGamepadIndex = null;
let focusableElements = [];
let currentFocusIndex = -1;
let inputCooldown = false;

const style = document.createElement('style');
style.textContent = `
    :focus {
        outline: 4px solid #007bff !important;
        outline-offset: 4px !important;
        background-color: rgba(0, 123, 255, 0.1) !important;
        transition: outline 0.1s ease-in-out !important;
    }
`;
document.head.appendChild(style);

function updateFocusableElements() {
    const allElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex="0"]');
    
    focusableElements = Array.from(allElements).filter(el => {
        const isVisible = el.offsetParent !== null;
        const style = window.getComputedStyle(el);
        const isNotHiddenStyle = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        
        return isVisible && isNotHiddenStyle;
    });
}

window.addEventListener("gamepadconnected", (e) => {
    connectedGamepadIndex = e.gamepad.index;
    updateFocusableElements();
    requestAnimationFrame(updateControllerStatus);
});

window.addEventListener("gamepaddisconnected", (e) => {
    connectedGamepadIndex = null;
});

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

    if (currentFocusIndex !== -1) {
        focusableElements[currentFocusIndex].blur();
    }

    currentFocusIndex += direction;
    if (currentFocusIndex >= focusableElements.length) currentFocusIndex = 0;
    if (currentFocusIndex < 0) currentFocusIndex = focusableElements.length - 1;

    focusableElements[currentFocusIndex].focus();
}

function triggerCooldown() {
    inputCooldown = true;
    setTimeout(() => {
        inputCooldown = false;
    }, 200);
}

const observer = new MutationObserver(updateFocusableElements);
observer.observe(document.body, { childList: true, subtree: true });
