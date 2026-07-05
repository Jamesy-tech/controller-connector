// controller.js

let connectedGamepadIndex = null;
let focusableElements = [];
let currentFocusIndex = -1;
let inputCooldown = false; // Prevents flying through menus too fast

// 1. Find all focusable elements on the current page
function updateFocusableElements() {
    focusableElements = Array.from(document.querySelectorAll('button, a, input, select, textarea, [tabindex="0"]'));
}

// 2. Listen for the controller connecting
window.addEventListener("gamepadconnected", (e) => {
    console.log(`Controller connected: ${e.gamepad.id}`);
    connectedGamepadIndex = e.gamepad.index;
    updateFocusableElements();
    
    // Start the game loop
    requestAnimationFrame(updateControllerStatus);
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Controller disconnected");
    connectedGamepadIndex = null;
});

// 3. Main loop to check controller state
function updateControllerStatus() {
    if (connectedGamepadIndex === null) return;

    const gamepads = navigator.getGamepads();
    const gp = gamepads[connectedGamepadIndex];

    if (!gp) return;

    // Read D-pad or Left Analog Stick inputs
    const dpadUp = gp.buttons[12]?.pressed;
    const dpadDown = gp.buttons[13]?.pressed;
    const axisLeftStickY = gp.axes[1]; // -1 is Up, 1 is Down

    // Read Action Button (Cross/X button on PS5 is usually button 0)
    const actionButtonPressed = gp.buttons[0]?.pressed;

    if (!inputCooldown) {
        // Move Down
        if (dpadDown || axisLeftStickY > 0.5) {
            navigateMenu(1);
            triggerCooldown();
        }
        // Move Up
        if (dpadUp || axisLeftStickY < -0.5) {
            navigateMenu(-1);
            triggerCooldown();
        }
        // Click the focused element
        if (actionButtonPressed && currentFocusIndex !== -1) {
            focusableElements[currentFocusIndex].click();
            triggerCooldown();
        }
    }

    // Keep checking every frame
    requestAnimationFrame(updateControllerStatus);
}

// 4. Move the focus index up or down
function navigateMenu(direction) {
    if (focusableElements.length === 0) return;

    // Remove custom visual style from previous element if necessary
    if (currentFocusIndex !== -1) {
        focusableElements[currentFocusIndex].blur();
    }

    // Calculate next item index (loops around)
    currentFocusIndex += direction;
    if (currentFocusIndex >= focusableElements.length) currentFocusIndex = 0;
    if (currentFocusIndex < 0) currentFocusIndex = focusableElements.length - 1;

    // Focus the new element
    focusableElements[currentFocusIndex].focus();
}

// 5. Cooldown timer so one tap doesn't skip 10 buttons
function triggerCooldown() {
    inputCooldown = true;
    setTimeout(() => {
        inputCooldown = false;
    }, 200); // 200ms delay between inputs
}

// Dynamically refresh elements if the page layout changes
const observer = new MutationObserver(updateFocusableElements);
observer.observe(document.body, { childList: true, subtree: true });
