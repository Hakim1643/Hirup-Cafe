document.addEventListener("DOMContentLoaded", () => {
    // 1. Detect which blue zone is available on the current page
    const heroSection = document.querySelector(".hero");
    const headerSection = document.querySelector("header");
    
    const targetSection = heroSection ? heroSection : headerSection;
    if (!targetSection) return;

    // 2. Build the pattern box container
    const container = document.createElement("div");
    container.id = "bg-pattern-container";
    targetSection.appendChild(container);

    // Keep track of where we place every single sticker
    const placedStickers = [];

    // Set sticker count based on space
    const totalStickers = heroSection ? 18 : 5; // Reduced slightly for better spacing with collision math
    
    for (let i = 0; i < totalStickers; i++) {
        const sticker = document.createElement("div");
        sticker.classList.add("bg-sticker");

        // WIDER SIZE VARIETY
        const maxStickerSize = heroSection ? 150 : 55;
        const minStickerSize = heroSection ? 45 : 25;
        const size = Math.floor(Math.random() * (maxStickerSize - minStickerSize)) + minStickerSize;
        sticker.style.width = `${size}px`;
        sticker.style.height = `${size}px`;

        let randomX = 0;
        let randomY = 0;
        let overlapping = false;
        let attempts = 0;
        const maxAttempts = 100; // Guard to prevent infinite loops if space runs out

        // 3. Collision Detection Loop
        do {
            overlapping = false;
            attempts++;

            // Pick a random spot (X: 0-92%, Y: 5-75%)
            randomX = Math.floor(Math.random() * 92);
            randomY = Math.floor(Math.random() * 70) + 5;

            // Check this spot against every zebra we already placed
            for (let existing of placedStickers) {
                // Calculate distance using horizontal and vertical percent differences
                const distanceX = Math.abs(existing.x - randomX);
                const distanceY = Math.abs(existing.y - randomY);
                
                // Define safety clearance padding based on sticker sizes
                // If they are closer than 15% horizontally or 15% vertically, they overlap!
                if (distanceX < 15 && distanceY < 15) {
                    overlapping = true;
                    break; // Stop checking, pick a new spot
                }
            }
        } while (overlapping && attempts < maxAttempts);

        // Save our final safe coordinates so future stickers can check against them
        placedStickers.push({ x: randomX, y: randomY });

        // Apply coordinates to the element
        sticker.style.left = `${randomX}%`;
        sticker.style.top = `${randomY}%`;

        // Randomize tilt angle rotation
        const rotation = Math.floor(Math.random() * 80) - 40;
        
        // Randomly flip orientation left or right
        const flip = Math.random() > 0.5 ? 1 : -1;

        // Opacity adjustments based on sizing
        let randomOpacity = (Math.random() * 0.15) + 0.25; 
        if (size > 110) {
            randomOpacity = 0.18;
        } else if (size < 60) {
            randomOpacity = 0.38;
        }
        
        // Set layout launch origin position (appearing from below the container floor)
        sticker.style.transform = `translateY(180px) scale(0.2) rotate(0deg)`;
        sticker.style.opacity = "0";

        // Staggered cascade loading animation timeline layout
        setTimeout(() => {
            sticker.style.opacity = randomOpacity;
            sticker.style.transform = `translateY(0) scale(1) rotate(${rotation}deg) scaleX(${flip})`;
        }, i * 50);

        container.appendChild(sticker);
    }
});