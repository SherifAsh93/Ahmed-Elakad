#!/usr/bin/env node
/**
 * Restore missing bridal/couture collections from VPS backup
 * 
 * This script:
 * 1. Reads the backup content.json from D:\VPS-Backup
 * 2. Reads the current content.json
 * 3. Finds missing collections in bridal.years and couture.years
 * 4. Remaps local media URLs to Cloudinary equivalents
 * 5. Merges restored collections into current content.json
 * 6. Saves the updated content.json
 */

const fs = require('fs');
const path = require('path');

const BACKUP_PATH = 'D:/VPS-Backup/content.json';
const CURRENT_PATH = 'D:/WebistryDev/Projects/Ahmed-Elakad/data/content.json';
const OUTPUT_PATH = 'D:/WebistryDev/Projects/Ahmed-Elakad/data/content.json';

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dzppk5ylt/image/upload/Ahmed%20Elakad/media-migrated/';

// Load files
console.log('Loading backup content.json...');
const backup = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));

console.log('Loading current content.json...');
const current = JSON.parse(fs.readFileSync(CURRENT_PATH, 'utf8'));

/**
 * Remap a local media URL to Cloudinary
 */
function remapUrl(url) {
  if (!url) return url;
  
  // If already Cloudinary, return as-is
  if (url.includes('cloudinary.com')) return url;
  
  // Extract filename from local URL
  const match = url.match(/ahmedelakad\.com\/media\/([^"'?]+)/);
  if (match) {
    const filename = match[1];
    return CLOUDINARY_BASE + filename;
  }
  
  // Can't remap, return original
  return url;
}

/**
 * Remap all images in a collection
 */
function remapCollection(collection) {
  const remapped = { ...collection };
  if (remapped.images && Array.isArray(remapped.images)) {
    remapped.images = remapped.images.map(remapUrl);
  }
  if (remapped.coverImage) {
    remapped.coverImage = remapUrl(remapped.coverImage);
  }
  return remapped;
}

/**
 * Restore missing collections for a section (bridal or couture)
 */
function restoreSection(sectionName) {
  const backupSection = backup[sectionName];
  const currentSection = current[sectionName];
  
  if (!backupSection || !backupSection.years) {
    console.log(`  No backup data for ${sectionName}`);
    return { restored: 0, imagesAdded: 0 };
  }
  
  let totalRestored = 0;
  let totalImagesAdded = 0;
  
  for (const [year, backupYear] of Object.entries(backupSection.years)) {
    if (!backupYear || !backupYear.collections) continue;
    
    // Initialize year in current if missing
    if (!currentSection.years[year]) {
      currentSection.years[year] = { collections: [] };
      console.log(`  Created new year: ${sectionName} ${year}`);
    }
    
    const currentCollections = currentSection.years[year].collections;
    const currentIds = new Set(currentCollections.map(c => c.id));
    
    for (const backupCollection of backupYear.collections) {
      if (currentIds.has(backupCollection.id)) {
        // Collection exists, but check if it has more images
        const existing = currentCollections.find(c => c.id === backupCollection.id);
        if (existing && backupCollection.images.length > existing.images.length) {
          // Backup has more images, merge them
          const existingUrls = new Set(existing.images);
          const newImages = backupCollection.images
            .map(remapUrl)
            .filter(url => !existingUrls.has(url));
          
          if (newImages.length > 0) {
            existing.images = [...existing.images, ...newImages];
            totalImagesAdded += newImages.length;
            console.log(`  Added ${newImages.length} images to existing collection ${backupCollection.id} in ${sectionName} ${year}`);
          }
        }
      } else {
        // Collection is missing, restore it
        const restored = remapCollection(backupCollection);
        currentCollections.push(restored);
        totalRestored++;
        totalImagesAdded += restored.images.length;
        console.log(`  Restored collection ${backupCollection.id} (${restored.images.length} images) in ${sectionName} ${year}`);
      }
    }
  }
  
  return { restored: totalRestored, imagesAdded: totalImagesAdded };
}

// Restore bridal
console.log('\n=== Restoring Bridal Collections ===');
const bridalResult = restoreSection('bridal');

// Restore couture
console.log('\n=== Restoring Couture Collections ===');
const coutureResult = restoreSection('couture');

// Summary
console.log('\n=== Summary ===');
console.log(`Bridal: ${bridalResult.restored} collections restored, ${bridalResult.imagesAdded} images added`);
console.log(`Couture: ${coutureResult.restored} collections restored, ${coutureResult.imagesAdded} images added`);
console.log(`Total: ${bridalResult.restored + coutureResult.restored} collections, ${bridalResult.imagesAdded + coutureResult.imagesAdded} images`);

// Verify no local URLs remain
const outputStr = JSON.stringify(current);
const localUrls = outputStr.match(/ahmedelakad\.com\/media\//g);
console.log(`\nLocal media URLs remaining: ${localUrls ? localUrls.length : 0}`);

// Count total images
let totalBridal = 0;
let totalCouture = 0;
Object.values(current.bridal.years).forEach(y => {
  y.collections.forEach(col => totalBridal += col.images.length);
});
Object.values(current.couture.years).forEach(y => {
  y.collections.forEach(col => totalCouture += col.images.length);
});
console.log(`Total bridal images: ${totalBridal}`);
console.log(`Total couture images: ${totalCouture}`);

// Save
console.log('\nSaving updated content.json...');
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(current, null, 2), 'utf8');
console.log('Done! Updated content.json saved to:', OUTPUT_PATH);
