import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import { NextResponse } from 'next/server';
import { getSessions } from '../../../../firebase'; // Correct import statement

export async function GET() {
  try {
    const landPlotWidth = 330;
    const landPlotHeight = 240;

    // Define padding value (e.g., 10 pixels)
    const padding = 30;
    const plantPadding = 10; // Minimum distance between plant images

    // Load the land plot images
    const landPlotDirtImagePath = path.resolve('./public/plant_images/land_plot_dirt.png');
    const landPlotGrassImagePath = path.resolve('./public/plant_images/land_plot_grass.png');
    
    const landPlotDirtImage = await loadImage(landPlotDirtImagePath);
    const landPlotGrassImage = await loadImage(landPlotGrassImagePath);

    // Create a canvas and context for land plot grass image
    const grassCanvas = createCanvas(landPlotWidth, landPlotHeight);
    const grassCtx = grassCanvas.getContext('2d');

    // Draw the grass image
    grassCtx.drawImage(landPlotGrassImage, 0, 0, landPlotWidth, landPlotHeight);

    // Get the image data for transparency analysis from the grass image
    const grassImageData = grassCtx.getImageData(0, 0, landPlotWidth, landPlotHeight);
    const grassData = grassImageData.data;

    // Store non-transparent pixels within the bounds
    const nonTransparentPixels: { x: number, y: number }[] = [];

    // Loop through each pixel to find non-transparent pixels
    for (let y = 0; y < landPlotHeight; y++) {
      for (let x = 0; x < landPlotWidth; x++) {
        const index = (y * landPlotWidth + x) * 4;
        const alpha = grassData[index + 3]; // The alpha channel

        if (alpha !== 0) {
          nonTransparentPixels.push({ x, y });
        }
      }
    }

    // Create a canvas for the final image
    const canvas = createCanvas(landPlotWidth, landPlotHeight);
    const ctx = canvas.getContext('2d');

    // Draw the combined land plot images as the base
    ctx.drawImage(landPlotDirtImage, 0, 0, landPlotWidth, landPlotHeight);
    ctx.drawImage(landPlotGrassImage, 0, 0, landPlotWidth, landPlotHeight);

    // Fetch session data from Firebase
    const sessions = await getSessions();

    // Array to keep track of placed plant positions
    const placedPlants: { x: number, y: number }[] = [];

    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        if (session.plantNumber !== undefined && session.plantStage !== undefined) {
          const plantImagePath = path.resolve(`./public/plant_images/plant_${session.plantNumber}_stage_${session.plantStage}.png`);
          try {
            const plantImage = await loadImage(plantImagePath);

            const plantImageWidth = 48;
            const plantImageHeight = 48;

            let placementX: number = -1; // Initialize with a default value
            let placementY: number = -1; // Initialize with a default value
            let validPlacementFound = false;

            // Ensure the entire bottom of the plant image is within the bounds
            while (!validPlacementFound) {
              // Randomly select a non-transparent pixel for placement
              const randomIndex = Math.floor(Math.random() * nonTransparentPixels.length);
              const { x, y } = nonTransparentPixels[randomIndex];
            
              // Calculate the placement point to align the bottom middle of the plant image
              placementX = x - plantImageWidth / 2;
              placementY = y - plantImageHeight;
            
              // Ensure the placement is within the bounds with padding
              if (
                placementX >= padding &&
                placementX + plantImageWidth <= landPlotWidth - padding &&
                placementY >= padding &&
                placementY + plantImageHeight <= landPlotHeight - padding
              ) {
                // Check distance from other plants
                let tooClose = false;
                for (const plant of placedPlants) {
                  const dx = Math.abs(placementX - plant.x);
                  const dy = Math.abs(placementY - plant.y);
                  const distance = Math.sqrt(dx * dx + dy * dy);

                  if (distance < plantPadding) {
                    tooClose = true;
                    break;
                  }
                }

                if (!tooClose) {
                  validPlacementFound = true;
                  placedPlants.push({ x: placementX, y: placementY });
                }
              }
            }

            // Draw the plant image at the calculated position
            if (placementX >= 0 && placementY >= 0) {
              ctx.drawImage(plantImage, placementX, placementY, plantImageWidth, plantImageHeight);
            }
          } catch (imageError) {
            console.error(`Error loading image: ${plantImagePath}`, imageError);
          }
        } else {
          console.warn(`Undefined plantNumber or plantStage for session:`, session);
        }
      }
    } else {
      console.warn('No sessions available or sessions is undefined.');
    }

    const buffer = canvas.toBuffer('image/png');

    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    });
  } catch (error) {
    console.error('Error generating image:', error);

    return new NextResponse('Error generating image', {
      status: 500,
    });
  }
}
