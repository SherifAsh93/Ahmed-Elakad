#!/usr/bin/env node
/**
 * Update Neon database with restored content.json
 * 
 * This script reads the local content.json and pushes it to the
 * site_content table in the Neon database.
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not found in .env.local');
  process.exit(1);
}

// Load content.json
const contentPath = path.join(__dirname, '..', 'data', 'content.json');
console.log('Reading content.json from:', contentPath);
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

// Connect to database
console.log('Connecting to Neon database...');
const sql = neon(DATABASE_URL);

async function updateContent() {
  try {
    // Check if site_content row exists
    const existing = await sql`SELECT id FROM site_content WHERE id = 'site'`;
    
    if (existing.length > 0) {
      // Update existing row
      console.log('Updating existing site_content row...');
      await sql`
        UPDATE site_content 
        SET data = ${JSON.stringify(content)}, updated_at = NOW()
        WHERE id = 'site'
      `;
    } else {
      // Insert new row
      console.log('Inserting new site_content row...');
      await sql`
        INSERT INTO site_content (id, data, updated_at)
        VALUES ('site', ${JSON.stringify(content)}, NOW())
      `;
    }
    
    console.log('SUCCESS: Database updated with restored content');
    
    // Verify the update
    const verify = await sql`SELECT id, data FROM site_content WHERE id = 'site'`;
    if (verify.length > 0) {
      const data = verify[0].data;
      let bridalCount = 0;
      let coutureCount = 0;
      
      if (data.bridal && data.bridal.years) {
        Object.values(data.bridal.years).forEach(y => {
          if (y.collections) {
            y.collections.forEach(col => {
              bridalCount += (col.images || []).length;
            });
          }
        });
      }
      
      if (data.couture && data.couture.years) {
        Object.values(data.couture.years).forEach(y => {
          if (y.collections) {
            y.collections.forEach(col => {
              coutureCount += (col.images || []).length;
            });
          }
        });
      }
      
      console.log('Verification:');
      console.log('  Bridal images:', bridalCount);
      console.log('  Couture images:', coutureCount);
    }
    
  } catch (error) {
    console.error('ERROR updating database:', error);
    process.exit(1);
  }
}

updateContent();
